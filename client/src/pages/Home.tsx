import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import HeroCarousel from "@/components/HeroCarousel";
import AnimeCard from "@/components/AnimeCard";
import MangaCard from "@/components/MangaCard";
import NewsCard from "@/components/NewsCard";
import SocialPost from "@/components/SocialPost";
import ActiveUsers from "@/components/ActiveUsers";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import {
  getContinueWatching,
  getTrendingAnime,
  getLatestAnime,
  getTopAnime,
  getLatestManga,
  getLatestNews,
  getSocialPosts,
  getActiveUsers,
} from "@/lib/api";

function AnimeSection({ title, queryKey, showProgress = false, showRank = false, isNew = false }: {
  title: string;
  queryKey: string;
  showProgress?: boolean;
  showRank?: boolean;
  isNew?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: animes, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: () => {
      switch (queryKey) {
        case 'continue': return getContinueWatching();
        case 'trending': return getTrendingAnime();
        case 'latest': return getLatestAnime();
        case 'top': return getTopAnime();
        default: return getTrendingAnime();
      }
    },
  });

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Mostrar setas apenas para "Top 10 mais assistidos"
  const showNavigation = queryKey === 'top';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold" data-testid={`text-section-${queryKey}`}>{title}</h3>
        {showNavigation && !isLoading && animes && animes.length > 4 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollLeft}
              className="h-8 w-8 rounded-full bg-background/80 hover:bg-background border"
              data-testid="button-scroll-left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollRight}
              className="h-8 w-8 rounded-full bg-background/80 hover:bg-background border"
              data-testid="button-scroll-right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="relative">
        <div 
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto hide-scrollbar pb-2 gradient-mask-r"
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-none w-48 aspect-[3/4.5]">
                <Skeleton className="w-full h-[70%] rounded-2xl mb-3" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))
          ) : (
            animes?.map((anime, index) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                showProgress={showProgress}
                rank={showRank ? index + 1 : undefined}
                isNew={isNew}
                variant="horizontal"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: mangas, isLoading: loadingMangas } = useQuery({
    queryKey: ["home-mangas"],
    queryFn: getLatestManga,
  });

  const { data: news, isLoading: loadingNews } = useQuery({
    queryKey: ["latest-news"],
    queryFn: getLatestNews,
  });

  const { data: posts, isLoading: loadingPosts } = useQuery({
    queryKey: ["social-posts"],
    queryFn: getSocialPosts,
  });

  const { data: activeUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["active-users"],
    queryFn: getActiveUsers,
  });

  return (
    <>
      <HeroCarousel />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-12">
        {/* Assistir Animes Section */}
        <section className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-semibold" data-testid="text-watch-animes-title">
            Assistir Animes
          </h2>
          
          <AnimeSection
            title="Continue assistindo"
            queryKey="continue"
            showProgress={true}
          />
          
          <AnimeSection
            title="Recomendados para você"
            queryKey="trending"
          />
          
          <AnimeSection
            title="Lançamentos"
            queryKey="latest"
            isNew={true}
          />
          
          <AnimeSection
            title="Top 10 mais assistidos"
            queryKey="top"
            showRank={true}
          />
        </section>

        {/* Ler Mangás Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-semibold" data-testid="text-manga-section-title">
              Ler Mangás
            </h2>
            <Link
              href="/mangas"
              className="text-primary hover:text-primary/80 transition-colors font-medium"
              data-testid="link-see-more-mangas"
            >
              Ver mais →
            </Link>
          </div>
          
          <div className="relative">
            <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-2 gradient-mask-r">
              {loadingMangas ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-none w-48">
                    <Skeleton className="w-full h-72 rounded-2xl mb-4" />
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))
              ) : (
                mangas?.slice(0, 8).map((manga) => (
                  <Link key={manga.id} href={`/mangas/${manga.id}`}>
                    <div className="flex-none w-48 group cursor-pointer" data-testid={`card-manga-${manga.id}`}>
                      <div className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative">
                        <img
                          src={manga.image || "https://via.placeholder.com/400x600"}
                          alt={manga.title}
                          className="w-full h-72 object-cover"
                          data-testid={`img-manga-${manga.id}`}
                        />
                        <div className="p-4">
                          <h4 className="font-semibold text-sm mb-1" data-testid={`text-manga-title-${manga.id}`}>
                            {manga.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mb-1" data-testid={`text-manga-author-${manga.id}`}>
                            {manga.author}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid={`text-manga-chapters-${manga.id}`}>
                            {manga.latestChapter ? `Cap. ${manga.latestChapter}` : "Em andamento"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Notícias Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-semibold" data-testid="text-news-section-title">
              Notícias
            </h2>
            <Link
              href="/noticias"
              className="text-muted-foreground hover:text-primary transition-colors text-sm"
              data-testid="link-see-all-news"
            >
              Ver todas as notícias
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingNews ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/2] rounded-2xl" />
              ))
            ) : (
              news?.slice(0, 4).map((newsItem) => (
                <NewsCard key={newsItem.id} news={newsItem} />
              ))
            )}
          </div>
        </section>

        {/* Feed Social Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl md:text-3xl font-semibold mb-6" data-testid="text-social-feed-title">
              Feed Social
            </h2>
            <div className="space-y-6">
              {loadingPosts ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl p-6">
                    <div className="flex space-x-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                posts?.map((post) => (
                  <SocialPost key={post.id} post={post} />
                ))
              )}
            </div>
          </div>
          
          {loadingUsers ? (
            <div className="space-y-6">
              <Skeleton className="h-6 w-32" />
              <div className="bg-card rounded-2xl p-6">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            activeUsers && <ActiveUsers users={activeUsers} />
          )}
        </section>

        {/* Footer */}
        <footer className="bg-card border-t border-border pt-8 mt-16 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link href="/faq" className="hover:text-primary transition-colors" data-testid="link-faq">
                FAQ
              </Link>
              <Link href="/suporte" className="hover:text-primary transition-colors" data-testid="link-support">
                Suporte
              </Link>
              <Link href="/contrato" className="hover:text-primary transition-colors" data-testid="link-contract">
                Contrato
              </Link>
              <Link href="/termos" className="hover:text-primary transition-colors" data-testid="link-terms">
                Termos
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-social-twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-social-instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.221.083.343-.09.378-.293 1.175-.334 1.339-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.747-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-social-discord"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
