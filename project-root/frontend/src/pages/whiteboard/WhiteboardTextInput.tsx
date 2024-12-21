import {
    Box,
    Input,
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from '@chakra-ui/react';
  import { useEffect, useRef } from 'react';
  import { useWhiteboardStore } from '../../store/whiteboard';
  import { useWhiteboard } from '../../hooks/useWhiteboard';
  
  interface WhiteboardTextInputProps {
    position: { x: number; y: number };
    onClose: () => void;
    whiteboardId: string;
  }
  
  const WhiteboardTextInput = ({
    position,
    onClose,
    whiteboardId,
  }: WhiteboardTextInputProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { addText } = useWhiteboard(whiteboardId);
  
    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []);
  
    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        const text = (e.target as HTMLInputElement).value;
        if (text) {
          addText(text, position.x, position.y);
        }
        onClose();
      }
    };
  
    return (
      <Popover
        isOpen={true}
        onClose={onClose}
        placement="bottom"
        initialFocusRef={inputRef}
      >
        <PopoverTrigger>
          <Box position="absolute" left={position.x} top={position.y} />
        </PopoverTrigger>
        <PopoverContent width="200px">
          <Input
            ref={inputRef}
            placeholder="Type and press Enter"
            onKeyPress={handleKeyPress}
            onBlur={onClose}
          />
        </PopoverContent>
      </Popover>
    );
  };
  
  export default WhiteboardTextInput;