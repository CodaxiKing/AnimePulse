interface MangaCategoryCardProps {
  category: {
    id: string;
    name: string;
    image: string;
  };
}

export default function MangaCard({ category }: MangaCategoryCardProps) {
  return (
    <div
      className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
      data-testid={`card-manga-category-${category.id}`}
    >
      <img
        src={category.image}
        alt={category.name}
        className="w-full h-24 object-cover"
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
