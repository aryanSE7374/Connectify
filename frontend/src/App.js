import "./App.css";
import Landing from "./pages/LandingPage";
// import Authentication from "./pages/authentication"; // classic MUI
// import Authentication2 from "./pages/authentication2"; // classic MUI 2
// import Authentication3 from "./pages/authentication3"; // glass theme 1
import Authentication4 from "./pages/AuthenticationPage"; // glass theme 2
import { AuthProvider } from "./contexts/AuthContext";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import HomeComponent from './pages/home';
import VideoMeetComponent from "./pages/VideoMeet1";
import VideoMeetComponent2 from "./pages/videoMeet2";
// import VideoMeetComponent from './pages/VideoMeet'
import History from "./pages/history";

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing/>} />
            <Route path="/auth" element={<Authentication4 />} />
            <Route path="/home" element={<HomeComponent/>} />
            <Route path="/history" element={<History/>} />
            <Route path="/:url" element={<VideoMeetComponent2/>} />
          </Routes>
        </AuthProvider>
        </Router>
    </div>
      
  );
}

export default App;