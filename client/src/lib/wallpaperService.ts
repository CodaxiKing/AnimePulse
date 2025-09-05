// Anime Wallpaper Service - High Quality Images for Carousel
export interface AnimeWallpaper {
  url: string;
  title: string;
  quality: 'HD' | '4K';
  aspect_ratio: string;
}

// High-quality curated anime wallpapers in 16:9 ratio
const CURATED_WALLPAPERS: { [key: string]: AnimeWallpaper[] } = {
  "Kimetsu no Yaiba": [
    {
      url: "https://wallpapercave.com/wp/wp4056436.jpg",
      title: "Demon Slayer Mountain Scene",
      quality: "4K",
      aspect_ratio: "16:9"
    },
    {
      url: "https://wallpapercave.com/wp/wp8547363.jpg",
      title: "Demon Slayer Sunset",
      quality: "4K", 
      aspect_ratio: "16:9"
    }
  ],
  "One Piece": [
    {
      url: "https://wallpapercave.com/wp/wp5083103.jpg",
      title: "One Piece Ocean Adventure",
      quality: "4K",
      aspect_ratio: "16:9"
    },
    {
      url: "https://wallpapercave.com/wp/wp2095379.jpg",
      title: "Going Merry Sunset",
      quality: "HD",
      aspect_ratio: "16:9"
    }
  ],
  "Shingeki no Kyojin": [
    {
      url: "https://wallpapercave.com/wp/wp2634907.jpg",
      title: "Attack on Titan Wall Maria",
      quality: "4K",
      aspect_ratio: "16:9"
    }
  ],
  "Jujutsu Kaisen": [
    {
      url: "https://wallpapercave.com/wp/wp8115923.jpg",
      title: "JJK Tokyo Jujutsu High",
      quality: "4K",
      aspect_ratio: "16:9"
    }
  ]
};

// Generic high-quality anime wallpapers for fallback
const GENERIC_WALLPAPERS: AnimeWallpaper[] = [
  {
    url: "https://wallpapercave.com/wp/wp2917154.jpg",
    title: "Anime Landscape Sunset",
    quality: "4K",
    aspect_ratio: "16:9"
  },
  {
    url: "https://wallpapercave.com/wp/wp4090550.jpg", 
    title: "Anime Cityscape Night",
    quality: "4K",
    aspect_ratio: "16:9"
  },
  {
    url: "https://wallpapercave.com/wp/wp6931698.jpg",
    title: "Anime Mountain Vista",
    quality: "4K", 
    aspect_ratio: "16:9"
  },
  {
    url: "https://wallpapercave.com/wp/wp8115923.jpg",
    title: "Anime School Campus",
    quality: "4K",
    aspect_ratio: "16:9"
  },
  {
    url: "https://wallpapercave.com/wp/wp2347410.jpg",
    title: "Anime Forest Scene",
    quality: "4K",
    aspect_ratio: "16:9"
  }
];

/**
 * Get high-quality wallpaper for anime title
 */
export function getAnimeWallpaper(animeTitle: string): string {
  console.log(`🖼️ Getting wallpaper for: "${animeTitle}"`);
  
  // Check for exact matches first
  if (CURATED_WALLPAPERS[animeTitle]) {
    const wallpapers = CURATED_WALLPAPERS[animeTitle];
    const selectedWallpaper = wallpapers[0]; // Use first wallpaper
    console.log(`✅ Found curated wallpaper: ${selectedWallpaper.title}`);
    return selectedWallpaper.url;
  }
  
  // Check for partial matches (keywords)
  const titleKey = Object.keys(CURATED_WALLPAPERS).find(key => {
    const normalizedTitle = animeTitle.toLowerCase();
    const normalizedKey = key.toLowerCase();
    
    return (
      normalizedTitle.includes(normalizedKey) ||
      normalizedKey.includes(normalizedTitle) ||
      // Check individual words
      normalizedTitle.split(' ').some(word => normalizedKey.includes(word)) ||
      normalizedKey.split(' ').some(word => normalizedTitle.includes(word))
    );
  });
  
  if (titleKey) {
    const wallpapers = CURATED_WALLPAPERS[titleKey];
    const selectedWallpaper = wallpapers[0];
    console.log(`✅ Found matching wallpaper for "${titleKey}": ${selectedWallpaper.title}`);
    return selectedWallpaper.url;
  }
  
  // Fallback to generic wallpapers using consistent hash
  const hash = animeTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedWallpaper = GENERIC_WALLPAPERS[hash % GENERIC_WALLPAPERS.length];
  console.log(`🎲 Using generic wallpaper: ${selectedWallpaper.title}`);
  
  return selectedWallpaper.url;
}

/**
 * Get wallpaper with metadata
 */
export function getAnimeWallpaperInfo(animeTitle: string): AnimeWallpaper {
  const url = getAnimeWallpaper(animeTitle);
  
  // Find the wallpaper object
  const allWallpapers = [
    ...Object.values(CURATED_WALLPAPERS).flat(),
    ...GENERIC_WALLPAPERS
  ];
  
  const wallpaperInfo = allWallpapers.find(w => w.url === url);
  
  return wallpaperInfo || {
    url,
    title: `${animeTitle} Wallpaper`,
    quality: "HD",
    aspect_ratio: "16:9"
  };
}

/**
 * Preload wallpaper images for better performance
 */
export function preloadWallpaper(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      console.log(`📥 Preloaded wallpaper: ${url}`);
      resolve();
    };
    img.onerror = () => {
      console.error(`❌ Failed to preload wallpaper: ${url}`);
      reject();
    };
    img.src = url;
  });
}