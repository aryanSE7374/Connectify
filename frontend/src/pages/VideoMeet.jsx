import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import styles from "../styles/videoComponent.module.css";
import { Badge, IconButton, TextField, Button } from '@mui/material';
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



    

    // ---------------------------------------------------------------------------------------------------------------------------------------- //
    // REVISIT THIS STATE AGAIN : ARRAY OR NOT
    // bug fixed here : earlier the initial state was = [] (empty array) => bug : always true initially
    let [video, setVideo] = useState(false); // video toggle button flag
    // ---------------------------------------------------------------------------------------------------------------------------------------- //
    



    // fixed here : earlier the initial state was = undefined (nothing) => not a bug but good practice
    let [audio, setAudio] = useState(false); // audio toggle button flag
    
    // fixed here : earlier the initial state was = undefined (nothing) => not a bug but good practice
    let [screen, setScreen] = useState(false); // screen share toggle button flag
    
    let [messages, setMessages] = useState([]) // array of all the messages (chat history)
    
    let [message, setMessage] = useState(""); // message written by user
    
    // bug : initial state value = 3 , changed to 0
    let [newMessages, setNewMessages] = useState(0); // UI : new message alert (unread counter)
    
    let [showModal, setModal] = useState(true); // UI component overlaying main content
    
    let [askForUsername, setAskForUsername] = useState(true); // UI : guest login -> prompt the user for username
    
    let [username, setUsername] = useState(""); // username entered
    
    const videoRef = useRef([]) // later - remote videos container
    let [videos, setVideos] = useState([]) // later

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

    // TODO
    // if(isChrome() === false) {}

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

    // get permissions system
    // ISSUE1 : Double permission request inefficient
    // ISSUE2 : Using state immediately after setting it is unsafe
    const getPermissions = async ()=>{

        // FIX 1 - commented below intentionally

        // try {

        //     const videoPermission = await navigator.mediaDevices.getUserMedia({video: true});

        //     if ( videoPermission ) {
        //         setVideoAvailable(true);
        //     }
        //     else{
        //         setVideoAvailable(false);
        //     }

        //     const audioPermission = await navigator.mediaDevices.getUserMedia({audio: true});

        //     if ( audioPermission ) {
        //         setAudioAvailable(true);
        //     }
        //     else{
        //         setAudioAvailable(false);
        //     }

        //     // since no permission is needed to share the screen
        //     if ( navigator.mediaDevices.getDisplayMedia ) {
        //         setScreenAvailable(true);
        //     } else {
        //         setScreenAvailable(false);
        //     }

        //     // user media stream : READ ABOUT IT
        //     // FIX NEEDED HERE!!
        //     if ( videoAvailable || audioAvailable ) { // REVISIT LATER : { both are state variables and updates asynchronously}
        //         const userMediaStream = await navigator.mediaDevices.getUserMedia( { video:videoAvailable , audio:audioAvailable } );
        //         if ( userMediaStream ) {
        //             window.localStream = userMediaStream; // global storage of stream
        //             if (localVideoref.current) {
        //                 localVideoref.current.srcObject = userMediaStream;
        //             }
        //         }
        //     }

        // } catch (err) {
        //     console.log(err);
        // }

        // tryna fix the issues - there's still some issues (LATER)
        try {
        // Request both camera & mic in one call
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

    // media toggling functionality
    let getUserMedia = () => {
        if ( (video && videoAvailable) || (audio && audioAvailable) ) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                // .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    };

    // useEffect - getUserMedia) : media toggle system useEffect- after render side effects in change in video or audio state
    useEffect(() => {
        // video-audio undefined checked not needed anymore since states initials are fixed now
        getUserMedia();
        // console.log("SET STATE HAS ", video, audio);


    }, [video, audio]); // runs whenver the video or audio changes

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
        // 1️⃣ Create persistent connection
        socketRef.current = io(server_url);

        // 2️⃣ Listen for successful connection
        socketRef.current.on("connect", () => {
            console.log("Connected to signaling server");

            // Store own socket ID
            socketIdRef.current = socketRef.current.id;
            console.log("My socket ID:", socketIdRef.current);

            // 3️⃣ Join room
            socketRef.current.emit("join-call", window.location.href);
        });

        // 4️⃣ When someone joins
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
                // TO DO LATER : event.streams[0] => remote video (to be attatched)
                pc.ontrack = (event) => {
                    console.log("Remote track received from:", socketListId);
                    console.log(event.streams);
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

        // 5️⃣ When someone leaves
        socketRef.current.on("user-left", (id) => {
            console.log("User left:", id);
        });

        // 6️⃣ Test signal event (we’ll implement later) - hasa been replaced by gotMessageFromServer callback
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
                    {/* <video ref={localVideoref} autoPlay muted></video> */}
                    <hr />
                    <hr />
                </div>
            }
        </div>
    );

    // ---------------------------------------------------------------------------------------------------------------------------------------- //

}

// ---------------------------------------------------------------------------------------------------------------------------------------- //
// ---------------------------------------------------------------------------------------------------------------------------------------- //