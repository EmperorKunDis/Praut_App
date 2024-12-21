import {
    VStack,
    IconButton,
    Divider,
    Tooltip,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    Box,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    SimpleGrid,
  } from '@chakra-ui/react';
  import {
    Square,
    Circle,
    Minus,
    Type,
    Edit2,
    Trash2,
  } from 'lucide-react';
  import { useWhiteboardStore } from '../../store/whiteboard';
  
  const WhiteboardToolbar = () => {
    const { tool, setTool, color, setColor, width, setWidth, clearCanvas } = useWhiteboardStore();
  
    const colors = [
      '#000000', '#FF0000', '#00FF00', '#0000FF',
      '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF',
    ];
  
    const tools = [
      { icon: Edit2, name: 'pencil', tooltip: 'Pencil' },
      { icon: Minus, name: 'line', tooltip: 'Line' },
      { icon: Square, name: 'rectangle', tooltip: 'Rectangle' },
      { icon: Circle, name: 'circle', tooltip: 'Circle' },
      { icon: Type, name: 'text', tooltip: 'Text' },
    ];
  
    return (
      <VStack
        spacing={3}
        p={3}
        bg="white"
        borderRadius="md"
        boxShadow="sm"
        height="fit-content"
      >
        {tools.map(({ icon: Icon, name, tooltip }) => (
          <Tooltip key={name} label={tooltip} placement="right">
            <IconButton
              aria-label={tooltip}
              icon={<Icon />}
              size="md"
              variant={tool === name ? 'solid' : 'ghost'}
              colorScheme={tool === name ? 'blue' : 'gray'}
              onClick={() => setTool(name as any)}
            />
          </Tooltip>
        ))}
  
        <Divider />
  
        <Popover placement="right">
          <PopoverTrigger>
            <IconButton
              aria-label="Select Color"
              icon={
                <Box
                  w="20px"
                  h="20px"
                  borderRadius="md"
                  bg={color}
                  border="2px solid"
                  borderColor="gray.200"
                />
              }
              size="md"
            />
          </PopoverTrigger>
          <PopoverContent width="auto">
            <PopoverBody>
              <SimpleGrid columns={4} spacing={2}>
                {colors.map((c) => (
                  <Box
                    key={c}
                    w="24px"
                    h="24px"
                    borderRadius="md"
                    bg={c}
                    border="2px solid"
                    borderColor={c === color ? 'blue.500' : 'gray.200'}
                    cursor="pointer"
                    onClick={() => setColor(c)}
                  />
                ))}
              </SimpleGrid>
            </PopoverBody>
          </PopoverContent>
        </Popover>
  
        <Box width="40px">
          <Slider
            aria-label="line-width"
            defaultValue={width}
            min={1}
            max={10}
            orientation="vertical"
            minH="100px"
            onChange={setWidth}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </Box>
  
        <Divider />
  
        <Tooltip label="Clear Canvas" placement="right">
          <IconButton
            aria-label="Clear Canvas"
            icon={<Trash2 />}
            size="md"
            colorScheme="red"
            variant="ghost"
            onClick={clearCanvas}
          />
        </Tooltip>
      </VStack>
    );
  };
  
  export default WhiteboardToolbar;