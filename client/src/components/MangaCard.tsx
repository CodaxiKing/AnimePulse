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
  
  // URLs de fallback mais confiáveis usando placeholder services
  const fallbackImages = [
    `https://picsum.photos/400/300?random=${category.id}`,
    `https://via.placeholder.com/400x300/8A2BE2/FFFFFF?text=${encodeURIComponent(category.name.slice(0, 10))}`,
    `https://dummyimage.com/400x300/8A2BE2/FFFFFF&text=${encodeURIComponent(category.name.slice(0, 10))}`
  ];
  
  const [fallbackIndex, setFallbackIndex] = useState(0);
  
  const handleImageError = () => {
    if (fallbackIndex < fallbackImages.length - 1) {
      setFallbackIndex(prev => prev + 1);
    } else {
      setImageError(true);
    }
  };
  
  const getCurrentImageSrc = () => {
    if (imageError) {
      return fallbackImages[fallbackImages.length - 1]; // Último fallback
    }
    if (fallbackIndex > 0) {
      return fallbackImages[fallbackIndex];
    }
    return category.image || fallbackImages[0];
  };

  return (
    <div
      className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
      data-testid={`card-manga-category-${category.id}`}
    >
      <img
        src={getCurrentImageSrc()}
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
