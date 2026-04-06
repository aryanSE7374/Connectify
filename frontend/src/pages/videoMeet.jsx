import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import styles from "../styles/videoComponent.module.css";
import { Badge, IconButton, TextField, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import CallEndIcon from '@mui/icons-material/CallEnd'
import ChatIcon from '@mui/icons-material/Chat';
import server from '../environment';

const server_url = server;

// ICE server config (STUN for NAT traversal)
const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

// Global storage of socket connections (persistent)
// NOTE :- TODO : use const instead of var - bcz you never reassign connections , only mutate it
// Using const prevents accidental reassignment.
// for production : use useRef({}) instead of global var.

var connections = {}; // { socketId: RTCPeerConnection }
/*
each user has this unique connections object at client side storing connections with peers
Key = other user’s socketId
Value = connection to that specific user
*/ 

// ---------------------------------------------------------------------------------------------------------------------------------------- //
// ---------------------------------------------------------------------------------------------------------------------------------------- //

export default function VideoMeetComponent() {
    console.log("[VideoMeet2] Component render start");

    // ---------------------------------------------------------------------------------------------------------------------------------------- //
    // Refs and UI states

    // minor improvement : var and let changed to const for Refs (since they're never re-assigned)
    const socketRef = useRef(); // external active socket connection (persistent)
    const socketIdRef = useRef(); // socket id assigned to user (persistent identity)
    const localVideoref = useRef(); // user's own video stream (DOM video element)
    const showModalRef = useRef(true);

    // initial value changed to false
    // Does browser allow camera?
    let [videoAvailable, setVideoAvailable] = useState(false); // is video Permission granted

    // initial value changed to false
    // Does browser allow mic?
    let [audioAvailable, setAudioAvailable] = useState(false); // is audio Permission granted

    // initial value changed to false
    // Is screen share supported?
    let [screenAvailable, setScreenAvailable] = useState(false); // is screen share available

    // bug fixed here : earlier the initial state was = [] (empty array) => bug : always true initially
    let [video, setVideo] = useState(false); // video toggle button flag
    
    // fixed here : earlier the initial state was = undefined (nothing) => not a bug but good practice
    let [audio, setAudio] = useState(false); // audio toggle button flag
    
    // fixed here : earlier the initial state was = undefined (nothing) => not a bug but good practice
    let [screen, setScreen] = useState(false); // screen share toggle button flag

    // track screen 
    const screenTrackRef = useRef(null);
    
    let [messages, setMessages] = useState([]) // array of all the messages (chat history)
    
    let [message, setMessage] = useState(""); // message written by user
    
    // bug : initial state value = 3 , changed to 0
    let [newMessages, setNewMessages] = useState(0); // UI : new message alert (unread counter)
    
    let [showModal, setModal] = useState(false); // UI component overlaying main content
    
    let [askForUsername, setAskForUsername] = useState(true); // UI : guest login -> prompt the user for username
    
    let [username, setUsername] = useState(""); // username entered
    
    const videoRef = useRef([]) // later - remote videos container
    let [videos, setVideos] = useState([]) // stores : [{socketID: "id1", stream: "mediaStream"}]

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

    // TODO
    // if(isChrome() === false) {}

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

    // get permissions system
    // ISSUE1 : Double permission request inefficient
    // ISSUE2 : Using state immediately after setting it is unsafe
    const getPermissions = async ()=>{
        console.log("[VideoMeet2] getPermissions called");

        // FIX 1 
        // tryna fix the issues - there's still some issues (LATER)
        try {
        console.log("[VideoMeet2] Requesting camera and microphone permissions");
        // Request both camera & mic in one call
            // navigator.mediaDevices is the browser API for camera/mic/screen
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            console.log("[VideoMeet2] Camera and microphone permissions granted", stream);

            // If we reach here, permission granted
            // NOTE : it assumes that both the permissions are given and, 
            // hence if the mic permission is not given, the camera preview is not visible
            setVideoAvailable(true);
            setAudioAvailable(true);
            console.log("[VideoMeet2] Updated availability state", { videoAvailable: true, audioAvailable: true });

            // Attach preview
            window.localStream = stream;
            console.log("[VideoMeet2] window.localStream set from permission stream");

            if (localVideoref.current) { 
                localVideoref.current.srcObject = stream;
                console.log("[VideoMeet2] Local preview attached after permission grant");
            }

        } catch (err) {
            console.log("Camera/Mic permission denied:", err);

            // If error, mark unavailable
            setVideoAvailable(false);
            setAudioAvailable(false);
            console.log("[VideoMeet2] Updated availability state", { videoAvailable: false, audioAvailable: false });
        }

        // Screen share support check (no permission request here)
        if (navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
            console.log("[VideoMeet2] Screen share is available");
        } else {
            setScreenAvailable(false);
            console.log("[VideoMeet2] Screen share is not available");
        }
    };

    // get permissions use effect
    useEffect( ()=>{
        console.log("[VideoMeet2] Initial useEffect fired -> getPermissions");
        getPermissions();
    }, []); // run only once

    useEffect(() => {
        showModalRef.current = showModal;
        console.log("[VideoMeet2] showModalRef synced", { showModal });
    }, [showModal]);

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

    let getUserMediaSuccess = (stream) => {
        console.log("[VideoMeet2] getUserMediaSuccess called", stream);
    };

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

    // Media Toggle System

    // NOTE : 

    // MediaStream => container : Multiple video/audio tracks
    // Tracks => actual data (video/audio)

    /*
    // media controls : 
    to turn camera OFF tow ways:

        1. stop track (NOT IDEAL)
            - peer connection loses video sender
            - requires renegotiation
            - need getUserMedia AGAIN
            - complex + expensive
            -+-> use this only when User leaves meeting -> cleanup -> release resources

        2. track.enabled = false (correct)
            - keeps track alive
            - just muting video
            - No renogotiation
            - instant toggle
            - connection stays intactf

        
        outcome : This keeps the RTCPeerConnection stable and avoids unnecessary SDP renegotiation.

    */


    // video toggle handler
    let handleVideo = () => {
        console.log("[VideoMeet2] handleVideo called", { hasLocalStream: !!window.localStream });
        if (!window.localStream) {
            console.log("[VideoMeet2] handleVideo aborted because localStream is missing");
            return;
        }

        window.localStream.getVideoTracks().forEach(track => {
            console.log("[VideoMeet2] Toggling video track", { before: track.enabled });
            track.enabled = !track.enabled;
            console.log("[VideoMeet2] Video track toggled", { after: track.enabled });
        });

        setVideo(prev => {
            const next = !prev;
            console.log("[VideoMeet2] Updating video state", { prev, next });
            return next;
        });
    };

    // audio toggle handler
    let handleAudio = () => {
        console.log("[VideoMeet2] handleAudio called", { hasLocalStream: !!window.localStream });
        if (!window.localStream) {
            console.log("[VideoMeet2] handleAudio aborted because localStream is missing");
            return;
        }

        window.localStream.getAudioTracks().forEach(track => {
            console.log("[VideoMeet2] Toggling audio track", { before: track.enabled });
            track.enabled = !track.enabled;
            console.log("[VideoMeet2] Audio track toggled", { after: track.enabled });
        });

        setAudio(prev => {
            const next = !prev;
            console.log("[VideoMeet2] Updating audio state", { prev, next });
            return next;
        });
    };

    // resotre camera
    const restoreCamera = async () => {
        console.log("[VideoMeet2] restoreCamera called");
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const camTrack = camStream.getVideoTracks()[0];
        console.log("[VideoMeet2] Camera stream reacquired", { camTrack });

        // keep old audio
        const audioTrack = window.localStream?.getAudioTracks()[0];
        console.log("[VideoMeet2] Existing audio track during restore", { hasAudioTrack: !!audioTrack });

        for (let peerId in connections) {
            console.log("[VideoMeet2] Replacing video track for peer during restore", { peerId });
            const sender = connections[peerId]
                .getSenders()
                .find(s => s.track?.kind === "video");

            if (sender) {
                await sender.replaceTrack(camTrack);
                console.log("[VideoMeet2] Camera track replaced for peer", { peerId });
            }
        }
        
        const newStream = new MediaStream();
        newStream.addTrack(camTrack);

        if (audioTrack) {
            newStream.addTrack(audioTrack);
        }

        window.localStream = newStream;
        console.log("[VideoMeet2] window.localStream replaced with restored camera stream");

        if (localVideoref.current) {
            localVideoref.current.srcObject = newStream;
            console.log("[VideoMeet2] Local preview updated after restoreCamera");
        }

    };

    // screen toggle handler
    // getDisplayMedia() : prompts the user to select and grant permission to capture the contents of a display as a MediaStream
    let handleScreenShare = async () => { // async because getDisplayMedia() returns promise
        console.log("[VideoMeet2] handleScreenShare called", {
            screen,
            hasScreenTrackRef: !!screenTrackRef.current,
            screenAvailable
        });
        // CASE 1: Already sharing -> STOP manually
        // if (screenTrackRef.current) {
        //     console.log("Stopping screen share manually");
        //     setScreen(false);
        //     screenTrackRef.current.stop(); // triggers onended
        //     return;
        // }
        // if (screen) {
        //     console.log("Stopping screen share manually");
        //     screenTrackRef.current.stop(); // triggers onended
        //     // setScreen(false);
        //     // console.log("Screen sharing stopped");
        //     // onended logic below
        //     setScreen(false);

        //     // Re-acquire camera
        //     const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        //     const camTrack = camStream.getVideoTracks()[0];

        //     for (let peerId in connections) {
        //         const pc = connections[peerId];

        //         const sender = pc.getSenders().find(s => s.track && s.track.kind === "video");

        //         if (sender) {
        //             sender.replaceTrack(camTrack); // Screen -> replaced by Camera
        //         }
        //     }

        //     // Update local preview
        //     if (localVideoref.current) {
        //         localVideoref.current.srcObject = camStream;
        //     }

        //     window.localStream = camStream;
        //     return;
        // }

        // CASE 1: STOP FLOW (MANUAL BUTTON)
        if (screenTrackRef.current) {
            console.log("Stopping screen share manually");

            const oldTrack = screenTrackRef.current;
            console.log("[VideoMeet2] Existing screen track found, switching back to camera");

            setScreen(false);
            screenTrackRef.current = null; // INPORTANT to nullify the screenTrackRef
            console.log("[VideoMeet2] Cleared screenTrackRef and updated screen state to false");

            // Replace FIRST (important)
            await restoreCamera();

            // Then stop
            oldTrack.stop();

            return;
        }

        // CASE 2: Start sharing
        // START FLOW
        if (!navigator.mediaDevices.getDisplayMedia) {
            console.log("Screen share not supported");
            return;
        }

        /*
        
        RTCPeerConnection = Full call session
        RTCRtpSender : This is the ACTUAL media pipeline (one per track)
        each sender : - Sends ONE track and Has control over that track
            RTCPeerConnection
                |
                +-- Sender (video track)
                +-- Sender (audio track)

        */

        try {
            console.log("[VideoMeet2] Requesting display media");
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true
            });
            console.log("[VideoMeet2] Display media granted", screenStream);

            const screenTrack = screenStream.getVideoTracks()[0]; // why 0 index? 
            // in screen, usually only one video Track is created and hence, it gets the first (and only) video track

            // get existing audio track
            const audioTrack = window.localStream?.getAudioTracks()[0];
            console.log("[VideoMeet2] Preparing screen share stream", {
                hasScreenTrack: !!screenTrack,
                hasAudioTrack: !!audioTrack
            });

            screenTrackRef.current = screenTrack; 
            // FIX: Store track → used for stopping later

            setScreen(true);
            console.log("[VideoMeet2] Screen sharing state set to true");

            console.log("Screen track obtained");


            // Replace track in all peer connections
            for (let peerId in connections) {
                const pc = connections[peerId];
                console.log("[VideoMeet2] Replacing video sender with screen track", { peerId });

                // pc.getSenders() : Returns list of RTCRtpSender (sender = object responsible for sending media)

                const sender = pc.getSenders().find(s => s.track && s.track.kind === "video");

                if (sender) {
                    // await added to ensure stable switch, no race condition
                    await sender.replaceTrack(screenTrack); // Camera -> replaced by Screen
                    console.log("[VideoMeet2] Screen track replaced for peer", { peerId });
                }
            }

            // window.localStream = screenStream; // because later - handleVideo / handleAudio depends on localStream
            const newStream = new MediaStream();

            // add screen video
            newStream.addTrack(screenTrack);

            // add existing audio (if present)
            if (audioTrack) {
                newStream.addTrack(audioTrack);
            }

            window.localStream = newStream;
            console.log("[VideoMeet2] window.localStream replaced with screen stream");


            // Update local preview
            if (localVideoref.current) {
                localVideoref.current.srcObject = newStream;
                console.log("[VideoMeet2] Local preview updated for screen share");
            }


            // CASE 3: (Browser BUtton)
            // Handle when user stops sharing
            screenTrack.onended = async () => {
                console.log("Screen sharing stopped");
                console.log("[VideoMeet2] screenTrack.onended fired");

                if ( !screenTrackRef.current ) {
                    console.log("[VideoMeet2] screenTrack.onended ignored because ref is already cleared");
                    return;
                }

                screenTrackRef.current = null;
                setScreen(false);
                console.log("[VideoMeet2] Screen share cleaned up after browser stop");

                await restoreCamera(); 
                // FIX: Reuse same logic → no duplication

                // Re-acquire camera
                // const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
                // const camTrack = camStream.getVideoTracks()[0];

                // for (let peerId in connections) {
                //     const pc = connections[peerId];

                //     const sender = pc.getSenders().find(s => s.track && s.track.kind === "video");

                //     if (sender) {
                //         sender.replaceTrack(camTrack); // Screen -> replaced by Camera
                //     }
                // }

            };

            // Update local preview - earlier HERE, SHIFTED ABOVE

        } catch (err) {
            console.error("Screen share error:", err);
            screenTrackRef.current = null; 
            // FIX: Clean state on failure
        }
    };

    // call end hndler
    let handleEndCall = () => {
        console.log("[VideoMeet2] handleEndCall called");
        try {
            if (window.localStream) {
                console.log("[VideoMeet2] Stopping local tracks before ending call");
                window.localStream.getTracks().forEach(track => track.stop());
            }

            for (let peerId in connections) {
                console.log("[VideoMeet2] Closing peer connection", { peerId });
                connections[peerId].close();
            }

        } catch (e) {
            console.log("error while ending the call");
            console.log("[VideoMeet2] handleEndCall error", e);
        }

        console.log("[VideoMeet2] Redirecting to home page after ending call");
        window.location.href = "/home";
    };

    // ---------------------------------------------------------------------------------------------------------------------------------------- //
    // REMOVED COMPLETELY

    // media toggling functionality
    // let getUserMedia = () => {
    //     if ( (video && videoAvailable) || (audio && audioAvailable) ) {
    //         navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
    //             // .then(getUserMediaSuccess)
    //             .then((stream) => { })
    //             .catch((e) => console.log(e))
    //     } else {
    //         try {
    //             let tracks = localVideoref.current.srcObject.getTracks()
    //             tracks.forEach(track => track.stop())
    //         } catch (e) { }
    //     }
    // };

    // useEffect - getUserMedia) : media toggle system useEffect- after render side effects in change in video or audio state
    // useEffect(() => {
    //     // video-audio undefined checked not needed anymore since states initials are fixed now
    //     getUserMedia();
    //     // console.log("SET STATE HAS ", video, audio);


    // }, [video, audio]); // runs whenver the video or audio changes

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

    // capture media first , then connect to socket server (signalling)
    // NOTE : setVideo() and setAudio() are async , But connectToSocket called immediately
    // TO SCALE APP:    1.Acquire media, 2.Wait for success , 3.Then connect socket 
    let getMedia = () => {
        console.log("[VideoMeet2] getMedia called", { videoAvailable, audioAvailable });
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        console.log("[VideoMeet2] Requested local toggle state sync from permissions");
        // minor refactor : wait for getUserMediaSuccess() before connecting socket.
        connectToSocketServer();
    };

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

    // connect button functionality - Media toggle flow
    // ENTRY INTO MEET : 

    /*
    high level: 
        - User clicks Connect
        - Hide lobby UI : depends on askForUsername state
        - Enable media
        - Connect to signaling server

    Sequence after clicking connect:

    1. askForUsername = false → re-render
    2. setVideo(true/false) → triggers effect
    3. setAudio(true/false) → triggers effect
    4. connectToSocketServer() runs

    Then:
        - useEffect([video, audio]) triggers getUserMedia
        - Media acquired

    So socket and media initialization are happening almost simultaneously

    */

    let connect = () => {
        console.log("[VideoMeet2] connect called", { username });
        setAskForUsername(false);
        console.log("[VideoMeet2] askForUsername set to false");
        getMedia();
    };

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

    // WebRTC handshake : Offer -> Answer -> ICE exchange ?? 
    let gotMessageFromServer = async (fromId, message) => {
        console.log("[VideoMeet2] gotMessageFromServer called", { fromId, message });

        //     console.log("Signal received from:", fromId);
        //     console.log("Message:", message);

        const signal = JSON.parse(message);
        console.log("[VideoMeet2] Parsed signal from server", signal);

        const pc = connections[fromId];

        if (!pc) {
            console.log("[VideoMeet2] No peer connection found for signal sender", { fromId });
            return;
        }

        // 1. Handle SDP
        if (signal.sdp) {
            console.log("SDP received from:", fromId);

            // Apply Remote Description : Accept the other peer’s configuration 
            // if its an answer, we accept it (no reply needed)
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

            // If it's an offer → create answer
            if (signal.sdp.type === "offer") {
                console.log("Creating answer for:", fromId);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                console.log("[VideoMeet2] Answer created and local description set", { fromId });

                socketRef.current.emit("signal", fromId, JSON.stringify({
                    sdp: pc.localDescription
                }));
                console.log("[VideoMeet2] Answer emitted to peer", { fromId });
            }
        }

        // 2. Handle ICE
        if (signal.ice) { // a possible route
            console.log("ICE received from:", fromId);

            try {
                await pc.addIceCandidate(new RTCIceCandidate(signal.ice)); // try this route to connect
            } catch (e) {
                console.error("Error adding ICE:", e);
            }
        }
    };

    const sendMessage = () => {
        const trimmedMessage = message.trim();
        console.log("[VideoMeet2] sendMessage called", { trimmedMessage, username });

        if (!trimmedMessage || !socketRef.current) {
            console.log("[VideoMeet2] sendMessage aborted", {
                hasMessage: !!trimmedMessage,
                hasSocket: !!socketRef.current
            });
            return;
        }

        socketRef.current.emit("chat-message", trimmedMessage, username || "Guest");
        setMessage("");
    };

    const toggleChatPanel = () => {
        setModal(prev => {
            const next = !prev;
            console.log("[VideoMeet2] toggleChatPanel", { prev, next });

            if (next) {
                setNewMessages(0);
            }

            return next;
        });
    };


    let connectToSocketServer = () => {
        console.log("[VideoMeet2] connectToSocketServer called", { server_url });
        // socketRef.current = io.connect(server_url, { secure: false });
        // TO EXPLORE : check what happpens on cors removal in  backend socketManager controller
        // 1. Create persistent connection
        socketRef.current = io(server_url);
        console.log("[VideoMeet2] socketRef.current initialized");

        // 2. Listen for successful connection
        socketRef.current.on("connect", () => {
            console.log("Connected to signaling server");

            // Store own socket ID
            socketIdRef.current = socketRef.current.id;
            console.log("My socket ID:", socketIdRef.current);

            // 3. Join room
            socketRef.current.emit("join-call", window.location.href);
            console.log("[VideoMeet2] join-call emitted", { room: window.location.href });
        });

        // 4. When someone joins
        socketRef.current.on("user-joined", (id, clients) => {

            console.log("User joined:", id);
            console.log("Current clients:", clients);

            clients.forEach((socketListId) => {

                // Skip self
                if (socketListId === socketIdRef.current) {
                    console.log("[VideoMeet2] Skipping self socket in clients list", { socketListId });
                    return;
                }

                // Prevent duplicate connection creation
                if (connections[socketListId]) {
                    console.log("[VideoMeet2] Peer connection already exists, skipping", { socketListId });
                    return;
                }

                console.log("Creating peer connection for:", socketListId);

                const pc = new RTCPeerConnection(peerConfigConnections);

                // Store connection
                connections[socketListId] = pc;
                console.log("[VideoMeet2] Peer connection stored", {
                    socketListId,
                    totalConnections: Object.keys(connections).length
                });

                // ICE candidate handler - LEARN
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log("Sending ICE candidate to:", socketListId);
                        console.log("[VideoMeet2] ICE candidate payload", event.candidate);

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
                    // console.log("event:", event);
                    // console.log("event streams:", event.streams); 
                    // event.streams array -> 0th index : Mediastream object

                    // Why streams[0]? Because: WebRTC groups tracks into streams
                    const remoteStream = event.streams[0];
                    setVideos((prevVideos) => { // this is functional state update
                        console.log("[VideoMeet2] setVideos called from remote track", {
                            socketListId,
                            prevCount: prevVideos.length
                        });
                        // Check if already exists
                        const exists = prevVideos.find(v => v.socketId === socketListId);

                        if (exists) {
                            // Update existing
                            const nextVideos = prevVideos.map(v =>
                                v.socketId === socketListId
                                    ? { ...v, stream: remoteStream }
                                    : v
                            );
                            console.log("[VideoMeet2] Updated existing remote video", {
                                socketListId,
                                nextCount: nextVideos.length
                            });
                            return nextVideos;
                        } else {
                            // Add new
                            const nextVideos = [...prevVideos, {
                                socketId: socketListId,
                                stream: remoteStream
                            }];
                            console.log("[VideoMeet2] Added new remote video", {
                                socketListId,
                                nextCount: nextVideos.length
                            });
                            return nextVideos;
                        }
                    });
                    // NOTE : why this, why not - setVideos([...videos, newVideo])
                    // bcz videos may be stale(old value) due to async updates
                    // and functional update gaurantees that preVideos is always the lataest correct state

                    /*
                    // an implementation of what is not preferred : (REMOVED)

                    */

                };

                // Add local stream if available, without this your(user/client) video cant be sent to others
                if (window.localStream) {
                    console.log("[VideoMeet2] Adding local tracks to new peer connection", {
                        socketListId,
                        trackCount: window.localStream.getTracks().length
                    });
                    window.localStream.getTracks().forEach(track => {
                        pc.addTrack(track, window.localStream);
                        console.log("[VideoMeet2] Local track added to peer connection", {
                            socketListId,
                            kind: track.kind
                        });
                    });
                }

            });
            // console.log("current status of RTC peer connections: ", connections);

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
                            console.log("[VideoMeet2] Offer created", { peerId, offer });
                            return pc.setLocalDescription(offer);
                        })
                        .then(() => {
                            console.log("Sending offer to:", peerId);

                            socketRef.current.emit("signal", peerId, JSON.stringify({
                                sdp: pc.localDescription
                            }));
                            console.log("[VideoMeet2] Offer emitted to peer", { peerId });
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
                console.log("[VideoMeet2] Closing and deleting connection for user-left event", { id });
                connections[id].close();
                delete connections[id];
            }

            // 5.2 : Remove from UI
            setVideos(prev => {
                const nextVideos = prev.filter(video => video.socketId !== id);
                console.log("[VideoMeet2] Removed remote video after user-left", {
                    id,
                    prevCount: prev.length,
                    nextCount: nextVideos.length
                });
                return nextVideos;
            });
        });

        // 6. Test signal event (we’ll implement later) - hasa been replaced by gotMessageFromServer callback
        // socketRef.current.on("signal", (fromId, message) => {
        //     console.log("Signal received from:", fromId);
        //     console.log("Message:", message);
        // });

        socketRef.current.on("signal", gotMessageFromServer);
        socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
            console.log("[VideoMeet2] chat-message received", {
                data,
                sender,
                socketIdSender
            });

            setMessages(prevMessages => ([
                ...prevMessages,
                { sender, data, socketIdSender }
            ]));

            if (!showModalRef.current && socketIdSender !== socketIdRef.current) {
                setNewMessages(prevCount => prevCount + 1);
            }
        });
        console.log("[VideoMeet2] Registered socket event listeners");
    }; 

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

    // main video call component 

    return (

        <div>
            {/* {console.log("[VideoMeet2] Rendering UI branch", {
                askForUsername,
                username,
                videosCount: videos.length,
                video,
                audio,
                screen,
                videoAvailable,
                audioAvailable,
                screenAvailable
            })} */}
            { 
                askForUsername === true ? 

                <div className={styles.lobbyShell}>
                    <div className={styles.lobbyCard}>
                        <div className={styles.pageChip}>Connectify Meet</div>
                        <div className={styles.lobbyHeader}>
                            <h2>Ready to join?</h2>
                            <p>Use the same preview-and-join flow from the rest of Connectify before entering your room.</p>
                        </div>

                        <div className={styles.lobbyControls}>
                            <TextField
                                id="outlined-basic"
                                label="Username"
                                value={username}
                                onChange={e => {
                                    console.log("[VideoMeet2] Username input changed", e.target.value);
                                    setUsername(e.target.value);
                                }}
                                variant="outlined"
                                className={styles.lobbyInput}
                            />
                            <Button variant="contained" onClick={connect} className={styles.connectButton}>Connect</Button>
                        </div>

                        <div className={styles.lobbyPreviewSection}>
                            <h3>Video Preview</h3>
                            <div className={styles.lobbyPreviewFrame}>
                                <video
                                    ref={localVideoref}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={styles.lobbyPreviewVideo}
                                ></video>
                            </div>
                        </div>
                    </div>
                </div> : 

                <div className={styles.meetVideoContainer}>
                    <div className={styles.meetTopBar}>
                        <div className={styles.brandBlock}>
                            <p className={styles.brandEyebrow}>Connectify</p>
                            <h1>Meeting Room</h1>
                        </div>
                        <div className={styles.meetStatusCard}>
                            <p className={styles.meetStatusLabel}>Status</p>
                            <p className={styles.meetStatusValue}>{username ? `${username} is in the room` : "Live meeting room"}</p>
                        </div>
                    </div>
                    <hr className={styles.meetDivider} />

                    {showModal ? 
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <div className={styles.chatHeader}>
                                    <h2>Chat</h2>
                                    <Button variant="text" onClick={toggleChatPanel}>Close</Button>
                                </div>

                                <div className={styles.chattingDisplay}>
                                    {messages.length !== 0 ? messages.map((item, index) => (
                                        <div className={styles.chatMessage} key={`${item.socketIdSender || item.sender}-${index}`}>
                                            <p className={styles.chatSender}>{item.sender}</p>
                                            <p className={styles.chatText}>{item.data}</p>
                                        </div>
                                    )) : <p className={styles.emptyChatState}>No Messages Yet</p>}
                                </div>

                                <div className={styles.chattingArea}>
                                    <TextField
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        id="outlined-basic"
                                        label="Enter Your chat"
                                        variant="outlined"
                                        className={styles.chatInput}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                sendMessage();
                                            }
                                        }}
                                    />
                                    <Button variant='contained' onClick={sendMessage}>Send</Button>
                                </div>
                            </div>
                        </div> : null}

                    <div className={styles.conferenceView}>
                        {videos.map((video) => (
                            <div className={styles.remoteVideoCard} key={video.socketId}>
                                <video
                                    autoPlay
                                    playsInline
                                    ref={(ref) => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                            console.log("[VideoMeet2] Remote video ref attached", { socketId: video.socketId });
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <video
                        className={styles.meetUserVideo}
                        ref={(ref) => {
                            localVideoref.current = ref;

                            if (ref && window.localStream) {
                                ref.srcObject = window.localStream;
                            }
                        }}
                        autoPlay
                        muted
                        playsInline
                    ></video>

                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} className={styles.controlButton}>
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton onClick={handleAudio} className={styles.controlButton}>
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {
                            screenAvailable === true ?
                            <IconButton onClick={handleScreenShare} className={styles.controlButton}>
                                {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton> : <></>
                        }

                        <Badge badgeContent={newMessages} max={999} color='warning'>
                            <IconButton onClick={toggleChatPanel} className={styles.controlButton}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>

                        <IconButton onClick={handleEndCall} className={styles.endCallButton}>
                            <CallEndIcon  />
                        </IconButton>
                    </div>
                </div>
            }
        </div>
    );

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

}

// ---------------------------------------------------------------------------------------------------------------------------------------- //
// ---------------------------------------------------------------------------------------------------------------------------------------- //

/*
// NOTE : 

ICE renegotiation happens only when
- Adding new track (camera → screen share)
- Removing track (track.stop())
- Changing codec / direction

*/
