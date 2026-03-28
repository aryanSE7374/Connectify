import React, { useEffect } from 'react'
import server from '../../environment';
import { useVideoMeetState } from './hooks/useVideoMeetState';
import { getPermissions } from './services/permissions';
import { handleVideo, handleAudio } from './services/mediaToggle';
import { handleScreenShare } from './services/screenShare';
import { handleEndCall } from './handlers/callHandler';
import { connectToSocketServer } from './signaling/socketSignaling';
import { LobbyUI } from './ui/LobbyUI';
import { MeetUI } from './ui/MeetUI';

const server_url = server;

// Global storage of socket connections (persistent)
// NOTE :- TODO : use const instead of var - bcz you never reassign connections , only mutate it
// Using const prevents accidental reassignment.
// for production : use useRef({}) instead of global var.

export const connections = {}; // { socketId: RTCPeerConnection }
/*
each user has this unique connections object at client side storing connections with peers
Key = other user's socketId
Value = connection to that specific user
*/

export default function VideoMeetComponent() {
    const state = useVideoMeetState();

    // get permissions use effect
    useEffect( ()=>{
        getPermissions(state.setVideoAvailable, state.setAudioAvailable, state.setScreenAvailable, state.localVideoref);
    }, []); // run only once

    // capture media first , then connect to socket server (signalling)
    // NOTE : setVideo() and setAudio() are async , But connectToSocket called immediately
    // TO SCALE APP:    1.Acquire media, 2.Wait for success , 3.Then connect socket 
    let getMedia = () => {
        state.setVideo(state.videoAvailable);
        state.setAudio(state.audioAvailable);
        // minor refactor : wait for getUserMediaSuccess() before connecting socket.
        connectToSocketServer(state.socketRef, state.socketIdRef, state.setVideos, server_url, connections);
    };

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
        state.setAskForUsername(false);
        getMedia();
    };

    return (
        <div>
            { 
                state.askForUsername === true ? 

                <LobbyUI 
                    username={state.username}
                    setUsername={state.setUsername}
                    connect={connect}
                    localVideoref={state.localVideoref}
                /> : 

                <MeetUI 
                    videos={state.videos}
                    video={state.video}
                    audio={state.audio}
                    screen={state.screen}
                    screenAvailable={state.screenAvailable}
                    handleVideo={() => handleVideo(state.video, state.setVideo)}
                    handleAudio={() => handleAudio(state.audio, state.setAudio)}
                    handleScreenShare={() => handleScreenShare(state.screenTrackRef, state.screen, state.setScreen, state.localVideoref, state.audioAvailable, connections)}
                    handleEndCall={() => handleEndCall(connections)}
                />
            }
        </div>
    );
}

/*
// NOTE : 

ICE renegotiation happens only when
- Adding new track (camera → screen share)
- Removing track (track.stop())
- Changing codec / direction

*/
