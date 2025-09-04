import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getTrendingAnime } from "@/lib/api";
import { Link } from "wouter";

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { data: animes } = useQuery({
    queryKey: ["hero-trending"],
    queryFn: getTrendingAnime,
  });

  const heroAnimes = animes?.slice(0, 3) || [
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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroAnimes.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroAnimes.length) % heroAnimes.length);
  };

  return (
    <section className="relative h-[80vh] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
      
      <img
        src={current.image}
        alt={current.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center">
        <div className="max-w-2xl">
          <h2 className="text-4xl md:text-6xl font-bold mb-4" data-testid="text-hero-title">
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
            {current.synopsis?.length > 120 ? `${current.synopsis.slice(0, 120)}...` : current.synopsis}
          </p>
          <div className="flex items-center space-x-4">
            <Link href={`/animes/${current.id}`}>
              <Button
                className="bg-gradient-to-r from-[#8A2BE2] via-[#B026FF] to-[#FF4DD8] text-white rounded-xl px-8 py-3 font-semibold anime-glow hover:opacity-95"
                data-testid="button-watch-now"
              >
                Assistir agora
              </Button>
            </Link>
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
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-background/20 backdrop-blur-sm border border-border hover:bg-background/40 transition-colors"
        data-testid="button-carousel-prev"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-background/20 backdrop-blur-sm border border-border hover:bg-background/40 transition-colors"
        data-testid="button-carousel-next"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </section>
  );
}
