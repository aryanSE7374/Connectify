import { peerConfigConnections } from '../config/peerConfig';
import io from "socket.io-client";

// WebRTC handshake : Offer -> Answer -> ICE exchange
export const gotMessageFromServer = async (fromId, message, socketRef, connections) => {
    const signal = JSON.parse(message);
    const pc = connections[fromId];

    if (!pc) return;

    // 1️⃣ Handle SDP
    if (signal.sdp) {
        console.log("SDP received from:", fromId);

        // Apply Remote Description : Accept the other peer's configuration 
        // if its an answer, we accept it (no reply needed)
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

        // If it's an offer → create answer
        if (signal.sdp.type === "offer") {
            console.log("Creating answer for:", fromId);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketRef.current.emit("signal", fromId, JSON.stringify({
                sdp: pc.localDescription
            }));
        }
    }

    // 2️⃣ Handle ICE
    if (signal.ice) { // a possible route
        console.log("ICE received from:", fromId);

        try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.ice)); // try this route to connect
        } catch (e) {
            console.error("Error adding ICE:", e);
        }
    }
};

export const connectToSocketServer = (socketRef, socketIdRef, setVideos, server_url, connections) => {
    // socketRef.current = io.connect(server_url, { secure: false });
    // TO EXPLORE : check what happpens on cors removal in  backend socketManager controller
    // 1. Create persistent connection
    socketRef.current = io(server_url);

    // 2. Listen for successful connection
    socketRef.current.on("connect", () => {
        console.log("Connected to signaling server");

        // Store own socket ID
        socketIdRef.current = socketRef.current.id;
        console.log("My socket ID:", socketIdRef.current);

        // 3. Join room
        socketRef.current.emit("join-call", window.location.href);
    });

    // 4. When someone joins
    socketRef.current.on("user-joined", (id, clients) => {

        console.log("User joined:", id);
        console.log("Current clients:", clients);

        clients.forEach((socketListId) => {

            // Skip self
            if (socketListId === socketIdRef.current) return;

            // Prevent duplicate connection creation
            if (connections[socketListId]) return;

            console.log("Creating peer connection for:", socketListId);

            const pc = new RTCPeerConnection(peerConfigConnections);

            // Store connection
            connections[socketListId] = pc;

            // ICE candidate handler - LEARN
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("Sending ICE candidate to:", socketListId);

                    socketRef.current.emit("signal", socketListId, JSON.stringify({
                        ice: event.candidate
                    }));
                }
            };

            // Remote stream handler ( modern API uses ontrack, not onaddstream(derecated) )
            // When other peer sends media: This fires, You receive their video/audio stream
            // DONE : event.streams[0] => remote video (to be attatched)
            pc.ontrack = (event) => {

                console.log("Remote track received from:", socketListId);

                // Why streams[0]? Because: WebRTC groups tracks into streams
                const remoteStream = event.streams[0];
                setVideos((prevVideos) => { // this is functional state update
                    // Check if already exists
                    const exists = prevVideos.find(v => v.socketId === socketListId);

                    if (exists) {
                        // Update existing
                        return prevVideos.map(v =>
                            v.socketId === socketListId
                                ? { ...v, stream: remoteStream }
                                : v
                        );
                    } else {
                        // Add new
                        return [...prevVideos, {
                            socketId: socketListId,
                            stream: remoteStream
                        }];
                    }
                });
                // NOTE : why this, why not - setVideos([...videos, newVideo])
                // bcz videos may be stale(old value) due to async updates
                // and functional update gaurantees that preVideos is always the lataest correct state
            };

            // Add local stream if available, without this your(user/client) video cant be sent to others
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => {
                    pc.addTrack(track, window.localStream);
                });
            }

        });

        // Offer creation ONLY for the newly joined user
        /*
        Timelene for each peerId in connections:
                createOffer()
                      ↓
                setLocalDescription()
                      ↓
                [Offer sent via socket]
                      ↓
                [ICE candidates start generating]
                      ↓
                [ICE sent via socket multiple times]
        */

        if (id === socketIdRef.current) {

            console.log("I am the new user → creating offers");

            for (let peerId in connections) {

                if (peerId === socketIdRef.current) continue;

                const pc = connections[peerId];

                // setLocalDescription : Locks your offer, Triggers ICE gathering
                // Offer + ICE are parallel processes
                // Trickle ICE : send candidates as they discovered
                pc.createOffer()
                    .then((offer) => {
                        return pc.setLocalDescription(offer);
                    })
                    .then(() => {
                        console.log("Sending offer to:", peerId);

                        socketRef.current.emit("signal", peerId, JSON.stringify({
                            sdp: pc.localDescription
                        }));
                    })
                    .catch((err) => console.error(err));
            }
        }
        

    });

    // 5. When someone leaves : clean-up
    socketRef.current.on("user-left", (id) => {
        console.log("User left:", id);
        // 5.1 : Close peer connection
        if (connections[id]) {
            connections[id].close();
            delete connections[id];
        }

        // 5.2 : Remove from UI
        setVideos(prev =>
            prev.filter(video => video.socketId !== id)
        );
    });

    socketRef.current.on("signal", (fromId, message) => {
        gotMessageFromServer(fromId, message, socketRef, connections);
    });
};
