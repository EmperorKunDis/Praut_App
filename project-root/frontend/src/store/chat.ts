import { create } from 'zustand';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface ChatState {
  messages: Message[];
  activeChat: string | null;
  unreadCount: number;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setActiveChat: (userId: string) => void;
  markAsRead: (messageId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  activeChat: null,
  unreadCount: 0,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      unreadCount: state.activeChat !== message.sender ? state.unreadCount + 1 : state.unreadCount,
    })),
  setActiveChat: (userId) =>
    set({
      activeChat: userId,
      unreadCount: 0,
    }),
  markAsRead: (messageId) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, read: true } : msg
      ),
    })),
}));