import { Box, Flex, useColorModeValue } from '@chakra-ui/react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  
  return (
    <Box minH="100vh" bg={bgColor}>
      <Header />
      <Flex>
        <Sidebar />
        <Box flex="1" p={4}>
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout;