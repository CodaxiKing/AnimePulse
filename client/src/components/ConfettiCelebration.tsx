import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: string;
  x: number;
  y: number;
  rotation: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'heart';
  size: number;
  velocity: {
    x: number;
    y: number;
  };
}

interface ConfettiCelebrationProps {
  isActive: boolean;
  theme: 'anime' | 'milestone' | 'completion' | 'achievement';
  intensity?: 'low' | 'medium' | 'high';
  duration?: number;
  onComplete?: () => void;
}

const THEME_COLORS = {
  anime: ['#8A2BE2', '#B026FF', '#FF4DD8', '#FF6B9D', '#C77DFF'],
  milestone: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#9370DB'],
  completion: ['#00FF7F', '#32CD32', '#7FFF00', '#ADFF2F', '#98FB98'],
  achievement: ['#FF4500', '#DC143C', '#FFD700', '#FF6347', '#FFA500']
};

const SHAPES_CONFIG = {
  circle: { borderRadius: '50%' },
  square: { borderRadius: '2px' },
  triangle: { 
    width: 0, 
    height: 0, 
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderBottom: '10px solid'
  },
  star: { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
  heart: { clipPath: 'path("M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z")' }
};

export default function ConfettiCelebration({ 
  isActive, 
  theme, 
  intensity = 'medium', 
  duration = 3000,
  onComplete 
}: ConfettiCelebrationProps) {
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const getParticleCount = () => {
    switch (intensity) {
      case 'low': return 30;
      case 'medium': return 60;
      case 'high': return 100;
      default: return 60;
    }
  };

  const createConfettiPiece = (index: number): ConfettiPiece => {
    const colors = THEME_COLORS[theme];
    const shapes: Array<keyof typeof SHAPES_CONFIG> = ['circle', 'square', 'triangle', 'star', 'heart'];
    
    return {
      id: `confetti-${index}-${Date.now()}`,
      x: Math.random() * window.innerWidth,
      y: -20,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size: Math.random() * 8 + 4,
      velocity: {
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 3 + 2
      }
    };
  };

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      const pieces = Array.from({ length: getParticleCount() }, (_, i) => createConfettiPiece(i));
      setConfettiPieces(pieces);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setConfettiPieces([]);
          onComplete?.();
        }, 500);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, theme, intensity, duration, onComplete]);

  const getShapeStyle = (piece: ConfettiPiece) => {
    const baseStyle = {
      width: `${piece.size}px`,
      height: `${piece.size}px`,
      backgroundColor: piece.shape === 'triangle' ? 'transparent' : piece.color,
    };

    if (piece.shape === 'triangle') {
      return {
        ...baseStyle,
        ...SHAPES_CONFIG.triangle,
        borderBottomColor: piece.color,
      };
    }

    return {
      ...baseStyle,
      ...SHAPES_CONFIG[piece.shape],
    };
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {confettiPieces.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute"
              initial={{
                x: piece.x,
                y: piece.y,
                rotate: piece.rotation,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: piece.x + piece.velocity.x * 50,
                y: window.innerHeight + 100,
                rotate: piece.rotation + 720,
                scale: [0, 1, 1, 0.8],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: duration / 1000,
                ease: [0.45, 0.05, 0.55, 0.95],
                times: [0, 0.1, 0.8, 1],
              }}
              style={getShapeStyle(piece)}
              data-testid={`confetti-${piece.shape}-${piece.id}`}
            />
          ))}
          
          {/* Efeito de brilho central */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.5, 0], 
              opacity: [0, 0.8, 0],
            }}
            transition={{ 
              duration: 1.5,
              ease: "easeOut",
              times: [0, 0.3, 1]
            }}
          >
            <div 
              className="w-32 h-32 rounded-full blur-md"
              style={{
                background: `radial-gradient(circle, ${THEME_COLORS[theme][0]}40, transparent 70%)`
              }}
            />
          </motion.div>

          {/* Ondas de energia */}
          {[0, 1, 2].map((index) => (
            <motion.div
              key={`wave-${index}`}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 rounded-full"
              style={{
                borderColor: THEME_COLORS[theme][index % THEME_COLORS[theme].length] + '60',
              }}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ 
                scale: [0, 4, 6], 
                opacity: [0.8, 0.4, 0],
              }}
              transition={{ 
                duration: 2,
                ease: "easeOut",
                delay: index * 0.2,
                times: [0, 0.6, 1]
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}