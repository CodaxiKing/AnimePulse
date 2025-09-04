import type { Anime, Episode, Manga, News, User, Post, WatchProgress, AnimeWithProgress, PostWithUser } from "@shared/schema";

export const mockAnimes: Anime[] = [
  {
    id: "1",
    title: "Attack on Titan",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop",
    studio: "WIT Studio",
    year: 2013,
    genres: ["Action", "Drama", "Fantasy"],
    synopsis: "A humanidade luta pela sobrevivência contra Titãs humanoides gigantes que ameaçam a existência da civilização. Eren Jaeger e seus amigos se juntam ao exército para defender a cidade murada e descobrir os segredos por trás desses monstros misteriosos.",
    releaseDate: "2013-04-07",
    status: "completed",
    totalEpisodes: 75,
    rating: "9.0",
    viewCount: 850000,
  },
  {
    id: "2",
    title: "Jujutsu Kaisen",
    image: "https://images.unsplash.com/photo-1596727147705-61a532a659bd?w=400&h=600&fit=crop",
    studio: "MAPPA",
    year: 2020,
    genres: ["Action", "Supernatural", "School"],
    synopsis: "Estudantes lutam contra espíritos amaldiçoados para proteger a humanidade. Yuji Itadori se junta a uma escola especializada em exorcismo após engolir um dedo amaldiçoado e se tornar veículo de um demônio poderoso.",
    releaseDate: "2020-10-03",
    status: "ongoing",
    totalEpisodes: 24,
    rating: "8.8",
    viewCount: 720000,
  },
  {
    id: "3",
    title: "Demon Slayer",
    image: "https://pixabay.com/get/g15262bc1822ff8875f2f2f16adab365c51346cbbae2cf99aa698fec8971f81da3dc4ae268094fcf6700521f17268088a834ff6152c555590aa42527c3332a113_1280.jpg",
    studio: "Ufotable",
    year: 2019,
    genres: ["Action", "Historical", "Supernatural"],
    synopsis: "Um jovem garoto se torna um caçador de demônios para salvar sua irmã. Após sua família ser atacada por demônios, Tanjiro embarca em uma jornada perigosa para encontrar uma cura e vingar sua família, enfrentando criaturas sobrenaturais poderosas.",
    releaseDate: "2019-04-06",
    status: "ongoing",
    totalEpisodes: 26,
    rating: "8.7",
    viewCount: 650000,
  },
  {
    id: "4",
    title: "Your Name",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop",
    studio: "CoMix Wave Films",
    year: 2016,
    genres: ["Romance", "Drama", "Supernatural"],
    synopsis: "Dois adolescentes compartilham uma conexão profunda e mágica. Quando uma cidade rural é atingida por um cometa, dois jovens descobrem que podem trocar de corpos e devem trabalhar juntos para salvar milhares de vidas.",
    releaseDate: "2016-08-26",
    status: "completed",
    totalEpisodes: 1,
    rating: "8.4",
    viewCount: 490000,
  },
  {
    id: "5",
    title: "Death Note",
    image: "https://pixabay.com/get/g0766813cbebdbbfd6a2abcceb3ea9a4557d3ab932f7b6ca2bacf0a4106b07a6b34b75c8776b004519d794bbe33a9a23b317b5f39a7cabd82a8ddd3c966602a14_1280.jpg",
    studio: "Madhouse",
    year: 2006,
    genres: ["Psychological", "Thriller", "Supernatural"],
    synopsis: "Um estudante do ensino médio descobre um caderno sobrenatural. Light Yagami encontra o Death Note, um caderno que pode matar qualquer pessoa cujo nome seja escrito nele, e decide criar um mundo ideal eliminando criminosos.",
    releaseDate: "2006-10-04",
    status: "completed",
    totalEpisodes: 37,
    rating: "9.0",
    viewCount: 380000,
  },
  {
    id: "6",
    title: "One Piece",
    image: "https://pixabay.com/get/gc912d0ef4b3e37cb5eea76df26a0f4ee806404fe9fa963387c0210f249c3b7cdfc910963e4c8e470ac534f1262dc5f08dfd412b41f61b262faab3525775783d0_1280.jpg",
    studio: "Toei Animation",
    year: 1999,
    genres: ["Adventure", "Comedy", "Action"],
    synopsis: "A young pirate searches for the ultimate treasure.",
    releaseDate: "1999-10-20",
    status: "ongoing",
    totalEpisodes: 1000,
    rating: "9.2",
    viewCount: 920000,
  },
  {
    id: "7",
    title: "My Hero Academia",
    image: "https://pixabay.com/get/gfe5e45288682fc4eb59a45ebddb4a22365df59ecd798c4a152c29541464f818b165b5da68926f5012ece89f178ebb57242c3194b08d7e8240bf042f173785a21_1280.jpg",
    studio: "Bones",
    year: 2016,
    genres: ["Action", "School", "Superhero"],
    synopsis: "Em um mundo de superpoderes, um garoto sem habilidades sonha em se tornar um herói. Izuku Midoriya luta para realizar seu sonho mesmo nascendo sem Quirk em uma sociedade onde quase todos possuem superpoderes.",
    releaseDate: "2016-04-03",
    status: "ongoing",
    totalEpisodes: 138,
    rating: "8.5",
    viewCount: 560000,
  },
  {
    id: "8",
    title: "Chainsaw Man",
    image: "https://pixabay.com/get/g42ea2efc124730128153d69b593df3671811326be5a722af529a724f23a8f6bea843c84795c27fc94515bab4e56775566cfd66ee9e4cb2faf9e1d35b47b0903d_1280.jpg",
    studio: "MAPPA",
    year: 2022,
    genres: ["Action", "Supernatural", "Dark"],
    synopsis: "Um jovem caçador de demônios com poderes de motosserra luta contra demônios. Denji vive uma vida miserável até se fundir com seu demônio de estimação e ganhar a habilidade de se transformar em Chainsaw Man.",
    releaseDate: "2022-10-11",
    status: "ongoing",
    totalEpisodes: 12,
    rating: "8.9",
    viewCount: 410000,
  },
  {
    id: "9",
    title: "Naruto",
    image: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=400&h=600&fit=crop",
    studio: "Pierrot",
    year: 2002,
    genres: ["Adventure", "Martial Arts", "Ninja"],
    synopsis: "Um jovem ninja busca reconhecimento e sonha em se tornar Hokage. Naruto Uzumaki, órfão e pária da Vila da Folha, treina incansavelmente para se tornar o ninja mais forte e ganhar o respeito de todos ao seu redor.",
    releaseDate: "2002-10-03",
    status: "completed",
    totalEpisodes: 720,
    rating: "8.3",
    viewCount: 780000,
  },
];

