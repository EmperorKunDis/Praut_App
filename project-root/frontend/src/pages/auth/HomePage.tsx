import {
    Box,
    Container,
    Heading,
    SimpleGrid,
    Text,
    Card,
    CardHeader,
    CardBody,
    Icon,
    VStack,
  } from '@chakra-ui/react';
  import { useAuthStore } from '../store/auth';
  import { Link as RouterLink } from 'react-router-dom';
  import { ChatIcon, EditIcon } from '@chakra-ui/icons';
  
  const HomePage = () => {
    const user = useAuthStore((state) => state.user);
  
    const features = [
      {
        title: 'Real-time Chat',
        description: 'Connect with your team through instant messaging',
        icon: ChatIcon,
        path: '/chat',
      },
      {
        title: 'Interactive Whiteboard',
        description: 'Collaborate on ideas with a shared whiteboard',
        icon: EditIcon,
        path: '/whiteboard',
      },
    ];
  
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>
              Welcome, {user?.fullName}!
            </Heading>
            <Text color="gray.600">
              Select a feature below to get started
            </Text>
          </Box>
  
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            {features.map((feature) => (
              <Card
                key={feature.path}
                as={RouterLink}
                to={feature.path}
                _hover={{
                  transform: 'translateY(-4px)',
                  boxShadow: 'lg',
                }}
                transition="all 0.2s"
              >
                <CardHeader>
                  <Icon as={feature.icon} w={8} h={8} color="blue.500" mb={4} />
                  <Heading size="md">{feature.title}</Heading>
                </CardHeader>
                <CardBody>
                  <Text color="gray.600">{feature.description}</Text>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    );
  };
  
  export default HomePage;