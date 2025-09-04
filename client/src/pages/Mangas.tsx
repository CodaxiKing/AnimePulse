import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { getLatestManga } from "@/lib/api";

export default function Mangas() {
  const { data: mangas, isLoading } = useQuery({
    queryKey: ["latest-manga"],
    queryFn: getLatestManga,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-mangas-title">
          Todos os Mangás
        </h1>
        <p className="text-muted-foreground" data-testid="text-mangas-subtitle">
          Explore nossa biblioteca de mangás
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] rounded-2xl" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {mangas?.map((manga) => (
            <Link key={manga.id} href={`/mangas/${manga.id}`}>
              <div className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group" data-testid={`card-manga-${manga.id}`}>
                <img
                  src={manga.image || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop"}
                  alt={manga.title}
                  className="w-full aspect-[3/4] object-cover"
                  data-testid={`img-manga-${manga.id}`}
                />
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-1" data-testid={`text-manga-title-${manga.id}`}>
                    {manga.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-1" data-testid={`text-manga-author-${manga.id}`}>
                    {manga.author}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`text-manga-chapter-${manga.id}`}>
                    Cap. {manga.latestChapter}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