export const mockWatchProgress: WatchProgress[] = [
  { id: "1", userId: "1", animeId: "1", episodeNumber: 15, progressPercent: 60, updatedAt: new Date() },
  { id: "2", userId: "1", animeId: "2", episodeNumber: 8, progressPercent: 33, updatedAt: new Date() },
  { id: "3", userId: "1", animeId: "3", episodeNumber: 22, progressPercent: 85, updatedAt: new Date() },
  { id: "4", userId: "1", animeId: "4", episodeNumber: 1, progressPercent: 45, updatedAt: new Date() },
];

export const mockEpisodes: Episode[] = [
  {
    id: "1",
    animeId: "1",
    number: 1,
    title: "Pactos Ocultos",
    thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=300&fit=crop",
    duration: "24 min",
    releaseDate: null,
    streamingUrl: null,
    downloadUrl: null,
  },
  {
    id: "2",
    animeId: "1",
    number: 2,
    title: "Shadows de Amnésia",
    thumbnail: "https://images.unsplash.com/photo-1596727147705-61a532a659bd?w=600&h=300&fit=crop",
    duration: "24 min",
    releaseDate: null,
    streamingUrl: null,
    downloadUrl: null,
  },
  {
    id: "3",
    animeId: "1",
    number: 3,
    title: "A Ascensão da Noite Eterna",
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=300&fit=crop",
    duration: "24 min",
    releaseDate: null,
    streamingUrl: null,
    downloadUrl: null,
  },
  {
    id: "4",
    animeId: "1",
    number: 4,
    title: "A Invasão dos Vagos",
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=300&fit=crop",
    duration: "24 min",
    releaseDate: null,
    streamingUrl: null,
    downloadUrl: null,
  },
  {
    id: "5",
    animeId: "1",
    number: 5,
    title: "Retorno dos Caídos",
    thumbnail: "https://images.unsplash.com/photo-1606989103931-d4bb3a72d9b6?w=600&h=300&fit=crop",
    duration: "24 min",
    releaseDate: null,
    streamingUrl: null,
    downloadUrl: null,
  },
  {
    id: "6",
    animeId: "1",
    number: 6,
    title: "Sombras de Um Novo Horizonte",
    thumbnail: "https://images.unsplash.com/photo-1606989063908-ae11a0e9f4dd?w=600&h=300&fit=crop",
    duration: "24 min",
    releaseDate: null,
    streamingUrl: null,
    downloadUrl: null,
  },
  {
    id: "7",
    animeId: "1",
    number: 7,
    title: "O Preço da Promessa",
    thumbnail: "https://images.unsplash.com/photo-1612278524671-24164e938b9a?w=600&h=300&fit=crop",
    duration: "24 min",
    releaseDate: null,
    streamingUrl: null,
    downloadUrl: null,
  },
  {
    id: "8",
    animeId: "1",
    number: 8,
    title: "No Limiar do Amanhecer",
    thumbnail: "https://images.unsplash.com/photo-1606989163742-67ed22c26ea1?w=600&h=300&fit=crop",
    duration: "24 min",
    releaseDate: null,
    streamingUrl: null,
    downloadUrl: null,
  },
  {
    id: "9",
    animeId: "1",
    number: 9,
    title: "Caminhos Entrelaçados",
    thumbnail: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=600&h=300&fit=crop",
    duration: "24 min",
    releaseDate: null,
    streamingUrl: null,
    downloadUrl: null,
  },
];

