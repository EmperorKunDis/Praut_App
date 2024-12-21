import { Box, HStack } from '@chakra-ui/react';
import WhiteboardCanvas from '../../components/whiteboard/WhiteboardCanvas';
import WhiteboardToolbar from '../../components/whiteboard/WhiteboardToolbar';
import { useParams } from 'react-router-dom';

const WhiteboardPage = () => {
  const { id = 'default' } = useParams();

  return (
    <Box h="calc(100vh - 100px)" position="relative">
      <HStack spacing={4} h="100%">
        <WhiteboardToolbar />
        <Box flex="1" h="100%" position="relative">
          <WhiteboardCanvas whiteboardId={id} />
        </Box>
      </HStack>
    </Box>
  );
};

export default WhiteboardPage;