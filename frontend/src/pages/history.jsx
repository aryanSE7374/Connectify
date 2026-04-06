import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import "../App.css";
import Card from '@mui/material/Card';
// import Box from '@mui/material/Box';
// import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
// import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';

import { IconButton } from '@mui/material';
export default function History() {

    const { getHistoryOfUser } = useContext(AuthContext);

    const [meetings, setMeetings] = useState([])

    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // IMPLEMENT SNACKBAR
            }
        }

        fetchHistory();
    }, [])

    let formatDate = (dateString) => {

        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear();

        return `${day}/${month}/${year}`

    }

    return (
        <div className="appThemeShell">
            <div className="historyThemeLayout">
                <div className="historySectionHeader">
                    <div className="appThemeBrand">
                        <p>Connectify</p>
                        <h1>Meeting history</h1>
                        <p className="historyIntro">
                            Review the rooms you joined with the same surfaces and spacing used in Meet.
                        </p>
                    </div>

                    <div className="appThemeActions">
                        <div className="appThemeActionItem">
                            <IconButton
                                className="appThemeIconButton"
                                onClick={() => {
                                    routeTo("/home")
                                }}
                            >
                                <HomeIcon />
                            </IconButton >
                            <p className="appThemeActionText">Home</p>
                        </div>
                    </div>
                </div>

                {
                    (meetings.length !== 0) ? (
                        <div className="historyGrid">
                            {meetings.map((e, i) => {
                                return (
                                    <>
                                        <Card key={i} variant="outlined" className="historyCard">
                                            <CardContent>
                                                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                                    Code: {e.meetingCode}
                                                </Typography>

                                                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                                    Date: {formatDate(e.date)}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="historyEmptyState">
                            <p>Connectify</p>
                            <h2>No meetings yet</h2>
                            <span>Your joined meetings will appear here.</span>
                        </div>
                    )

                }
            </div>
        </div>
    )
}
