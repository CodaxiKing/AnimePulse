import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull().default('UsuarioAnonimo'),
  lastNameChange: timestamp("last_name_change").defaultNow(),
  avatar: text("avatar"),
  online: boolean("online").default(false),
  lastActivity: timestamp("last_activity").defaultNow(),
});

export const animes = pgTable("animes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  image: text("image").notNull(),
  studio: text("studio"),
  year: integer("year"),
  genres: text("genres").array(),
  synopsis: text("synopsis"),
  releaseDate: text("release_date"),
  status: text("status").default("ongoing"),
  totalEpisodes: integer("total_episodes"),
  rating: text("rating"),
  viewCount: integer("view_count").default(0),
  trailerUrl: text("trailer_url"),
  relations: text("relations").array(),
  characters: text("characters").array(),
});

export const episodes = pgTable("episodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  animeId: varchar("anime_id").references(() => animes.id),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail"),
  duration: text("duration"), // formato "24 min"
  releaseDate: text("release_date"),
  streamingUrl: text("streaming_url"),
  downloadUrl: text("download_url"),
});

export const mangas = pgTable("mangas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  image: text("image").notNull(),
  author: text("author"),
  latestChapter: integer("latest_chapter"),
  genres: text("genres").array(),
  synopsis: text("synopsis"),
  status: text("status").default("ongoing"),
  rating: text("rating"),
});

export const chapters = pgTable("chapters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mangaId: varchar("manga_id").references(() => mangas.id),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  pages: text("pages").array(), // URLs das páginas do capítulo
  releaseDate: text("release_date"),
  readingUrl: text("reading_url"),
});

export const news = pgTable("news", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  image: text("image"),
  category: text("category").notNull(),
  summary: text("summary"),
  content: text("content"),
  source: text("source"),
  publishedAt: timestamp("published_at").defaultNow(),
});

