import React from 'react';
import { IconButton } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import CallEndIcon from '@mui/icons-material/CallEnd'

export const MeetUI = ({ 
    videos, 
    video, 
    audio, 
    screen, 
    screenAvailable,
    handleVideo, 
    handleAudio, 
    handleScreenShare, 
    handleEndCall 
}) => {
    return (
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

                {
                    screenAvailable === true ?
                    <IconButton onClick={handleScreenShare} style={{ color: "black" }}>
                        {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                    </IconButton> : <></>
                }

                <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                    <CallEndIcon  />
                </IconButton>
            </div>

            <hr />
        </div>
    );
};
