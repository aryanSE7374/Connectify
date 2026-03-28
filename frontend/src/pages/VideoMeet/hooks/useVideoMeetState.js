import { useRef, useState } from 'react';

export const useVideoMeetState = () => {
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

    return {
        socketRef,
        socketIdRef,
        localVideoref,
        videoAvailable,
        setVideoAvailable,
        audioAvailable,
        setAudioAvailable,
        screenAvailable,
        setScreenAvailable,
        video,
        setVideo,
        audio,
        setAudio,
        screen,
        setScreen,
        screenTrackRef,
        messages,
        setMessages,
        message,
        setMessage,
        newMessages,
        setNewMessages,
        showModal,
        setModal,
        askForUsername,
        setAskForUsername,
        username,
        setUsername,
        videoRef,
        videos,
        setVideos
    };
};
