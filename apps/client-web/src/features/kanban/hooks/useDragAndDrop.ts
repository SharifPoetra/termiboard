import { useState, useRef } from 'react';
import { useBoardStore } from '../../../store/boardStore';
import { Card } from '@termiboard/core';
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';

export const useDragAndDrop = (boardId: string) => {
  const { cards, persistCardPosition } = useBoardStore();

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [persistingCardId, setPersistingCardId] = useState<string | null>(null);

  // Local state untuk preview drag tanpa re-render Zustand
  const [localCards, setLocalCards] = useState<Record<string, Card[]>>(() => useBoardStore.getState().cards);
  const localCardsRef = useRef(localCards);
  const dragSnapshotRef = useRef<Record<string, Card[]>>({});
  const isLocallyDragging = useRef(false);

  const findCardColumnId = (cardGroups: Record<string, Card[]>, cardId: string) =>
    Object.entries(cardGroups).find(([, columnCards]) => columnCards.some((card) => card.id === cardId))?.[0] ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    isLocallyDragging.current = true;
    dragSnapshotRef.current = useBoardStore.getState().cards;

    const cardId = String(event.operation.source?.id);
    const foundCard =
      Object.values(cards)
        .flat()
        .find((c) => c.id === cardId) || null;
    setActiveCard(foundCard);
  };

  const handleDragOver = (event: DragOverEvent) => {
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

      if (currentColumnId !== overColumnId) {
        const newSource = sourceCards.filter((c) => c.id !== cardId);
        const targetCards = prev[overColumnId] || [];
        const cardWithNewCol = { ...cardToMove, columnId: overColumnId };

        if (target.data?.type === 'Column') {
          return {
            ...prev,
            [currentColumnId]: newSource,
            [overColumnId]: [...targetCards.filter((c) => c.id !== cardId), cardWithNewCol],
          };
        }

        const baseTarget = [...targetCards.filter((c) => c.id !== cardId), cardWithNewCol];
        const newTarget = move(baseTarget, event);
        return { ...prev, [currentColumnId]: newSource, [overColumnId]: newTarget };
      }

      const newCards = move(sourceCards, event);
      return { ...prev, [currentColumnId]: newCards };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { source, target } = event.operation;
    setActiveCard(null);
    isLocallyDragging.current = false;

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

    useBoardStore.setState({ cards: localCardsRef.current });
    setPersistingCardId(cardId);

    try {
      await persistCardPosition(cardId, targetColumnId, prevCard?.position ?? null, nextCard?.position ?? null);
    } catch (err) {
      console.error('Persist failed, rollback', err);
      useBoardStore.setState({ cards: dragSnapshotRef.current });
      setLocalCards(dragSnapshotRef.current);
    } finally {
      setPersistingCardId(null);
    }
  };

  return {
    localCards,
    setLocalCards,
    localCardsRef,
    activeCard,
    setActiveCard,
    persistingCardId,
    isLocallyDragging,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};
