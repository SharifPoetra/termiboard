import { useState, useRef, useCallback } from 'react';
import { useBoardStore } from '../../../store/boardStore';
import { Card } from '@termiboard/core';
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';

export const useDragAndDrop = (boardId: string) => {
  const { cards, persistCardPosition } = useBoardStore();

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [persistingCardId, setPersistingCardId] = useState<string | null>(null);

  // Local state allows us to update the UI immediately during drag without causing expensive Zustand-wide re-renders
  const [localCards, setLocalCards] = useState<Record<string, Card[]>>(() => useBoardStore.getState().cards);
  const localCardsRef = useRef(localCards);
  // Snapshot of the card layout before the drag started, used for rollback if needed
  const dragSnapshotRef = useRef<Record<string, Card[]>>({});
  // Flag that blocks incoming WebSocket updates while the user is dragging locally
  const isLocallyDragging = useRef(false);

  // Keep the ref in sync with the latest local state so it is safe to read inside async handlers
  localCardsRef.current = localCards;

  // Helper: find which column a card currently resides in
  const findCardColumnId = (cardGroups: Record<string, Card[]>, cardId: string) =>
    Object.entries(cardGroups).find(([, columnCards]) => columnCards.some((card) => card.id === cardId))?.[0] ?? null;

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      // Mark the beginning of a local drag; stop reacting to WS updates
      isLocallyDragging.current = true;
      // Deep-clone the current card layout so we can restore it exactly if the drag is cancelled or fails
      dragSnapshotRef.current = JSON.parse(JSON.stringify(localCardsRef.current));

      const cardId = String(event.operation.source?.id);
      const foundCard =
        Object.values(cards)
          .flat()
          .find((c) => c.id === cardId) || null;
      setActiveCard(foundCard);
    },
    [cards],
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { source, target } = event.operation;
    if (!target) return;

    const cardId = String(source?.id);
    const overId = String(target.id);
    if (cardId === overId) return;

    const activeColumnId = String(source?.data?.columnId || '');
    const overColumnId = target.data?.type === 'Column' ? overId : String(target.data?.columnId);
    if (!activeColumnId || !overColumnId) return;

    setLocalCards((prev) => {
      const currentColumnId = findCardColumnId(prev, cardId) ?? activeColumnId;
      const sourceCards = prev[currentColumnId] || [];
      const cardToMove = sourceCards.find((c) => c.id === cardId);
      if (!cardToMove) return prev;

      // Moving the card to a different column
      if (currentColumnId !== overColumnId) {
        const newSource = sourceCards.filter((c) => c.id !== cardId);
        const targetCards = prev[overColumnId] || [];
        const cardWithNewCol = { ...cardToMove, columnId: overColumnId };

        // Dropped directly onto the column container, append to the end
        if (target.data?.type === 'Column') {
          return {
            ...prev,
            [currentColumnId]: newSource,
            [overColumnId]: [...targetCards.filter((c) => c.id !== cardId), cardWithNewCol],
          };
        }

        // Dropped between specific cards, use dnd-kit's `move` helper to find the correct index
        const baseTarget = [...targetCards.filter((c) => c.id !== cardId), cardWithNewCol];
        const newTarget = move(baseTarget, event);
        return { ...prev, [currentColumnId]: newSource, [overColumnId]: newTarget };
      }

      // Reordering within the same column
      const newCards = move(sourceCards, event);
      return { ...prev, [currentColumnId]: newCards };
    });
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { source, target } = event.operation;
      setActiveCard(null);
      // Allow WS updates to come through again
      isLocallyDragging.current = false;

      // User dropped outside any valid target — revert to the pre-drag snapshot
      if (event.canceled || !target) {
        setLocalCards(dragSnapshotRef.current);
        return;
      }

      const cardId = String(source?.id);
      const targetColumnId = target.data?.type === 'Column' ? String(target.id) : String(target.data?.columnId);

      const finalList = localCardsRef.current[targetColumnId] || [];
      const finalIndex = finalList.findIndex((c) => c.id === cardId);
      const prevCard = finalList[finalIndex - 1];
      const nextCard = finalList[finalIndex + 1];

      // Optimistic update: immediately apply the new layout to the Zustand store
      useBoardStore.setState({ cards: localCardsRef.current });
      setPersistingCardId(cardId);

      try {
        // Persist the new position to the backend
        await persistCardPosition(cardId, targetColumnId, prevCard?.position ?? null, nextCard?.position ?? null);
        // After successful persistence, sync the local state with the store's ground truth
        setLocalCards(useBoardStore.getState().cards);
      } catch (err) {
        console.error('Persist failed, rollback', err);
        // If the API call fails, revert both the local and the store state to the snapshot
        setLocalCards(dragSnapshotRef.current);
      } finally {
        setPersistingCardId(null);
      }
    },
    [persistCardPosition],
  );

  return {
    localCards,
    setLocalCards,
    localCardsRef,
    activeCard,
    persistingCardId,
    isLocallyDragging,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};
