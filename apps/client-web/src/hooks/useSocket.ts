import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { ServerToClientEvents, ClientToServerEvents } from '@termiboard/core';

interface UseSocketOptions {
  boardId?: string | null;
  subscribeNotifications?: boolean;
}

export const useSocket = (options?: UseSocketOptions) => {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const boardId = options?.boardId;
  const subscribeNotifications = options?.subscribeNotifications;

  useEffect(() => {
    if (!token) return;
    if (!boardId && !subscribeNotifications) return;

    // Fetch the backend URL dynamically from Vite's environment variables
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // Initialize socket connection using the dynamic gateway URL
    socketRef.current = io(backendUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      if (boardId) {
        console.log(`[WS] Tunneling board room: ${boardId}`);
        socket.emit('join_board', boardId);
      }
      if (subscribeNotifications && user?.id) {
        console.log(`[WS] Subscribing to notification tunnel for user: ${user.id}`);
        socket.emit('subscribe_notifications', user.id);
      }
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
  }, [boardId, subscribeNotifications, token, user?.id]);

  return socketRef.current;
};
