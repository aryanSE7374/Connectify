import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar, Alert } from '@mui/material';

const defaultTheme = createTheme();

export default function Authentication2() {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [formState, setFormState] = React.useState(0); // 0: Login, 1: Register
    const [open, setOpen] = React.useState(false);

    let handleRegister, handleLogin;
    
    try {
        const context = React.useContext(AuthContext);
        if (context && context.handleRegister && context.handleLogin) {
            handleRegister = context.handleRegister;
            handleLogin = context.handleLogin;
        }
    } catch (err) {
        console.error('Auth context error:', err);
    }

    const handleAuth = async () => {
        try {
            if (!handleLogin || !handleRegister) {
                setError('Authentication functions not available. Check console.');
                return;
            }

            if (formState === 0) {
                await handleLogin(username, password);
            } else {
                const result = await handleRegister(name, username, password);
                setMessage(result);
                setOpen(true);
                setError('');
                setFormState(0);
                setUsername('');
                setPassword('');
                setName('');
            }
        } catch (err) {
            console.log('Auth error:', err);
            const errorMessage = err.response?.data?.message || 'An error occurred';
            setError(errorMessage);
        }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />
                {/* Left Side - Background with Landing BG */}
                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        backgroundImage: 'url(/BG.png)',
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: (t) =>
                            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />

                {/* Right Side - Form */}
                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                    <Box
                        sx={{
                            my: 8,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        {/* Modern Design Badge */}
                        {/* <Box 
                            sx={{ 
                                position: 'absolute', 
                                top: 16, 
                                right: 16, 
                                fontSize: '11px',
                                fontWeight: 600,
                                bgcolor: '#4caf50',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                textTransform: 'uppercase'
                            }}
                        >
                            Modern Design
                        </Box> */}

                        {/* Avatar Icon */}
                        <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }}>
                            <LockOutlinedIcon />
                        </Avatar>
                        
                        {/* Heading */}
                        <Typography component="h1" variant="h4" sx={{ fontWeight: 700, mt: 2 }}>
                            Connectify
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                            {formState === 0 ? 'Sign in to your account' : 'Create a new account'}
                        </Typography>

                        {/* Toggle Buttons */}
                        <Box sx={{ mt: 3, mb: 3, display: 'flex', gap: 1, width: '100%' }}>
                            <Button
                                variant={formState === 0 ? 'contained' : 'text'}
                                onClick={() => setFormState(0)}
                                fullWidth
                                sx={{ py: 1 }}
                            >
                                Sign In
                            </Button>
                            <Button
                                variant={formState === 1 ? 'contained' : 'text'}
                                onClick={() => setFormState(1)}
                                fullWidth
                                sx={{ py: 1 }}
                            >
                                Sign Up
                            </Button>
                        </Box>

                        {/* Form */}
                        <Box component="form" sx={{ width: '100%' }} noValidate>
                            {/* Full Name Field - Only for Sign Up */}
                            {formState === 1 && (
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="name"
                                    label="Full Name"
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    variant="outlined"
                                    size="small"
                                />
                            )}

                            {/* Username/Email Field */}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Username or Email"
                                name="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                variant="outlined"
                                size="small"
                            />

                            {/* Password Field */}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                variant="outlined"
                                size="small"
                            />

                            {/* Error Message */}
                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                size="large"
                                sx={{ mt: 3, mb: 2, py: 1.2, textTransform: 'none', fontSize: '1rem' }}
                                onClick={handleAuth}
                            >
                                {formState === 0 ? 'Sign In' : 'Create Account'}
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Success Snackbar */}
            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
            >
                <Alert severity="success">{message}</Alert>
            </Snackbar>
        </ThemeProvider>
    );
}
