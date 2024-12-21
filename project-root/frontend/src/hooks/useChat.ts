import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth';
import { useChatStore } from '../store/chat';

interface UseChat {
  sendMessage: (content: string, to: string) => void;
  markMessageAsRead: (messageId: string) => void;
}

let socket: Socket | null = null;

export const useChat = (): UseChat => {
  const token = useAuthStore((state) => state.token);
  const addMessage = useChatStore((state) => state.addMessage);
  const markAsRead = useChatStore((state) => state.markAsRead);

  useEffect(() => {
    if (!socket && token) {
      socket = io(import.meta.env.VITE_API_URL || 'https://localhost', {
        auth: { token },
        path: '/api/chat',
      });

      socket.on('connect', () => {
        console.log('Connected to chat server');
      });

      socket.on('new-message', (message) => {
        addMessage(message);
      });

      socket.on('message-read', (messageId) => {
        markAsRead(messageId);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [token, addMessage, markAsRead]);

  const sendMessage = useCallback((content: string, to: string) => {
    if (socket) {
      socket.emit('private-message', { content, to });
    }
  }, []);

  const markMessageAsRead = useCallback((messageId: string) => {
    if (socket) {
      socket.emit('mark-read', messageId);
    }
  }, []);

  return { sendMessage, markMessageAsRead };
};