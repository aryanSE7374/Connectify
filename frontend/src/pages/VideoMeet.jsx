import React, { useEffect, useRef, useState } from 'react'
import styles from "../styles/videoComponent.module.css";
import { Badge, IconButton, TextField, Button } from '@mui/material';
import server from '../environment';

const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

// ------------------------------------------------------------------------------------------------------------- //

export default function VideoMeetComponent() {


    var socketRef = useRef();
    let socketIdRef = useRef(); // socket id assigned to user

    let localVideoref = useRef(); // user's own video stream

    let [videoAvailable, setVideoAvailable] = useState(true); // is video Permission granted

    let [audioAvailable, setAudioAvailable] = useState(true); // is audio Permission granted

    let [video, setVideo] = useState([]); // video toggle button flag

    let [audio, setAudio] = useState(); // audio toggle button flag

    let [screen, setScreen] = useState(); // screen share toggle button flag

    let [showModal, setModal] = useState(true); // UI component overlaying main content

    let [screenAvailable, setScreenAvailable] = useState(); // is screen share available

    let [messages, setMessages] = useState([]) // array of all the messages

    let [message, setMessage] = useState(""); // message written by user

    let [newMessages, setNewMessages] = useState(3); // new message alert

    let [askForUsername, setAskForUsername] = useState(true); // guest login -> prompt the user for username

    let [username, setUsername] = useState(""); // username entered

    const videoRef = useRef([]) // later

    let [videos, setVideos] = useState([]) // later

    // TODO
    // if(isChrome() === false) {}

    const getPermissions = async ()=>{
        try {

            const videoPermission = await navigator.mediaDevices.getUserMedia({video: true});

            if ( videoPermission ) {
                setVideoAvailable(true);
            }
            else{
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({audio: true});

            if ( audioPermission ) {
                setAudioAvailable(true);
            }
            else{
                setAudioAvailable(false);
            }

            // since no permission is needed to share the screen
            if ( navigator.mediaDevices.getDisplayMedia ) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            // user media stream : READ ABOUT IT
            if ( videoAvailable || audioAvailable ) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia( { video:videoAvailable , audio:audioAvailable } );
                if ( userMediaStream ) {
                    window.localStream = userMediaStream; // global storage of stream
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }

        } catch (err) {
            console.log(err);
        }
    };


    useEffect( ()=>{
        getPermissions();
    }, []);

    let getUserMediaSuccess = (stream) => {

    };

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

    useEffect(() => {
        if ( (video !== undefined) &&( audio !== undefined) ) {
            getUserMedia();
            // console.log("SET STATE HAS ", video, audio);
        }


    }, [video, audio])

    // capture media first , then connect to socket server
    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    // connect button functionality - Media toggle flow
    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    let connectToSocketServer = () => {
        // socketRef.current = io.connect(server_url, { secure: false })
        // TO EXPLORE : check what happpens on cors removal in  backend socketManager controller
    }; 

    // ------------------------------------------------------------------------------------------------------------- //

    // main video call component 

    return (

        <div>
            { 
                askForUsername === true ? 

                <div>
                    <h2>Enter into Lobby </h2>
                    <TextField id="outlined-basic" label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
                    <Button variant="contained" onClick={connect} >Connect</Button>


                    <div>
                        <video ref={localVideoref} autoPlay muted></video>
                    </div>
                </div> : 

                <div>
                    <h1>Inside the Meet!!</h1>
                </div>
            }
        </div>
    );
}