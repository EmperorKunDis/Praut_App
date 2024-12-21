import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth';
import { useWhiteboardStore, DrawingElement } from '../store/whiteboard';
import { v4 as uuidv4 } from 'uuid';

interface UseWhiteboard {
  startDrawing: (x: number, y: number) => void;
  continueDrawing: (x: number, y: number) => void;
  finishDrawing: () => void;
  addText: (text: string, x: number, y: number) => void;
}

let socket: Socket | null = null;

export const useWhiteboard = (whiteboardId: string): UseWhiteboard => {
  const token = useAuthStore((state) => state.token);
  const {
    addElement,
    updateElement,
    setIsDrawing,
    tool,
    color,
    width,
    activeElement,
    setActiveElement,
  } = useWhiteboardStore();

  useEffect(() => {
    if (!socket && token) {
      socket = io(import.meta.env.VITE_API_URL || 'https://localhost', {
        auth: { token },
        path: '/api/whiteboards',
      });

      socket.on('connect', () => {
        console.log('Connected to whiteboard server');
        socket?.emit('join-whiteboard', whiteboardId);
      });

      socket.on('element-drawn', (element: DrawingElement) => {
        addElement(element);
      });

      socket.on('element-updated', (element: DrawingElement) => {
        updateElement(element);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from whiteboard server');
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [token, whiteboardId, addElement, updateElement]);

  const startDrawing = useCallback(
    (x: number, y: number) => {
      const element: DrawingElement = {
        id: uuidv4(),
        type: tool,
        points: tool === 'pencil' ? [{ x, y }] : undefined,
        start: { x, y },
        end: { x, y },
        color,
        width,
        creator: useAuthStore.getState().user?.id || '',
      };

      setActiveElement(element);
      setIsDrawing(true);

      if (socket) {
        socket.emit('draw-element', { whiteboardId, element });
      }
    },
    [tool, color, width, setActiveElement, setIsDrawing]
  );

  const continueDrawing = useCallback(
    (x: number, y: number) => {
      if (!activeElement) return;

      const updatedElement = { ...activeElement };

      if (tool === 'pencil' && updatedElement.points) {
        updatedElement.points = [...updatedElement.points, { x, y }];
      } else {
        updatedElement.end = { x, y };
      }

      setActiveElement(updatedElement);

      if (socket) {
        socket.emit('update-element', { whiteboardId, element: updatedElement });
      }
    },
    [activeElement, tool, setActiveElement]
  );

  const finishDrawing = useCallback(() => {
    if (activeElement) {
      addElement(activeElement);
      if (socket) {
        socket.emit('element-finished', {
          whiteboardId,
          element: activeElement,
        });
      }
    }
    setIsDrawing(false);
    setActiveElement(null);
  }, [activeElement, addElement, setIsDrawing, setActiveElement]);

  const addText = useCallback(
    (text: string, x: number, y: number) => {
      const element: DrawingElement = {
        id: uuidv4(),
        type: 'text',
        start: { x, y },
        text,
        color,
        width,
        creator: useAuthStore.getState().user?.id || '',
      };

      addElement(element);

      if (socket) {
        socket.emit('draw-element', { whiteboardId, element });
      }
    },
    [color, width, addElement]
  );

  return {
    startDrawing,
    continueDrawing,
    finishDrawing,
    addText,
  };
};