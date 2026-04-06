import "./App.css";
import Landing from "./pages/LandingPage";
import AuthenticationPage from "./pages/AuthenticationPage"; // glass theme 2
import { AuthProvider } from "./contexts/AuthContext";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import HomeComponent from './pages/home';
import VideoMeetComponent from "./pages/videoMeet";
import History from "./pages/history";

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing/>} />
            <Route path="/auth" element={<AuthenticationPage />} />
            <Route path="/home" element={<HomeComponent/>} />
            <Route path="/history" element={<History/>} />
            <Route path="/:url" element={<VideoMeetComponent/>} />
          </Routes>
        </AuthProvider>
        </Router>
    </div>
      
  );
}

export default App;