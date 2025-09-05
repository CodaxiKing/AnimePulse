import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';

export default function UserPointsDisplay() {
  const { user, stats, isAuthenticated } = useAuth();
  const [previousPoints, setPreviousPoints] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);

  const currentPoints = stats?.totalPoints || 0;

  // Detectar mudanças nos pontos para animação
  useEffect(() => {
    if (currentPoints > previousPoints && previousPoints > 0) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
    setPreviousPoints(currentPoints);
  }, [currentPoints, previousPoints]);

  // Listener para eventos de atualização de pontos
  useEffect(() => {
    const handlePointsUpdate = () => {
      // Forçar atualização das estatísticas
      queryClient.invalidateQueries({ queryKey: ['/api/auth/stats'] });
      console.log('🔄 Pontos atualizados via evento');
    };

    const handleAnimeCompleted = (event: CustomEvent) => {
      // Quando um anime é completado, forçar atualização
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/stats'] });
        console.log('🏆 Atualização de pontos após anime completado');
      }, 1000);
    };

    window.addEventListener('episodeWatched', handlePointsUpdate);
    window.addEventListener('animeCompleted', handleAnimeCompleted as EventListener);

    return () => {
      window.removeEventListener('episodeWatched', handlePointsUpdate);
      window.removeEventListener('animeCompleted', handleAnimeCompleted as EventListener);
    };
  }, []);

  // Não exibir se o usuário não estiver logado
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
        <Star className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-500 font-medium">
          0 pts
        </span>
      </div>
    );
  }

  const pointsDisplay = currentPoints.toLocaleString('pt-BR');
  const level = stats?.level || 1;

  return (
    <div className="relative">
      {/* Container principal */}
      <motion.div 
        className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300"
        whileHover={{ scale: 1.02 }}
        data-testid="user-points-display"
      >
        {/* Ícone animado */}
        <motion.div
          animate={showAnimation ? { 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          } : {}}
          transition={{ duration: 0.6 }}
        >
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        </motion.div>

        {/* Pontos */}
        <div className="flex flex-col items-end">
          <motion.span 
            className="text-sm font-bold text-yellow-300"
            animate={showAnimation ? {
              scale: [1, 1.1, 1],
              color: ['#fde047', '#facc15', '#fde047']
            } : {}}
            transition={{ duration: 0.6 }}
            data-testid="points-value"
          >
            {pointsDisplay}
          </motion.span>
          
          {/* Nível */}
          <div className="flex items-center gap-1">
            <Award className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-purple-300 font-medium">
              Nv.{level}
            </span>
          </div>
        </div>

        {/* Tooltip de informações - apenas desktop */}
        <div className="hidden lg:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          <div className="space-y-1">
            <div>👤 {user.displayName}</div>
            <div>⭐ {pointsDisplay} pontos</div>
            <div>🏆 Nível {level}</div>
            {stats?.animesCompleted && (
              <div>📺 {stats.animesCompleted} animes completos</div>
            )}
            {stats?.episodesWatched && (
              <div>🎬 {stats.episodesWatched} episódios assistidos</div>
            )}
          </div>
          {/* Seta do tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </motion.div>

      {/* Animação de pontos ganhos */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 pointer-events-none"
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.8 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold shadow-lg">
              <TrendingUp className="w-3 h-3" />
              +{(currentPoints - previousPoints).toLocaleString('pt-BR')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partículas de celebração para pontos */}
      <AnimatePresence>
        {showAnimation && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-400 rounded-full pointer-events-none"
                style={{
                  top: '50%',
                  left: '50%',
                }}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: [0, (Math.random() - 0.5) * 40],
                  y: [0, (Math.random() - 0.5) * 40],
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.1,
                  ease: 'easeOut'
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}