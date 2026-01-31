import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket'; // Changed from Webrtc
import { MonacoBinding } from 'y-monaco';

export const initCollaboration = (editor, roomId) => {
    const ydoc = new Y.Doc();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    const provider = new WebsocketProvider(
        `${protocol}//${host}`, 
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