import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Lobby from './components/Lobby';
import EditorPage from './components/EditorPage';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* The landing page where users create/join rooms */}
                <Route path="/" element={<Lobby />} />
                
                {/* The collaborative workspace, identified by roomId */}
                <Route path="/editor/:roomId" element={<EditorPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;