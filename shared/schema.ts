import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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

// Schema types
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  avatar: true,
});

export const insertAnimeSchema = createInsertSchema(animes).omit({
  id: true,
});

export const insertEpisodeSchema = createInsertSchema(episodes).omit({
  id: true,
});

export const insertMangaSchema = createInsertSchema(mangas).omit({
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

// Infer types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Anime = typeof animes.$inferSelect;
export type InsertAnime = z.infer<typeof insertAnimeSchema>;
export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Manga = typeof mangas.$inferSelect;
export type InsertManga = z.infer<typeof insertMangaSchema>;
export type News = typeof news.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type WatchProgress = typeof watchProgress.$inferSelect;
export type InsertWatchProgress = z.infer<typeof insertWatchProgressSchema>;

// Extended types for frontend
export type AnimeWithProgress = Anime & {
  progress?: WatchProgress;
  episodes?: Episode[];
};

export type PostWithUser = Post & {
  user: User;
};

export type AnimeCategory = 'continue' | 'recommended' | 'latest' | 'trending';
export type MangaCategory = 'mangas' | 'latest' | 'authors' | 'art' | 'libraries' | 'funding';
export type NewsCategory = 'anime' | 'manga' | 'geek' | 'cosplay';