export const mockMangas: Manga[] = [
  {
    id: "1",
    title: "One Piece",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
    author: "Eiichiro Oda",
    latestChapter: 1096,
    genres: ["Adventure", "Comedy", "Action"],
    synopsis: "A young pirate's journey to find the legendary treasure One Piece.",
    status: "ongoing",
    rating: "9.5",
  },
  {
    id: "2",
    title: "Demon Slayer",
    image: "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?w=400&h=300&fit=crop",
    author: "Koyoharu Gotouge",
    latestChapter: 205,
    genres: ["Action", "Historical", "Supernatural"],
    synopsis: "A boy fights demons to save his sister and humanity.",
    status: "completed",
    rating: "9.0",
  },
  {
    id: "3",
    title: "Jujutsu Kaisen",
    image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop",
    author: "Gege Akutami",
    latestChapter: 245,
    genres: ["Action", "School", "Supernatural"],
    synopsis: "Students battle cursed spirits in modern Japan.",
    status: "ongoing",
    rating: "8.8",
  },
];

export const mockNews: News[] = [
  {
    id: "1",
    title: "Novos lançamentos de anime para 2024",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop",
    category: "anime",
    summary: "Confira os animes mais aguardados que estreiam em 2024",
    content: "Uma lista completa dos lançamentos mais esperados...",
    source: "AnimePulse",
    publishedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "Mangás em alta: top 10 do mês",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop",
    category: "manga",
    summary: "Os mangás mais lidos e comentados do mês",
    content: "Ranking completo dos mangás que estão dominando...",
    source: "AnimePulse",
    publishedAt: new Date("2024-01-10"),
  },
  {
    id: "3",
    title: "Cultura geek em ascensão",
    image: "https://images.unsplash.com/photo-1560472355-109703aa3edc?w=400&h=200&fit=crop",
    category: "geek",
    summary: "Como a cultura geek tem influenciado a mídia mainstream",
    content: "Análise sobre o crescimento da cultura geek...",
    source: "AnimePulse",
    publishedAt: new Date("2024-01-08"),
  },
  {
    id: "4",
    title: "Grandes eventos de cosplay em 2024",
    image: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=200&fit=crop",
    category: "cosplay",
    summary: "Calendário completo de eventos e competições",
    content: "Os maiores eventos de cosplay que você não pode perder...",
    source: "AnimePulse",
    publishedAt: new Date("2024-01-05"),
  },
];

