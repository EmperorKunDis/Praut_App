import {
    Box,
    VStack,
    Text,
    Avatar,
    Input,
    InputGroup,
    InputLeftElement,
  } from '@chakra-ui/react';
  import { SearchIcon } from '@chakra-ui/icons';
  import { useChatStore } from '../../store/chat';
  import { useState } from 'react';
  
  const ChatSidebar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const activeChat = useChatStore((state) => state.activeChat);
    const setActiveChat = useChatStore((state) => state.setActiveChat);
  
    // Mock data - replace with actual user list from API
    const users = [
      { id: '1', name: 'John Doe', status: 'online' },
      { id: '2', name: 'Jane Smith', status: 'offline' },
    ];
  
    const filteredUsers = users.filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    return (
      <Box height="100%" borderRight="1px" borderColor="gray.200" p={4}>
        <VStack spacing={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
  
          <VStack spacing={2} align="stretch" width="100%">
            {filteredUsers.map((user) => (
              <Box
                key={user.id}
                p={3}
                cursor="pointer"
                borderRadius="md"
                bg={activeChat === user.id ? 'blue.50' : 'transparent'}
                _hover={{ bg: 'gray.100' }}
                onClick={() => setActiveChat(user.id)}
              >
                <Box display="flex" alignItems="center">
                  <Avatar size="sm" name={user.name} marginRight={3} />
                  <Box>
                    <Text fontWeight="medium">{user.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {user.status}
                    </Text>
                  </Box>
                </Box>
              </Box>
            ))}
          </VStack>
        </VStack>
      </Box>
    );
  };
  
  export default ChatSidebar;