import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Trophy, Sparkles, Gift } from 'lucide-react';
import type { MilestoneData } from '@/lib/milestones';
import ConfettiCelebration from './ConfettiCelebration';

interface MilestoneModalProps {
  milestones: MilestoneData[];
  isOpen: boolean;
  onClose: () => void;
}

export default function MilestoneModal({ milestones, isOpen, onClose }: MilestoneModalProps) {
  const [currentMilestoneIndex, setCurrentMilestoneIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const currentMilestone = milestones[currentMilestoneIndex];
  const hasMultipleMilestones = milestones.length > 1;

  useEffect(() => {
    if (isOpen && milestones.length > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowContent(true), 500);
    } else {
      setShowContent(false);
      setShowConfetti(false);
    }
  }, [isOpen, milestones]);

  const handleNext = () => {
    if (currentMilestoneIndex < milestones.length - 1) {
      setCurrentMilestoneIndex(prev => prev + 1);
      setShowConfetti(true);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setShowContent(false);
    setShowConfetti(false);
    setTimeout(() => {
      setCurrentMilestoneIndex(0);
      onClose();
    }, 300);
  };

  const getMilestoneTypeLabel = (type: string) => {
    switch (type) {
      case 'episodes': return 'Episódios';
      case 'animes': return 'Animes';
      case 'genres': return 'Gêneros';
      case 'consecutive_days': return 'Dias Consecutivos';
      default: return 'Marco';
    }
  };

  if (!currentMilestone) return null;

  return (
    <>
      <ConfettiCelebration
        isActive={showConfetti}
        theme={currentMilestone.theme}
        intensity={currentMilestone.intensity}
        duration={2500}
        onComplete={() => setShowConfetti(false)}
      />
      
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md text-center bg-gradient-to-b from-purple-900/20 to-pink-900/20 border-purple-500/30 overflow-hidden">
          <DialogHeader className="relative">
            {/* Efeito de brilho de fundo */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/10 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatDelay: 3,
                ease: 'easeInOut' 
              }}
            />

            <AnimatePresence mode="wait">
              {showContent && (
                <motion.div
                  key={currentMilestone.id}
                  initial={{ scale: 0.5, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.5, opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: 'backOut' }}
                  className="relative z-10"
                >
                  {/* Ícone principal animado */}
                  <motion.div
                    className="flex justify-center mb-6 relative"
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.2, 
                      duration: 0.8, 
                      ease: 'backOut',
                      type: 'spring'
                    }}
                  >
                    <div className="relative">
                      <motion.div
                        className="text-8xl"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1
                        }}
                      >
                        {currentMilestone.icon}
                      </motion.div>
                      
                      {/* Estrelas flutuantes */}
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute text-yellow-400"
                          style={{
                            top: `${20 + Math.sin(i) * 40}%`,
                            left: `${20 + Math.cos(i) * 40}%`,
                          }}
                          animate={{
                            y: [0, -10, 0],
                            opacity: [0.6, 1, 0.6],
                            scale: [0.8, 1.2, 0.8]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: 'easeInOut'
                          }}
                        >
                          <Sparkles size={16} />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                    🎉 MARCO ALCANÇADO! 🎉
                  </DialogTitle>

                  {/* Nome do marco */}
                  <motion.h3
                    className="text-2xl font-bold text-white mb-3"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    {currentMilestone.name}
                  </motion.h3>

                  {/* Descrição */}
                  <motion.p
                    className="text-lg text-gray-300 mb-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    {currentMilestone.description}
                  </motion.p>

                  {/* Badge do tipo */}
                  <motion.div
                    className="flex justify-center mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="bg-purple-600/30 text-purple-200 border-purple-400/50"
                    >
                      {getMilestoneTypeLabel(currentMilestone.type)}
                    </Badge>
                  </motion.div>

                  {/* Recompensas */}
                  {currentMilestone.reward && (
                    <motion.div
                      className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-400/30 mb-6"
                      initial={{ scale: 0, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.5 }}
                    >
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <Gift className="w-6 h-6 text-yellow-400" />
                        <span className="text-yellow-200 font-bold">Recompensas</span>
                      </div>
                      
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-400" />
                          <span className="text-2xl font-bold text-yellow-300">
                            +{currentMilestone.reward.points}
                          </span>
                          <span className="text-yellow-200 text-sm">pontos</span>
                        </div>
                        
                        {currentMilestone.reward.badge && (
                          <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-orange-400" />
                            <span className="text-orange-200 text-sm">Nova Conquista!</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Contador de marcos */}
                  {hasMultipleMilestones && (
                    <motion.div
                      className="text-center mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <span className="text-sm text-gray-400">
                        Marco {currentMilestoneIndex + 1} de {milestones.length}
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </DialogHeader>

          {/* Botões */}
          <motion.div
            className="flex justify-center gap-3 mt-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            {hasMultipleMilestones && currentMilestoneIndex < milestones.length - 1 ? (
              <Button 
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 text-lg transition-all transform hover:scale-105"
              >
                ✨ Próximo Marco ✨
              </Button>
            ) : (
              <Button 
                onClick={handleClose}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 text-lg transition-all transform hover:scale-105"
              >
                ✨ Continuar Explorando ✨
              </Button>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}