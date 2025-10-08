import Chat from "./components/Chat";
import Login from "./components/Login";
import Signup from './components/Signup';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { StrictMode } from "react";

function App() {
  return (
    <StrictMode>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </Router>
    </StrictMode>
  );
}

export default App;
