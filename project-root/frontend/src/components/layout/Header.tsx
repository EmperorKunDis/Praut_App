import {
    Box,
    Flex,
    IconButton,
    Button,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useColorModeValue,
    Text,
  } from '@chakra-ui/react';
  import { useAuthStore } from '../../store/auth';
  import { authApi } from '../../api/auth';
  
  const Header = () => {
    const user = useAuthStore((state) => state.user);
    const bgColor = useColorModeValue('white', 'gray.800');
  
    const handleLogout = () => {
      authApi.logout();
    };
  
    return (
      <Box
        bg={bgColor}
        px={4}
        py={2}
        borderBottom={1}
        borderStyle="solid"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontSize="xl" fontWeight="bold">
            Praut App
          </Text>
          
          <Menu>
            <MenuButton as={Button}>
              {user?.fullName}
            </MenuButton>
            <MenuList>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Box>
    );
  };
  
  export default Header;