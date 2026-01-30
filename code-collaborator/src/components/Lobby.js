import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import './Lobby.css'; 

const Lobby = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    const handleCreateNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
    };

    const handleCopyRoomId = () => {
        if (!roomId) return;
        navigator.clipboard.writeText(roomId);
        alert("Room ID copied to clipboard!"); 
    };

    const handleJoinRoom = () => {
        if (!roomId || !username) {
            alert("Please enter both a Room ID and a Username.");
            return;
        }
        socket.connect();
        navigate(`/editor/${roomId}`, { state: { username } });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') handleJoinRoom();
    };

    return (
        <div className="lobby-wrapper">
            <div className="binary-bg">
                {[...Array(80)].map((_, i) => (
                    <span 
                        key={i} 
                        className="bit" 
                        style={{
                            left: (Math.random() * 100) + "%",
                            animationDuration: (Math.random() * 8 + 4) + "s",
                            animationDelay: (Math.random() * 5) + "s",
                            opacity: Math.random() * 0.3 + 0.1, 
                            fontSize: (Math.random() * 10 + 15) + "px"
                        }}
                    >
                        {Math.round(Math.random())}
                    </span>
                ))}
            </div>

            <div className="lobby-card">
                <h1 className="lobby-title">CodeSync Lobby</h1>
                <p className="lobby-subtitle">Collaborate. Compile. Debug.</p>
                
                <div onKeyUp={handleInputEnter}>
                    <input
                        type="text"
                        placeholder="USERNAME"
                        className="lobby-input mb-15"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    
                    <div className="input-wrapper">
                        <input
                            type="text"
                            placeholder="ROOM ID"
                            className="lobby-input"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                        />
                        {roomId && (
                            <button onClick={handleCopyRoomId} className="copy-btn">
                                COPY
                            </button>
                        )}
                    </div>

                    <button className="main-btn" onClick={handleJoinRoom}>
                        Enter Workspace
                    </button>
                    
                    <div className="footer-text">
                        Need a private space?&nbsp;
                        <span onClick={handleCreateNewRoom} className="create-link">
                            Generate Room
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Lobby;