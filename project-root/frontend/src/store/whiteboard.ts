import { create } from 'zustand';

export type DrawingElement = {
  id: string;
  type: 'pencil' | 'line' | 'rectangle' | 'circle' | 'text';
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  text?: string;
  color: string;
  width: number;
  creator: string;
};

interface WhiteboardState {
  elements: DrawingElement[];
  activeElement: DrawingElement | null;
  tool: DrawingElement['type'];
  color: string;
  width: number;
  isDrawing: boolean;
  collaborators: { id: string; name: string; color: string }[];
  addElement: (element: DrawingElement) => void;
  updateElement: (element: DrawingElement) => void;
  setActiveElement: (element: DrawingElement | null) => void;
  setTool: (tool: DrawingElement['type']) => void;
  setColor: (color: string) => void;
  setWidth: (width: number) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  addCollaborator: (collaborator: { id: string; name: string; color: string }) => void;
  removeCollaborator: (id: string) => void;
  clearCanvas: () => void;
}

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
  elements: [],
  activeElement: null,
  tool: 'pencil',
  color: '#000000',
  width: 2,
  isDrawing: false,
  collaborators: [],

  addElement: (element) =>
    set((state) => ({
      elements: [...state.elements, element],
      activeElement: null,
    })),

  updateElement: (element) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === element.id ? element : el
      ),
    })),

  setActiveElement: (element) =>
    set({
      activeElement: element,
    }),

  setTool: (tool) =>
    set({
      tool,
      activeElement: null,
    }),

  setColor: (color) =>
    set({
      color,
    }),

  setWidth: (width) =>
    set({
      width,
    }),

  setIsDrawing: (isDrawing) =>
    set({
      isDrawing,
    }),

  addCollaborator: (collaborator) =>
    set((state) => ({
      collaborators: [...state.collaborators, collaborator],
    })),

  removeCollaborator: (id) =>
    set((state) => ({
      collaborators: state.collaborators.filter((c) => c.id !== id),
    })),

  clearCanvas: () =>
    set({
      elements: [],
      activeElement: null,
    }),
}));