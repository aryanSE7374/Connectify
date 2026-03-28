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

    // ---------------------------------------------------------------------------------------------------------------------------------------- //
    // Refs and UI states

    // minor improvement : var and let changed to const for Refs (since they're never re-assigned)
    const socketRef = useRef(); // external active socket connection (persistent)
    const socketIdRef = useRef(); // socket id assigned to user (persistent identity)
    const localVideoref = useRef(); // user's own video stream (DOM video element)

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
    
    let [showModal, setModal] = useState(true); // UI component overlaying main content
    
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

        // FIX 1 
        // tryna fix the issues - there's still some issues (LATER)
        try {
        // Request both camera & mic in one call
            // navigator.mediaDevices is the browser API for camera/mic/screen
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            // If we reach here, permission granted
            // NOTE : it assumes that both the permissions are given and, 
            // hence if the mic permission is not given, the camera preview is not visible
            setVideoAvailable(true);
            setAudioAvailable(true);

            // Attach preview
            window.localStream = stream;

            if (localVideoref.current) { 
                localVideoref.current.srcObject = stream;
            }

        } catch (err) {
            console.log("Camera/Mic permission denied:", err);

            // If error, mark unavailable
            setVideoAvailable(false);
            setAudioAvailable(false);
        }

        // Screen share support check (no permission request here)
        if (navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
        } else {
            setScreenAvailable(false);
        }
    };

    // get permissions use effect
    useEffect( ()=>{
        getPermissions();
    }, []); // run only once

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

    let getUserMediaSuccess = (stream) => {

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
            - connection stays intact

        
        outcome : This keeps the RTCPeerConnection stable and avoids unnecessary SDP renegotiation.

    */


    // video toggle handler
    let handleVideo = () => {
        if (!window.localStream) return;

        window.localStream.getVideoTracks().forEach(track => {
            track.enabled = !track.enabled;
        });

        setVideo(prev => !prev);
    };

    // audio toggle handler
    let handleAudio = () => {
        if (!window.localStream) return;

        window.localStream.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled;
        });

        setAudio(prev => !prev);
    };

    // resotre camera
    const restoreCamera = async () => {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const camTrack = camStream.getVideoTracks()[0];

        // keep old audio
        const audioTrack = window.localStream?.getAudioTracks()[0];

        for (let peerId in connections) {
            const sender = connections[peerId]
                .getSenders()
                .find(s => s.track?.kind === "video");

            if (sender) {
                await sender.replaceTrack(camTrack);
            }
        }
        
        const newStream = new MediaStream();
        newStream.addTrack(camTrack);

        if (audioTrack) {
            newStream.addTrack(audioTrack);
        }

        window.localStream = newStream;

        if (localVideoref.current) {
            localVideoref.current.srcObject = newStream;
        }

    };

    // screen toggle handler
    // getDisplayMedia() : prompts the user to select and grant permission to capture the contents of a display as a MediaStream
    let handleScreenShare = async () => { // async because getDisplayMedia() returns promise
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

            setScreen(false);
            screenTrackRef.current = null; // INPORTANT to nullify the screenTrackRef

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
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true
            });

            const screenTrack = screenStream.getVideoTracks()[0]; // why 0 index? 
            // in screen, usually only one video Track is created and hence, it gets the first (and only) video track

            // get existing audio track
            const audioTrack = window.localStream?.getAudioTracks()[0];

            screenTrackRef.current = screenTrack; 
            // FIX: Store track → used for stopping later

            setScreen(true);

            console.log("Screen track obtained");


            // Replace track in all peer connections
            for (let peerId in connections) {
                const pc = connections[peerId];

                // pc.getSenders() : Returns list of RTCRtpSender (sender = object responsible for sending media)

                const sender = pc.getSenders().find(s => s.track && s.track.kind === "video");

                if (sender) {
                    // await added to ensure stable switch, no race condition
                    await sender.replaceTrack(screenTrack); // Camera -> replaced by Screen
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


            // Update local preview
            if (localVideoref.current) {
                localVideoref.current.srcObject = newStream;
            }


            // CASE 3: (Browser BUtton)
            // Handle when user stops sharing
            screenTrack.onended = async () => {
                console.log("Screen sharing stopped");

                if ( !screenTrackRef.current ) return;

                screenTrackRef.current = null;
                setScreen(false);

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
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }

            for (let peerId in connections) {
                connections[peerId].close();
            }

        } catch (e) {
            console.log("error while ending the call");
        }

        window.location.href = "/";
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
        setVideo(videoAvailable);
        setAudio(audioAvailable);
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
        setAskForUsername(false);
        getMedia();
    };

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

    // WebRTC handshake : Offer -> Answer -> ICE exchange ?? 
    let gotMessageFromServer = async (fromId, message) => {

        //     console.log("Signal received from:", fromId);
        //     console.log("Message:", message);

        const signal = JSON.parse(message);

        const pc = connections[fromId];

        if (!pc) return;

        // 1️⃣ Handle SDP
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


    let connectToSocketServer = () => {
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
                    // console.log("event:", event);
                    // console.log("event streams:", event.streams); 
                    // event.streams array -> 0th index : Mediastream object

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

                    /*
                    // an implementation of what is not preferred : (REMOVED)

                    */

                };

                // Add local stream if available, without this your(user/client) video cant be sent to others
                if (window.localStream) {
                    window.localStream.getTracks().forEach(track => {
                        pc.addTrack(track, window.localStream);
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

        // 6. Test signal event (we’ll implement later) - hasa been replaced by gotMessageFromServer callback
        // socketRef.current.on("signal", (fromId, message) => {
        //     console.log("Signal received from:", fromId);
        //     console.log("Message:", message);
        // });

        socketRef.current.on("signal", gotMessageFromServer);
    }; 

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

    // main video call component 

    return (

        <div>
            { 
                askForUsername === true ? 

                <div>
                    <h2>Enter into Lobby </h2>
                    <TextField id="outlined-basic" label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
                    <Button variant="contained" onClick={connect} >Connect</Button>

                    <h3>Video Preview</h3>
                    <div>
                        <video ref={localVideoref} autoPlay muted></video>
                    </div>
                </div> : 

                <div>
                    <h1>Inside the Meet!!</h1>
                    <hr />

                    {videos.map((video) => (
                        <video
                            key={video.socketId}
                            autoPlay
                            playsInline
                            ref={(ref) => {
                                if (ref && video.stream) {
                                    ref.srcObject = video.stream;
                                }
                            }}
                        />
                    ))}

                    <hr />

                    <div>
                        <IconButton onClick={handleVideo} style={{ color: "black" }}>
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton onClick={handleAudio} style={{ color: "black" }}>
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        {/* <IconButton onClick={handleScreenShare}>
                            🖥️ Share Screen
                        </IconButton> */}
                        {
                            screenAvailable === true ?
                            <IconButton onClick={handleScreenShare} style={{ color: "black" }}>
                                {/* {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />} */}
                                {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton> : <></>
                        }
                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon  />
                        </IconButton>
                    </div>

                    {/* <div>
                        <IconButton onClick={handleVideo}>
                            {video ? "📹 ON" : "🚫 OFF"}
                        </IconButton>

                        <IconButton onClick={handleAudio}>
                            {audio ? "🎤 ON" : "🔇 OFF"}
                        </IconButton>
                    </div> */}

                    <hr />
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

