import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';

const defaultTheme = createTheme();

export default function Authentication4() {

    // ✅ Change 1:
    // Initialized states with "" instead of undefined
    // Prevents React warnings

    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false)

    const { handleRegister, handleLogin } = React.useContext(AuthContext);


    let handleAuth = async () => {
        try {

            if (formState === 0) {

                let result = await handleLogin(username, password)

            }

            if (formState === 1) {

                let result = await handleRegister(name, username, password);

                setUsername("");
                setPassword("");

                setMessage(result);
                setOpen(true);

                setError("");

                setFormState(0);

            }

        } catch (err) {

            let message = (err.response.data.message);

            setError(message);

        }
    }



    return (

        <ThemeProvider theme={defaultTheme}>

            <CssBaseline />



            {/* ✅ Change 2:
                Added SAME background as landing page

                background: BG.png
            */}

            <Box
                sx={{

                    height: "100vh",

                    width: "100vw",

                    display: "flex",

                    justifyContent: "center",

                    alignItems: "center",

                    background: "url('/BG.png')",

                    backgroundSize: "cover",

                    backgroundPosition: "center"

                }}
            >



                {/* ✅ Change 3:
                    Converted white card → Glass card

                    Matches landing page navbar
                */}

                <Paper

                    elevation={0}

                    sx={{

                        padding: 4,

                        width: 380,

                        textAlign: "center",

                        background: "rgba(255,255,255,0.08)",

                        backdropFilter: "blur(18px)",

                        borderRadius: "20px",

                        border: "1px solid rgba(255,255,255,0.25)",

                        color: "white"

                    }}

                >



                    {/* ✅ Change 4:
                        Avatar color matched with landing page button
                    */}

                    <Avatar

                        sx={{

                            margin: "auto",

                            bgcolor: "#D97500"

                        }}

                    >

                        <LockOutlinedIcon />

                    </Avatar>



                    <Box sx={{ mt: 2 }}>



                        <Button

                            variant={formState === 0 ? "contained" : "outlined"}

                            onClick={() => setFormState(0)}

                            sx={{

                                mr: 1,

                                color: "white",

                                borderColor: "white"

                            }}

                        >

                            Sign In

                        </Button>



                        <Button

                            variant={formState === 1 ? "contained" : "outlined"}

                            onClick={() => setFormState(1)}

                            sx={{

                                color: "white",

                                borderColor: "white"

                            }}

                        >

                            Sign Up

                        </Button>



                    </Box>



                    <Box component="form" sx={{ mt: 2 }}>



                        {

                            formState === 1 &&

                            <TextField

                                margin="normal"

                                fullWidth

                                label="Full Name"

                                value={name}

                                onChange={(e) => setName(e.target.value)}

                            />

                        }



                        <TextField

                            margin="normal"

                            fullWidth

                            label="Username"

                            value={username}

                            onChange={(e) => setUsername(e.target.value)}

                        />



                        <TextField

                            margin="normal"

                            fullWidth

                            label="Password"

                            type="password"

                            value={password}

                            onChange={(e) => setPassword(e.target.value)}

                        />



                        <p style={{ color: "red" }}>

                            {error}

                        </p>



                        {/* ✅ Change 5:
                            Button color matched with landing page
                        */}

                        <Button

                            fullWidth

                            variant="contained"

                            sx={{

                                mt: 2,

                                background: "#D97500"

                            }}

                            onClick={handleAuth}

                        >

                            {

                                formState === 0

                                    ? "Login"

                                    : "Register"

                            }

                        </Button>



                    </Box>



                </Paper>



            </Box>



            <Snackbar

                open={open}

                autoHideDuration={4000}

                message={message}

            />



        </ThemeProvider>

    );

}