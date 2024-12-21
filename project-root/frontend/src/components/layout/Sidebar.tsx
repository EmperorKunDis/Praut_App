import { Box, VStack, Link, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const activeColor = useColorModeValue('blue.500', 'blue.200');

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/chat', label: 'Chat' },
    { path: '/whiteboard', label: 'Whiteboard' },
  ];

  return (
    <Box
      w="200px"
      h="calc(100vh - 60px)"
      bg={bgColor}
      borderRight={1}
      borderStyle="solid"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      p={4}
    >
      <VStack spacing={4} align="stretch">
        {navItems.map((item) => (
          <Link
            key={item.path}
            as={RouterLink}
            to={item.path}
            color={location.pathname === item.path ? activeColor : undefined}
            p={2}
            borderRadius="md"
            _hover={{
              bg: useColorModeValue('gray.100', 'gray.700'),
            }}
          >
            {item.label}
          </Link>
        ))}
      </VStack>
    </Box>
  );
};

export default Sidebar;