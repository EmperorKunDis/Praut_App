import { useRef, useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import { useWhiteboard } from '../../hooks/useWhiteboard';
import { useWhiteboardStore } from '../../store/whiteboard';

interface WhiteboardCanvasProps {
  whiteboardId: string;
}

const WhiteboardCanvas = ({ whiteboardId }: WhiteboardCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { startDrawing, continueDrawing, finishDrawing } = useWhiteboard(whiteboardId);
  const { elements, activeElement, isDrawing } = useWhiteboardStore();
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all elements
    elements.forEach((element) => {
      ctx.beginPath();
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.width;

      if (element.type === 'pencil' && element.points) {
        ctx.moveTo(element.points[0].x, element.points[0].y);
        element.points.forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
      } else if (element.start && element.end) {
        if (element.type === 'line') {
          ctx.moveTo(element.start.x, element.start.y);
          ctx.lineTo(element.end.x, element.end.y);
        } else if (element.type === 'rectangle') {
          const width = element.end.x - element.start.x;
          const height = element.end.y - element.start.y;
          ctx.strokeRect(element.start.x, element.start.y, width, height);
        } else if (element.type === 'circle') {
          const radius = Math.sqrt(
            Math.pow(element.end.x - element.start.x, 2) +
            Math.pow(element.end.y - element.start.y, 2)
          );
          ctx.arc(element.start.x, element.start.y, radius, 0, 2 * Math.PI);
        }
      }

      if (element.type === 'text' && element.text && element.start) {
        ctx.font = `${element.width * 8}px Arial`;
        ctx.fillStyle = element.color;
        ctx.fillText(element.text, element.start.x, element.start.y);
      }

      ctx.stroke();
    });

    // Draw active element
    if (activeElement) {
      ctx.beginPath();
      ctx.strokeStyle = activeElement.color;
      ctx.lineWidth = activeElement.width;

      if (activeElement.type === 'pencil' && activeElement.points) {
        ctx.moveTo(activeElement.points[0].x, activeElement.points[0].y);
        activeElement.points.forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
      } else if (activeElement.start && activeElement.end) {
        if (activeElement.type === 'line') {
          ctx.moveTo(activeElement.start.x, activeElement.start.y);
          ctx.lineTo(activeElement.end.x, activeElement.end.y);
        } else if (activeElement.type === 'rectangle') {
          const width = activeElement.end.x - activeElement.start.x;
          const height = activeElement.end.y - activeElement.start.y;
          ctx.strokeRect(activeElement.start.x, activeElement.start.y, width, height);
        } else if (activeElement.type === 'circle') {
          const radius = Math.sqrt(
            Math.pow(activeElement.end.x - activeElement.start.x, 2) +
            Math.pow(activeElement.end.y - activeElement.start.y, 2)
          );
          ctx.arc(activeElement.start.x, activeElement.start.y, radius, 0, 2 * Math.PI);
        }
      }

      ctx.stroke();
    }
  }, [elements, activeElement]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    if (tool === 'text') {
      setTextInput({ x, y });
    } else {
      startDrawing(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    continueDrawing(x, y);
  };

  const handleMouseUp = () => {
    finishDrawing();
  };

  return (
    <Box
      width="100%"
      height="100%"
      bg="white"
      borderRadius="md"
      overflow="hidden"
      position="relative"
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: '100%',
          height: '100%',
          cursor: tool === 'text' ? 'text' : 'crosshair',
        }}
      />
      {textInput && (
        <WhiteboardTextInput
          position={textInput}
          onClose={() => setTextInput(null)}
          whiteboardId={whiteboardId}
        />
      )}
    </Box>
  );
};

export default WhiteboardCanvas;