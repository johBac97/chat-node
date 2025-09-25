import { useState } from 'react'
//import './App.css'
import Chat from './components/Chat';
import Login from './components/Login';
import Layout from '@/components/Layout';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const [username, setUsername] = useState<string | null>(null);

  return (
    <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
    </Router>
  );
};

export default App;

