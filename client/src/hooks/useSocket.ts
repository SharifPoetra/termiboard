import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

export const useSocket = (boardId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token || !boardId) return;

    // Fetch the backend URL dynamically from Vite's environment variables
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // Initialize socket connection using the dynamic gateway URL
    socketRef.current = io(backendUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log(`[WS] Connected to gateway. Tunneling board: ${boardId}`);
      // Join isolated workspace channel space mapping this specific board UUID
      socket.emit('join_board', boardId);
    });

    socket.on('disconnect', () => {
      console.log('[WS] Disconnected from gateway stream.');
    });

    socket.on('connect_error', (err) => {
      console.error('[WS] Connection auth failure:', err.message);
    });

    // Cleanup connection stream when component unmounts or boardId shifts
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [boardId, token]);

  return socketRef.current;
};
