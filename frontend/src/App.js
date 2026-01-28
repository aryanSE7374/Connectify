import logo from "./logo.svg";
import "./App.css";
import LandingPage from "./pages/landing";
import Authentication from "./pages/authentication";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import VideoMeet from "./pages/VideoMeet";

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Authentication />} />
            <Route path="/:url" element={<VideoMeet />}/>
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
