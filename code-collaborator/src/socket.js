import { io } from 'socket.io-client';

// Replace with your actual backend server URL
const SOCKET_URL = 'http://localhost:5000'; 

// "autoConnect: false" is recommended if you want to control exactly 
// when the connection starts (e.g., after the user enters a username)
export const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket'], // Faster for real-time code editing
});