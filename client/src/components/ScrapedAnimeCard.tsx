import { useState } from "react";
import { Play, ExternalLink, Eye, Calendar } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { ScrapedAnime } from "../lib/scrapingApi";

interface ScrapedAnimeCardProps {
  anime: ScrapedAnime;
  onClick?: (anime: ScrapedAnime) => void;
  variant?: 'grid' | 'horizontal';
}

export default function ScrapedAnimeCard({ anime, onClick, variant = 'grid' }: ScrapedAnimeCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    onClick?.(anime);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleExternalView = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(anime.url, '_blank');
  };

  const placeholderImage = `https://via.placeholder.com/400x600/8A2BE2/FFFFFF?text=${encodeURIComponent(anime.title.slice(0, 20))}`;

  return (
    <div 
      className={`group cursor-pointer ${
        variant === 'horizontal' ? 'flex-none w-48 aspect-[3/4.5]' : 'w-full aspect-[3/4.5]'
      }`}
      onClick={handleClick}
      data-testid={`card-scraped-anime-${anime.id}`}
    >
      <div className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative h-full flex flex-col">
        {/* Site Badge */}
        <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
          {anime.siteId === 'animesdigital' && 'AD'}
          {anime.siteId === 'animesonlinecc' && 'AOC'}
          {anime.siteId === 'goyabu' && 'GOY'}
        </div>
        
        {/* Episode count */}
        {anime.totalEpisodes && (
          <div className="absolute top-2 right-2 z-10 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 shadow-lg">
            <Eye className="w-3 h-3" />
            {anime.totalEpisodes} eps
          </div>
        )}
        
        <img
          src={imageError ? placeholderImage : (anime.thumbnail || placeholderImage)}
          alt={anime.title}
          className="w-full h-[70%] object-cover"
          data-testid={`img-scraped-anime-${anime.id}`}
          onError={handleImageError}
        />
        
        <div className="p-3 h-[30%] flex flex-col justify-between">
          <h4 className="font-semibold text-sm line-clamp-2 leading-tight" data-testid={`text-scraped-anime-title-${anime.id}`} title={anime.title}>
            {anime.title}
          </h4>
          
          <div className="mt-auto space-y-2">
            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {anime.genres.slice(0, 2).map((genre, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                    {genre}
                  </Badge>
                ))}
                {anime.genres.length > 2 && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    +{anime.genres.length - 2}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Info row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {anime.year || 'N/A'}
              </div>
              <Badge variant="outline" className="text-xs">
                {anime.status === 'available' ? 'Disponível' : anime.status || 'N/A'}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#8A2BE2] via-[#B026FF] to-[#FF4DD8] text-white rounded-full p-4"
              onClick={handleClick}
            >
              <Play className="w-6 h-6" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full p-4 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              onClick={handleExternalView}
            >
              <ExternalLink className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}