import "./App.css";
import Landing from "./pages/LandingPage";
// import Authenticationv2 from "./pages/authentication2";
import Authentication from "./pages/authentication";
import { AuthProvider } from "./contexts/AuthContext";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import HomeComponent from './pages/home';

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            < Route path="/" element={<Landing/>} />
            <Route path="/auth" element={<Authentication />} />
            < Route path="/home" element={<HomeComponent/>} />
          </Routes>
        </AuthProvider>
        </Router>
    </div>
      
  );
}

export default App;