export const mockUsers: User[] = [
  {
    id: "1",
    username: "Jan Saibaki",
    password: "",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop",
    online: true,
    lastActivity: new Date(),
  },
  {
    id: "2",
    username: "Fanaja scres",
    password: "",
    avatar: "https://pixabay.com/get/g477147f4ab3f80ad73c8312104f196886be5fb8d9257115529e561ad6999b2d08790f2b13849e34e7f987b53727a2dc28f4bb7423e0a598e7dd48112a8ec35d7_1280.jpg",
    online: true,
    lastActivity: new Date(),
  },
  {
    id: "3",
    username: "Iku",
    password: "",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop",
    online: true,
    lastActivity: new Date(),
  },
  {
    id: "4",
    username: "F no",
    password: "",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop",
    online: true,
    lastActivity: new Date(),
  },
  {
    id: "5",
    username: "Ilya",
    password: "",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop",
    online: true,
    lastActivity: new Date(),
  },
];

export const mockPosts: Post[] = [
  {
    id: "1",
    userId: "1",
    content: "Acabei de assistir o último episódio de Jujutsu Kaisen e estou completamente sem palavras! A animação estava incrível 🔥",
    image: "https://images.unsplash.com/photo-1596727147705-61a532a659bd?w=600&h=300&fit=crop",
    likes: 24,
    comments: 5,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "2",
    userId: "2",
    content: "Alguém mais está ansioso para a nova temporada de Attack on Titan? As teorias estão cada vez mais intensas! 🔥",
    image: null,
    likes: 18,
    comments: 12,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
];

export const mockMangaCategories = [
  { id: "mangas", name: "Mangás", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop" },
  { id: "latest", name: "Últimos lançamentos", image: "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?w=400&h=300&fit=crop" },
  { id: "authors", name: "Mangakás", image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop" },
  { id: "art", name: "Braço", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop" },
  { id: "libraries", name: "Bibliotecas", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop" },
  { id: "funding", name: "Funding", image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop" },
];

// Helper functions to get data with progress
export function getAnimesWithProgress(animes?: Anime[]): AnimeWithProgress[] {
  const animesToUse = animes || mockAnimes;
  return animesToUse.map(anime => ({
    ...anime,
    progress: mockWatchProgress.find(progress => progress.animeId === anime.id),
  }));
}

export function getPostsWithUsers(): PostWithUser[] {
  return mockPosts.map(post => ({
    ...post,
    user: mockUsers.find(user => user.id === post.userId) || mockUsers[0],
  }));
}

export function getAnimesByCategory(category: string): AnimeWithProgress[] {
  const animesWithProgress = getAnimesWithProgress();
  
  switch (category) {
    case 'continue':
      return animesWithProgress.filter(anime => anime.progress);
    case 'recommended':
      return animesWithProgress.slice(4, 8);
    case 'latest':
      return animesWithProgress.filter(anime => anime.status === 'ongoing').slice(0, 4);
    case 'trending':
      return animesWithProgress.sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0")).slice(0, 4);
    default:
      return animesWithProgress;
  }
}

export function getEpisodesByAnimeId(animeId: string): Episode[] {
  return mockEpisodes.filter(episode => episode.animeId === animeId);
}

export function getAnimeById(animeId: string): AnimeWithProgress | undefined {
  const anime = mockAnimes.find(anime => anime.id === animeId);
  if (!anime) return undefined;
  
  return {
    ...anime,
    progress: mockWatchProgress.find(progress => progress.animeId === anime.id),
    episodes: getEpisodesByAnimeId(animeId),
  };
}
