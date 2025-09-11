import { useState } from "react";

interface MangaCategoryCardProps {
  category: {
    id: string;
    name: string;
    image: string;
  };
}

export default function MangaCard({ category }: MangaCategoryCardProps) {
  const [imageError, setImageError] = useState(false);
  const fallbackImage = `https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&auto=format&q=80`;
  
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
      data-testid={`card-manga-category-${category.id}`}
    >
      <img
        src={imageError ? fallbackImage : (category.image || fallbackImage)}
        alt={category.name}
        className="w-full h-24 object-cover"
        onError={handleImageError}
        data-testid={`img-manga-category-${category.id}`}
      />
      <div className="p-3">
        <h4 className="font-semibold text-sm text-center" data-testid={`text-manga-category-${category.id}`}>
          {category.name}
        </h4>
      </div>
    </div>
  );
}
