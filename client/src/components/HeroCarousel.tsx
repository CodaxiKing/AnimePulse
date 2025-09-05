import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Heart, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getTrendingAnime } from "@/lib/api";
import { Link } from "wouter";
import TrailerModal from "@/components/TrailerModal";
import { getAnimeTrailer, hasTrailer } from "@/lib/trailerService";

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previousSlide, setPreviousSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState<{ animeTitle: string; trailerUrl: string } | null>(null);
  
  const { data: animes } = useQuery({
    queryKey: ["hero-trending"],
    queryFn: getTrendingAnime,
  });

  // Use high quality images from MyAnimeList data
  const heroAnimes = animes?.slice(0, 3).map(anime => ({
    ...anime,
    // Use the large image from MAL for better quality
    image: anime.main_picture?.large || anime.main_picture?.medium || anime.image,
  })) || [
    {
      id: "1",
      title: "Night Hunters",
      year: 2023,
      genres: ["Ação", "Sobrenatural", "Romance"],
      studio: "AmpleX",
      synopsis: "Em um mundo tomado pela escuridão sobrenatural, dois caçadores relutantes unem forças para combater forças das sombras e restaurar a paz.",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop",
    },
  ];

  const current = heroAnimes[currentSlide];
  const previous = heroAnimes[previousSlide];

  const nextSlide = () => {
    if (isTransitioning) return;
    setSlideDirection('right');
    setIsTransitioning(true);
    setPreviousSlide(currentSlide);
    setCurrentSlide((prev) => (prev + 1) % heroAnimes.length);
    setTimeout(() => {
      setIsTransitioning(false);
      setSlideDirection(null);
    }, 600);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setSlideDirection('left');
    setIsTransitioning(true);
    setPreviousSlide(currentSlide);
    setCurrentSlide((prev) => (prev - 1 + heroAnimes.length) % heroAnimes.length);
    setTimeout(() => {
      setIsTransitioning(false);
      setSlideDirection(null);
    }, 600);
  };

  const handleWatchTrailer = () => {
    const trailer = getAnimeTrailer(current.title);
    if (trailer) {
      setSelectedTrailer({
        animeTitle: current.title,
        trailerUrl: trailer.trailerUrl
      });
      setTrailerModalOpen(true);
      console.log(`🎬 Abrindo trailer para: ${current.title}`);
    } else {
      console.log(`❌ Nenhum trailer disponível para: ${current.title}`);
    }
  };

  const closeTrailerModal = () => {
    setTrailerModalOpen(false);
    setSelectedTrailer(null);
  };

  return (
    <section className="relative h-[80vh] overflow-hidden z-10">
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-20" />
      
      {/* Previous image layer - fades out */}
      {isTransitioning && (
        <img
          src={previous.image}
          alt={previous.title}
          className={`absolute inset-0 w-full h-full object-cover ${
            slideDirection === 'right' 
              ? 'carousel-crossfade-out-right' 
              : 'carousel-crossfade-out-left'
          }`}
        />
      )}
      
      {/* Current image layer - fades in */}
      <img
        src={current.image}
        alt={current.title}
        className={`absolute inset-0 w-full h-full object-cover ${
          isTransitioning 
            ? slideDirection === 'right' 
              ? 'carousel-crossfade-in-right' 
              : 'carousel-crossfade-in-left'
            : 'opacity-100 scale-100'
        }`}
      />
      
      <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center">
        <div className={`max-w-2xl transition-all duration-600 ease-in-out ${
          isTransitioning 
            ? slideDirection === 'right'
              ? 'translate-x-8 opacity-0'
              : '-translate-x-8 opacity-0'
            : 'translate-x-0 opacity-100'
        }`}>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 transition-all duration-700 ease-out" data-testid="text-hero-title">
            {current.title}
          </h2>
          <div className="flex items-center space-x-4 mb-4 text-sm text-muted-foreground">
            <span data-testid="text-hero-year">{current.year}</span>
            <span>•</span>
            <span data-testid="text-hero-genres">{current.genres?.join(" • ")}</span>
            {current.studio && (
              <>
                <span>•</span>
                <span data-testid="text-hero-studio">{current.studio}</span>
              </>
            )}
          </div>
          <p className="text-lg text-muted-foreground mb-6 max-w-lg" data-testid="text-hero-synopsis">
            {current.synopsis && current.synopsis.length > 120 ? `${current.synopsis.slice(0, 120)}...` : current.synopsis}
          </p>
          <div className="flex items-center space-x-4">
            {hasTrailer(current.title) ? (
              <Button
                onClick={handleWatchTrailer}
                className="bg-gradient-to-r from-[#8A2BE2] via-[#B026FF] to-[#FF4DD8] text-white rounded-xl px-8 py-3 font-semibold anime-glow hover:opacity-95"
                data-testid="button-watch-trailer"
              >
                <Play className="w-5 h-5 mr-2" />
                Ver Trailer
              </Button>
            ) : (
              <Link href={`/animes/${current.id}`}>
                <Button
                  className="bg-gradient-to-r from-[#8A2BE2] via-[#B026FF] to-[#FF4DD8] text-white rounded-xl px-8 py-3 font-semibold anime-glow hover:opacity-95"
                  data-testid="button-watch-now"
                >
                  Ver Detalhes
                </Button>
              </Link>
            )}
            <Button
              variant="secondary"
              className="border-border rounded-xl px-6 py-3 font-semibold hover:bg-muted"
              data-testid="button-add-to-list"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar à fila
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="p-3 rounded-xl border-border hover:bg-muted"
              data-testid="button-favorite"
            >
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      
      <button
        onClick={prevSlide}
        disabled={isTransitioning}
        className={`absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-background/20 backdrop-blur-sm border border-border hover:bg-background/40 transition-all duration-200 hover:scale-110 active:scale-95 ${
          isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
        } ${slideDirection === 'left' && isTransitioning ? 'animate-bounce' : ''}`}
        data-testid="button-carousel-prev"
      >
        <ChevronLeft className={`w-6 h-6 transition-transform duration-200 ${
          isTransitioning && slideDirection === 'left' 
            ? '-translate-x-2 animate-pulse' 
            : isTransitioning 
              ? '-translate-x-1' 
              : ''
        }`} />
      </button>
      
      <button
        onClick={nextSlide}
        disabled={isTransitioning}
        className={`absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-background/20 backdrop-blur-sm border border-border hover:bg-background/40 transition-all duration-200 hover:scale-110 active:scale-95 ${
          isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
        } ${slideDirection === 'right' && isTransitioning ? 'animate-bounce' : ''}`}
        data-testid="button-carousel-next"
      >
        <ChevronRight className={`w-6 h-6 transition-transform duration-200 ${
          isTransitioning && slideDirection === 'right'
            ? 'translate-x-2 animate-pulse'
            : isTransitioning
              ? 'translate-x-1'
              : ''
        }`} />
      </button>

      {/* Modal de Trailer */}
      {selectedTrailer && (
        <TrailerModal
          isOpen={trailerModalOpen}
          onClose={closeTrailerModal}
          animeTitle={selectedTrailer.animeTitle}
          trailerUrl={selectedTrailer.trailerUrl}
        />
      )}
    </section>
  );
}
