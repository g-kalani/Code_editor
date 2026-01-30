import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

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

    const styles = {
        wrapper: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#020617',
            color: '#f8fafc',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden',
        },
        binaryBg: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: 0.3,
            zIndex: 0,
        },
        card: {
            position: 'relative',
            zIndex: 1,
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(12px)',
            padding: '40px',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
        },
        inputWrapper: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '15px',
        },
        input: {
            width: '100%',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #334155',
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box'
        },
        copyBtn: {
            position: 'absolute',
            right: '10px',
            background: '#334155',
            border: 'none',
            color: '#60a5fa',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
        },
        button: {
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(to right, #3b82f6, #2563eb)',
            color: 'white',
            fontWeight: '700',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '10px',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)',
        }
    };

    return (
        <div style={styles.wrapper}>
            <style>
                {`
                @keyframes fall {
                    0% { transform: translateY(-100vh); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(100vh); opacity: 0; }
                }
                .bit {
                    position: absolute;
                    color: #60a5fa;
                    font-family: monospace;
                    font-size: 20px;
                    animation: fall linear infinite;
                }
                `}
            </style>
            
            
            <div style={styles.binaryBg}>
                {/* Increased from 20 to 60 for better density */}
                {[...Array(60)].map((_, i) => (
                    <span 
                        key={i} 
                        className="bit" 
                        style={{
                            left: (Math.random() * 100) + "%",
                            animationDuration: (Math.random() * 8 + 4) + "s", // Varied speeds
                            animationDelay: (Math.random() * 5) + "s",
                            // Visibility boost
                            opacity: Math.random() * 0.3 + 0.1, 
                            fontSize: (Math.random() * 10 + 15) + "px" // Varied sizes for depth
                        }}
                    >
                        {Math.round(Math.random())}
                    </span>
                ))}
            </div>

            <div style={styles.card}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px', textAlign: 'center', background: 'linear-gradient(to right, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    CodeSync Lobby
                </h1>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '30px', textAlign: 'center' }}>
                    Collaborate. Compile. Debug.
                </p>
                
                <div onKeyUp={handleInputEnter}>
                    <input
                        type="text"
                        placeholder="USERNAME"
                        style={{...styles.input, marginBottom: '15px'}}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    
                    <div style={styles.inputWrapper}>
                        <input
                            type="text"
                            placeholder="ROOM ID"
                            style={styles.input}
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                        />
                        {roomId && (
                            <button onClick={handleCopyRoomId} style={styles.copyBtn}>
                                COPY
                            </button>
                        )}
                    </div>

                    <button style={styles.button} onClick={handleJoinRoom}>
                        Enter Workspace
                    </button>
                    
                    <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
                        Need a private space?&nbsp;
                        <span 
                            onClick={handleCreateNewRoom} 
                            style={{ color: '#60a5fa', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                        >
                            Generate Room
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Lobby;