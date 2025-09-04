import { Link } from "wouter";
import type { AnimeWithProgress } from "@shared/schema";

interface AnimeCardProps {
  anime: AnimeWithProgress;
  showProgress?: boolean;
  rank?: number;
  isNew?: boolean;
  variant?: 'grid' | 'horizontal';
}

export default function AnimeCard({ anime, showProgress = false, rank, isNew = false, variant = 'grid' }: AnimeCardProps) {
  return (
    <Link href={`/animes/${anime.id}`}>
      <div className={`group cursor-pointer ${
        variant === 'horizontal' ? 'flex-none w-48 aspect-[3/4.5]' : 'w-full aspect-[3/4.5]'
      }`} data-testid={`card-anime-${anime.id}`}>
        <div className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative h-full flex flex-col">
          {rank && (
            <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
              {rank}
            </div>
          )}
          {isNew && (
            <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] text-white text-xs px-2 py-1 rounded-full font-medium">
              NOVO
            </div>
          )}
          
          <img
            src={anime.image || "https://via.placeholder.com/400x600?text=" + encodeURIComponent(anime.title)}
            alt={anime.title}
            className="w-full h-[70%] object-cover"
            data-testid={`img-anime-${anime.id}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://via.placeholder.com/400x600/8A2BE2/FFFFFF?text=${encodeURIComponent(anime.title.slice(0, 20))}`;
            }}
          />
          
          <div className="p-3 h-[30%] flex flex-col justify-between">
            <h4 className="font-semibold text-sm line-clamp-2 leading-tight" data-testid={`text-anime-title-${anime.id}`} title={anime.title}>
              {anime.title}
            </h4>
            
            {showProgress && anime.progress ? (
              <div className="mt-auto">
                <p className="text-xs text-muted-foreground mb-2" data-testid={`text-progress-${anime.id}`}>
                  Episódio {anime.progress.episodeNumber} de {anime.totalEpisodes}
                </p>
                <div className="w-full bg-muted rounded-full h-1">
                  <div
                    className="bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] h-1 rounded-full transition-all duration-300"
                    style={{ width: `${anime.progress.progressPercent}%` }}
                    data-testid={`progress-bar-${anime.id}`}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-auto" data-testid={`text-anime-info-${anime.id}`}>
                {anime.genres?.slice(0, 2).join(" • ")} • {anime.totalEpisodes} eps
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