// Sistema de seguir usuários
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Grupos da comunidade
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  privacy: text("privacy").default("open"), // 'open', 'closed', 'private'
  memberCount: integer("member_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Community Posts - Sistema completo de posts sociais
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array(), // Array de URLs de imagens/vídeos
  animeId: text("anime_id"), // Referência opcional a um anime
  animeTitle: text("anime_title"), // Nome do anime para display
  animeImage: text("anime_image"), // Imagem do anime
  visibility: text("visibility").default("public"), // 'public', 'followers', 'group'
  groupId: varchar("group_id").references(() => groups.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comentários nos posts
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  parentCommentId: varchar("parent_comment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reações aos posts (likes, loves, etc.)
export const reactions = pgTable("reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id),
  commentId: varchar("comment_id").references(() => comments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'like', 'love', 'haha', 'wow', 'angry'
  createdAt: timestamp("created_at").defaultNow(),
});

// Membros dos grupos
export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").default("member"), // 'owner', 'moderator', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Tags para posts (hashtags)
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").default("#3b82f6"),
  postCount: integer("post_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relação entre posts e tags
export const postTags = pgTable("post_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id),
  tagId: varchar("tag_id").notNull().references(() => tags.id),
});

// Sistema de notificações
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'like', 'comment', 'follow', 'group_invite', 'mention'
  actorId: varchar("actor_id").references(() => users.id), // Quem fez a ação
  entityType: text("entity_type"), // 'post', 'comment', 'group'
  entityId: varchar("entity_id"), // ID da entidade relacionada
  message: text("message").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sistema de relatórios e moderação
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(), // 'post', 'comment', 'user'
  targetId: varchar("target_id").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("open"), // 'open', 'reviewed', 'resolved', 'dismissed'
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Bookmarks/Posts salvos
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  postId: varchar("post_id").notNull().references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const watchProgress = pgTable("watch_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  animeId: varchar("anime_id").references(() => animes.id),
  episodeNumber: integer("episode_number"),
  progressPercent: integer("progress_percent").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sistema de pontos e conquistas
export const userStats = pgTable("user_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).unique(),
  totalPoints: integer("total_points").default(0),
  animesCompleted: integer("animes_completed").default(0),
  episodesWatched: integer("episodes_watched").default(0),
  level: integer("level").default(1),
  streakDays: integer("streak_days").default(0),
  lastWatchDate: timestamp("last_watch_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const completedAnimes = pgTable("completed_animes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  animeId: varchar("anime_id"), // Removida referência FK pois anime vem de APIs externas
  animeTitle: text("anime_title").notNull(),
  animeImage: text("anime_image"),
  totalEpisodes: integer("total_episodes"),
  pointsEarned: integer("points_earned").default(0),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const watchedEpisodes = pgTable("watched_episodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  animeId: varchar("anime_id").references(() => animes.id),
  episodeNumber: integer("episode_number").notNull(),
  watchedAt: timestamp("watched_at").defaultNow(),
});

// Schema types
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  avatar: true,
}).partial({ displayName: true, avatar: true });

export const insertAnimeSchema = createInsertSchema(animes).omit({
  id: true,
});

export const insertEpisodeSchema = createInsertSchema(episodes).omit({
  id: true,
});

export const insertMangaSchema = createInsertSchema(mangas).omit({
  id: true,
});

export const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
});

export const insertNewsSchema = createInsertSchema(news).omit({
  id: true,
});

// Insert schemas para as novas tabelas da comunidade
export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertReactionSchema = createInsertSchema(reactions).omit({
  id: true,
  createdAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  memberCount: true,
  createdAt: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  postCount: true,
  createdAt: true,
});

export const insertPostTagSchema = createInsertSchema(postTags).omit({
  id: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertWatchProgressSchema = createInsertSchema(watchProgress).omit({
  id: true,
  updatedAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  updatedAt: true,
});

export const insertCompletedAnimeSchema = createInsertSchema(completedAnimes).omit({
  id: true,
  completedAt: true,
});

export const insertWatchedEpisodeSchema = createInsertSchema(watchedEpisodes).omit({
  id: true,
  watchedAt: true,
});

// Achievements/Conquistas
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: varchar("description").notNull(),
  icon: varchar("icon").notNull(),
  category: varchar("category").notNull(), // "watching", "completion", "streak", "social"
  type: varchar("type").notNull(), // "count", "milestone", "special"
  requirement: integer("requirement").notNull(), // valor necessário para conquistar
  points: integer("points").default(0), // pontos dados pela conquista
  rarity: varchar("rarity").default("common"), // "common", "rare", "epic", "legendary"
  createdAt: timestamp("created_at").defaultNow(),
});

// User Achievements - conquistas desbloqueadas pelo usuário
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementId: varchar("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: integer("progress").default(0), // progresso atual
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

// Infer types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Anime = typeof animes.$inferSelect;
export type InsertAnime = z.infer<typeof insertAnimeSchema>;
export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Manga = typeof mangas.$inferSelect;
export type InsertManga = z.infer<typeof insertMangaSchema>;
export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type News = typeof news.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type PostTag = typeof postTags.$inferSelect;
export type InsertPostTag = z.infer<typeof insertPostTagSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type WatchProgress = typeof watchProgress.$inferSelect;
export type InsertWatchProgress = z.infer<typeof insertWatchProgressSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type CompletedAnime = typeof completedAnimes.$inferSelect;
export type InsertCompletedAnime = z.infer<typeof insertCompletedAnimeSchema>;
export type WatchedEpisode = typeof watchedEpisodes.$inferSelect;
export type InsertWatchedEpisode = z.infer<typeof insertWatchedEpisodeSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

// Extended types for frontend
export type AnimeWithProgress = Anime & {
  progress?: WatchProgress;
  episodes?: Episode[];
};

export type MangaWithChapters = Manga & {
  chapters?: Chapter[];
};

// Tipos estendidos para a comunidade
export type PostWithUser = Post & {
  user: User;
  reactions?: Reaction[];
  comments?: Comment[];
  tags?: Tag[];
  isLiked?: boolean;
  isBookmarked?: boolean;
  reactionsCount?: number;
  commentsCount?: number;
};

export type CommentWithUser = Comment & {
  user: User;
  reactions?: Reaction[];
  replies?: CommentWithUser[];
  isLiked?: boolean;
};

export type GroupWithDetails = Group & {
  owner: User;
  members?: GroupMember[];
  isMember?: boolean;
  isOwner?: boolean;
};

export type UserProfile = User & {
  stats?: UserStats;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
  isFollowingYou?: boolean;
};

export type AnimeCategory = 'continue' | 'recommended' | 'latest' | 'trending';
export type MangaCategory = 'mangas' | 'latest' | 'authors' | 'art' | 'libraries' | 'funding';
export type NewsCategory = 'anime' | 'manga' | 'geek' | 'cosplay';

// Sistema de Chat
export const chatRooms = pgTable("chat_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'public', 'private', 'watch_party'
  avatar: text("avatar"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  animeId: text("anime_id"), // Para watch parties
  animeTitle: text("anime_title"),
  currentEpisode: integer("current_episode"),
  currentTime: integer("current_time").default(0), // em segundos
  isPlaying: boolean("is_playing").default(false),
  maxMembers: integer("max_members").default(50),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Participantes dos chats
export const chatParticipants = pgTable("chat_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatRoomId: varchar("chat_room_id").notNull().references(() => chatRooms.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").default("member"), // 'owner', 'moderator', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
  isOnline: boolean("is_online").default(false),
});

// Mensagens do chat
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatRoomId: varchar("chat_room_id").notNull().references(() => chatRooms.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").default("text"), // 'text', 'image', 'system', 'anime_sync'
  mediaUrl: text("media_url"),
  replyToId: varchar("reply_to_id"),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Eventos de sincronização para watch parties
export const watchPartyEvents = pgTable("watch_party_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatRoomId: varchar("chat_room_id").notNull().references(() => chatRooms.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventType: text("event_type").notNull(), // 'play', 'pause', 'seek', 'episode_change'
  timestamp: integer("timestamp"), // posição do vídeo em segundos
  episodeNumber: integer("episode_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas para inserção
export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({
  id: true,
  joinedAt: true,
  lastSeen: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  editedAt: true,
});

export const insertWatchPartyEventSchema = createInsertSchema(watchPartyEvents).omit({
  id: true,
  createdAt: true,
});

// Tipos inferidos
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type WatchPartyEvent = typeof watchPartyEvents.$inferSelect;
export type InsertWatchPartyEvent = z.infer<typeof insertWatchPartyEventSchema>;

// Tipos estendidos para chat
export type ChatRoomWithDetails = ChatRoom & {
  owner: User;
  participants: (ChatParticipant & { user: User })[];
  lastMessage?: ChatMessage & { user: User };
  unreadCount?: number;
  participantCount: number;
};

export type ChatMessageWithUser = ChatMessage & {
  user: User;
  replyTo?: ChatMessage & { user: User };
};

export type WatchPartyState = {
  isPlaying: boolean;
  currentTime: number;
  currentEpisode: number;
  animeTitle?: string;
  participants: string[];
};
