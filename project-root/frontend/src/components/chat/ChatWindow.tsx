import {
    Box,
    VStack,
    Input,
    Button,
    Text,
    Flex,
    Avatar,
  } from '@chakra-ui/react';
  import { useChat } from '../../hooks/useChat';
  import { useChatStore } from '../../store/chat';
  import { useAuthStore } from '../../store/auth';
  import { useState, useRef, useEffect } from 'react';
  
  const ChatWindow = () => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { sendMessage } = useChat();
    const messages = useChatStore((state) => state.messages);
    const activeChat = useChatStore((state) => state.activeChat);
    const currentUser = useAuthStore((state) => state.user);
  
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
  
    useEffect(() => {
      scrollToBottom();
    }, [messages]);
  
    const handleSendMessage = () => {
      if (newMessage.trim() && activeChat) {
        sendMessage(newMessage, activeChat);
        setNewMessage('');
      }
    };
  
    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };
  
    return (
      <Box height="100%" display="flex" flexDirection="column">
        <Box flex="1" overflowY="auto" p={4}>
          <VStack spacing={4} align="stretch">
            {messages.map((message) => (
              <Flex
                key={message.id}
                justifyContent={message.sender === currentUser?.id ? 'flex-end' : 'flex-start'}
              >
                {message.sender !== currentUser?.id && (
                  <Avatar size="sm" marginRight={2} />
                )}
                <Box
                  maxW="70%"
                  bg={message.sender === currentUser?.id ? 'blue.500' : 'gray.100'}
                  color={message.sender === currentUser?.id ? 'white' : 'black'}
                  p={3}
                  borderRadius="lg"
                >
                  <Text>{message.content}</Text>
                  <Text fontSize="xs" opacity={0.8} mt={1}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </Text>
                </Box>
              </Flex>
            ))}
            <div ref={messagesEndRef} />
          </VStack>
        </Box>
  
        <Box p={4} borderTop="1px" borderColor="gray.200">
          <Flex>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              mr={2}
            />
            <Button colorScheme="blue" onClick={handleSendMessage}>
              Send
            </Button>
          </Flex>
        </Box>
      </Box>
    );
  };
  
  export default ChatWindow;