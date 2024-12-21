import { Box, Grid, GridItem } from '@chakra-ui/react';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import { useChatStore } from '../../store/chat';

const ChatPage = () => {
  const activeChat = useChatStore((state) => state.activeChat);

  return (
    <Grid templateColumns="300px 1fr" h="calc(100vh - 100px)" gap={4}>
      <GridItem>
        <ChatSidebar />
      </GridItem>
      <GridItem>
        {activeChat ? (
          <ChatWindow />
        ) : (
          <Box
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="gray.500"
          >
            Select a chat to start messaging
          </Box>
        )}
      </GridItem>
    </Grid>
  );
};

export default ChatPage;