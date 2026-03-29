import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, GripHorizontal } from 'lucide-react';

interface DraggableWebcamProps {
  webcamRef: React.RefObject<HTMLVideoElement>;
  floatingConfidence: number;
  isEnabled: boolean;
}

export function DraggableWebcam({ 
  webcamRef, 
  floatingConfidence, 
  isEnabled 
}: DraggableWebcamProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x: -32, y: window.innerHeight * 0.25 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // Don't drag if clicking close button
    
    setIsDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - position.x,
        y: e.clientY - rect.top - position.y
      });
    }
  };

  // Handle mouse move for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - 288; // 288 = w-72
      const maxY = window.innerHeight - 180; // approximate height
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isEnabled || !isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '288px' // w-72
        }}
        className="absolute pointer-events-auto"
      >
        <div 
          className="bg-[#1c1c21] rounded-[2rem] p-3 border border-emerald-500/20 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          {/* Header with drag handle and close */}
          <div className="flex items-center justify-between mb-2 px-2 py-1">
            <div className="flex items-center gap-1.5 text-emerald-400/60">
              <GripHorizontal className="w-3.5 h-3.5" />
              <span className="text-[8px] font-bold uppercase tracking-wider">Drag to move</span>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
              title="Close webcam feed"
            >
              <X className="w-4 h-4 text-zinc-400 hover:text-white" />
            </button>
          </div>

          {/* Video feed */}
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-emerald-500/10">
            <video
              ref={webcamRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
            
            {/* Recording indicator */}
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse box-content border border-emerald-500/40" />
              <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">Recording</span>
            </div>

            {/* Accuracy display (informational only) */}
            {floatingConfidence > 0 && (
              <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 ${floatingConfidence >= 70 ? 'bg-emerald-500/80' : 'bg-red-500/80'} backdrop-blur-sm px-2 py-1 rounded-full`}>
                <span className="text-[8px] font-bold text-white uppercase">Accuracy: {Math.round(floatingConfidence)}%</span>
              </div>
            )}
          </div>

          {/* Info footer */}
          <p className="text-center text-[9px] text-zinc-400 uppercase tracking-widest mt-2">
            Live feed only • Drag to reposition • Click X to close
          </p>
        </div>
      </motion.div>
    </div>
  );
}
