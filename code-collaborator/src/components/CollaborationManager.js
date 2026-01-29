import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket'; // Changed from Webrtc
import { MonacoBinding } from 'y-monaco';

export const initCollaboration = (editor, roomId) => {
    const ydoc = new Y.Doc();

    // Use your existing backend server for syncing
    const provider = new WebsocketProvider(
        'ws://localhost:5000', // Connect to your server
        roomId, 
        ydoc
    );

    const ytext = ydoc.getText('monaco');

    const binding = new MonacoBinding(
        ytext,
        editor.getModel(),
        new Set([editor]),
        provider.awareness
    );

    return { ydoc, provider, binding };
};