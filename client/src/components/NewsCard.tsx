import { Link } from "wouter";
import type { News } from "@shared/schema";

interface NewsCardProps {
  news: News;
}

export default function NewsCard({ news }: NewsCardProps) {
  return (
    <Link href={`/noticias/${news.id}`}>
      <div
        className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
        data-testid={`card-news-${news.id}`}
      >
        <img
          src={news.image || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop"}
          alt={news.title}
          className="w-full h-32 object-cover"
          data-testid={`img-news-${news.id}`}
        />
        <div className="p-4">
          <h3 className="font-semibold mb-2" data-testid={`text-news-title-${news.id}`}>
            {news.title}
          </h3>
          <p className="text-sm text-muted-foreground" data-testid={`text-news-summary-${news.id}`}>
            {news.summary}
          </p>
        </div>
      </div>
    </Link>
  );
}
