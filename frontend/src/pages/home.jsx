import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {

    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");

    const {addToUserHistory} = useContext(AuthContext);
    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    return (
        <>
            <div className="appThemeShell">
                <div className="appThemeTopBar">
                    <div className="appThemeBrand">
                        <p>Connectify</p>
                        <h1>Start a meeting</h1>
                    </div>
                    <div className="appThemeActions">
                        <div className="appThemeActionItem">
                            <IconButton
                                className="appThemeIconButton"
                                onClick={
                                    () => {
                                        navigate("/history")
                                    }
                                }
                            >
                                <RestoreIcon />
                            </IconButton>
                            <p className="appThemeActionText">History</p>
                        </div>
                        <Button
                            className="appThemeGhostButton"
                            variant="outlined"
                            onClick={() => {
                                localStorage.removeItem("token")
                                navigate("/auth")
                            }}
                        >
                            Logout
                        </Button>
                    </div>
                </div>

                <div className="appThemePanel homeThemeGrid">
                    <div className="homeHeroCopy">
                        <h2>Providing Quality Video Call Just Like Quality Education</h2>
                        <p>Enter a meeting code and join with the same bluish visual language used in Connectify Meet.</p>

                        <div className="homeJoinRow">
                            <TextField
                                className="homeMeetingInput"
                                onChange={e => setMeetingCode(e.target.value)}
                                id="outlined-basic"
                                label="Meeting Code"
                                variant="outlined"
                            />
                            <Button className="homeJoinButton" onClick={handleJoinVideoCall} variant='contained'>Join</Button>
                        </div>
                    </div>

                    <div className='appThemePanel homeVisualPanel'>
                        <img srcSet='/logo3.png' alt="" />
                    </div>
                </div>
            </div>
        </>
    )
}

export default withAuth(HomeComponent)
