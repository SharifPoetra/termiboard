import { useEffect, useRef } from 'react';
import { useSocket } from '../../../hooks/useSocket';
import { useBoardStore } from '../../../store/boardStore';
import { Card } from '@termiboard/core';
import { useNavigate } from 'react-router-dom';

export const useBoardSocket = (boardId: string, userId: string | undefined) => {
  const socket = useSocket({ boardId });
  const navigate = useNavigate();
  const {
    syncUpdateBoard,
    syncAddColumn,
    syncUpdateColumn,
    syncDeleteColumn,
    syncAddCard,
    syncUpdateCards,
    syncDeleteCard,
  } = useBoardStore();

  const pendingCardUpdatesRef = useRef<Map<string, Card>>(new Map());
  const pendingCardUpdateFrameRef = useRef<number | null>(null);

  // Queue card updates to batch process them in one animation frame
  const queueCardUpdate = (card: Card) => {
    const pendingCardUpdates = pendingCardUpdatesRef.current;
    pendingCardUpdates.set(card.id, card);
    if (pendingCardUpdateFrameRef.current !== null) return;

    pendingCardUpdateFrameRef.current = requestAnimationFrame(() => {
      pendingCardUpdateFrameRef.current = null;
      const pendingCards = Array.from(pendingCardUpdates.values());
      pendingCardUpdates.clear();
      syncUpdateCards(pendingCards);
    });
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('member_kicked', (payload: { boardId: string; userId: string }) => {
      if (payload.userId === userId) {
        console.log('[WS_STREAM] You have been kicked from the board. Evacuating...');
        sessionStorage.setItem('TERMINAL_EVAC_SIGNAL', 'true');
        navigate('/dashboard');
      }
    });

    socket.on('member_left', (_payload: { boardId: string; userId: string }) => {
      console.log('[WS_STREAM] A member has left the board');
    });

    socket.on('board_updated', (payload) => {
      syncUpdateBoard(payload);
    });

    socket.on('board_deleted', () => {
      sessionStorage.setItem('TERMINAL_EVAC_SIGNAL', 'true');
      navigate('/dashboard');
    });

    socket.on('column_created', (payload) => syncAddColumn(payload));
    socket.on('column_updated', (payload) => syncUpdateColumn(payload));
    socket.on('column_deleted', (payload) => syncDeleteColumn(payload.id));
    socket.on('card_created', (payload) => syncAddCard(payload));
    socket.on('card_updated', (payload) => queueCardUpdate(payload));
    socket.on('card_moved', (payload) => queueCardUpdate(payload));
    socket.on('card_deleted', (payload) => syncDeleteCard(payload));

    return () => {
      socket.off('board_updated');
      socket.off('board_deleted');
      socket.off('column_created');
      socket.off('column_updated');
      socket.off('column_deleted');
      socket.off('card_created');
      socket.off('card_updated');
      socket.off('card_moved');
      socket.off('card_deleted');
      if (pendingCardUpdateFrameRef.current !== null) {
        cancelAnimationFrame(pendingCardUpdateFrameRef.current);
        pendingCardUpdateFrameRef.current = null;
        pendingCardUpdatesRef.current.clear();
      }
    };
  }, [socket, userId, navigate]);
};
