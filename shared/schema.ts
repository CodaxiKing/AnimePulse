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

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  content: text("content").notNull(),
  image: text("image"),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
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
  animeId: varchar("anime_id").references(() => animes.id),
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

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  likes: true,
  comments: true,
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

export type PostWithUser = Post & {
  user: User;
};

export type AnimeCategory = 'continue' | 'recommended' | 'latest' | 'trending';
export type MangaCategory = 'mangas' | 'latest' | 'authors' | 'art' | 'libraries' | 'funding';
export type NewsCategory = 'anime' | 'manga' | 'geek' | 'cosplay';
