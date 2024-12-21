import {
    Box,
    HStack,
    Avatar,
    Text,
    Tooltip,
    AvatarGroup,
  } from '@chakra-ui/react';
  import { useWhiteboardStore } from '../../store/whiteboard';
  
  const WhiteboardCollaborators = () => {
    const collaborators = useWhiteboardStore((state) => state.collaborators);
  
    return (
      <Box
        position="absolute"
        top={4}
        right={4}
        bg="white"
        borderRadius="md"
        boxShadow="sm"
        p={2}
      >
        <HStack spacing={2}>
          <Text fontSize="sm" color="gray.600">
            Collaborators:
          </Text>
          <AvatarGroup size="sm" max={3}>
            {collaborators.map((collaborator) => (
              <Tooltip
                key={collaborator.id}
                label={collaborator.name}
                placement="bottom"
              >
                <Avatar
                  name={collaborator.name}
                  bg={collaborator.color}
                  size="sm"
                />
              </Tooltip>
            ))}
          </AvatarGroup>
        </HStack>
      </Box>
    );
  };
  
  export default WhiteboardCollaborators;