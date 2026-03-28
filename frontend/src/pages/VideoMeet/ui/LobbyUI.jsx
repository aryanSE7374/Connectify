import React from 'react';
import { TextField, Button } from '@mui/material';

export const LobbyUI = ({ username, setUsername, connect, localVideoref }) => {
    return (
        <div>
            <h2>Enter into Lobby </h2>
            <TextField 
                id="outlined-basic" 
                label="Username" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                variant="outlined" 
            />
            <Button variant="contained" onClick={connect} >Connect</Button>

            <h3>Video Preview</h3>
            <div>
                <video ref={localVideoref} autoPlay muted></video>
            </div>
        </div>
    );
};
