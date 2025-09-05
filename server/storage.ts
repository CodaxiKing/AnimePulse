import { type User, type InsertUser, type UserStats, type InsertUserStats, type CompletedAnime, type InsertCompletedAnime, type WatchProgress, type Achievement, type InsertAchievement, type UserAchievement, type InsertUserAchievement, users, userStats, completedAnimes, watchProgress, achievements, userAchievements } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateRandomDisplayName, canChangeDisplayName } from "./nameGenerator";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(username: string, password: string): Promise<User | null>;
  updateDisplayName(userId: string, newDisplayName: string): Promise<User | null>;
  updateUserAvatar(userId: string, avatarUrl: string): Promise<User | null>;
  getUserStats(userId: string): Promise<UserStats | undefined>;
  createUserStats(userId: string): Promise<UserStats>;
  updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats | null>;
  markAnimeAsCompleted(userId: string, animeData: Omit<InsertCompletedAnime, 'userId'>): Promise<CompletedAnime>;
  getCompletedAnimes(userId: string): Promise<CompletedAnime[]>;
  removeFromWatchProgress(userId: string, animeId: string): Promise<void>;
  getWatchProgress(userId: string): Promise<WatchProgress[]>;
  updateWatchProgress(userId: string, animeId: string, episodeNumber: number): Promise<WatchProgress>;
  
  // Achievement methods
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  checkAndUnlockAchievements(userId: string): Promise<UserAchievement[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement | null>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash da senha antes de salvar
    const hashedPassword = await bcrypt.hash(insertUser.password, 12);
    
    // Gerar nome de exibição aleatório se não fornecido
    const displayName = insertUser.displayName || generateRandomDisplayName();
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
        displayName,
        lastNameChange: new Date(),
      })
      .returning();
    return user;
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  async updateDisplayName(userId: string, newDisplayName: string): Promise<User | null> {
    const user = await this.getUser(userId);
    if (!user) {
      return null;
    }

    // Verificar se pode alterar o nome (7 dias desde a última alteração)
    if (!canChangeDisplayName(user.lastNameChange!)) {
      throw new Error("Você pode alterar o nome apenas uma vez a cada 7 dias");
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        displayName: newDisplayName,
        lastNameChange: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser || null;
  }

  async getUserStats(userId: string): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats || undefined;
  }

  async createUserStats(userId: string): Promise<UserStats> {
    const [stats] = await db
      .insert(userStats)
      .values({
        userId,
        totalPoints: 0,
        animesCompleted: 0,
        episodesWatched: 0,
        level: 1,
        streakDays: 0,
      })
      .returning();
    return stats;
  }

  async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats | null> {
    const [updatedStats] = await db
      .update(userStats)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userStats.userId, userId))
      .returning();

    return updatedStats || null;
  }

  async updateUserAvatar(userId: string, avatarUrl: string): Promise<User | null> {
    const [updatedUser] = await db
      .update(users)
      .set({
        avatar: avatarUrl,
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser || null;
  }

  async markAnimeAsCompleted(userId: string, animeData: Omit<InsertCompletedAnime, 'userId'>): Promise<CompletedAnime> {
    const [completedAnime] = await db
      .insert(completedAnimes)
      .values({
        ...animeData,
        userId,
      })
      .returning();
    return completedAnime;
  }

  async getCompletedAnimes(userId: string): Promise<CompletedAnime[]> {
    const completed = await db
      .select()
      .from(completedAnimes)
      .where(eq(completedAnimes.userId, userId))
      .orderBy(completedAnimes.completedAt);
    return completed;
  }

  async removeFromWatchProgress(userId: string, animeId: string): Promise<void> {
    await db
      .delete(watchProgress)
      .where(eq(watchProgress.userId, userId));
    console.log(`✅ Removed ${animeId} from watch progress for user ${userId}`);
  }

  async getWatchProgress(userId: string): Promise<WatchProgress[]> {
    const progress = await db
      .select()
      .from(watchProgress)
      .where(eq(watchProgress.userId, userId))
      .orderBy(watchProgress.updatedAt);
    return progress;
  }

  async updateWatchProgress(userId: string, animeId: string, episodeNumber: number): Promise<WatchProgress> {
    // Verificar se já existe progresso para este anime
    const [existingProgress] = await db
      .select()
      .from(watchProgress)
      .where(eq(watchProgress.userId, userId) && eq(watchProgress.animeId, animeId));

    if (existingProgress) {
      // Atualizar progresso existente
      const [updatedProgress] = await db
        .update(watchProgress)
        .set({
          episodeNumber,
          updatedAt: new Date(),
        })
        .where(eq(watchProgress.userId, userId) && eq(watchProgress.animeId, animeId))
        .returning();
      return updatedProgress;
    } else {
      // Criar novo progresso
      const [newProgress] = await db
        .insert(watchProgress)
        .values({
          userId,
          animeId,
          episodeNumber,
        })
        .returning();
      return newProgress;
    }
  }

  // Achievement methods
  async getAllAchievements(): Promise<Achievement[]> {
    const allAchievements = await db.select().from(achievements);
    return allAchievements;
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const userAchievementsList = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
    return userAchievementsList;
  }

  async checkAndUnlockAchievements(userId: string): Promise<UserAchievement[]> {
    const user = await this.getUser(userId);
    const stats = await this.getUserStats(userId);
    if (!user || !stats) return [];

    const allAchievements = await this.getAllAchievements();
    const userUnlockedAchievements = await this.getUserAchievements(userId);
    const unlockedIds = userUnlockedAchievements.map(ua => ua.achievementId);
    
    const newlyUnlocked: UserAchievement[] = [];

    for (const achievement of allAchievements) {
      if (unlockedIds.includes(achievement.id)) continue;

      let shouldUnlock = false;
      let currentProgress = 0;

      switch (achievement.category) {
        case 'completion':
          currentProgress = stats.animesCompleted || 0;
          shouldUnlock = currentProgress >= achievement.requirement;
          break;
        case 'watching':
          currentProgress = stats.episodesWatched || 0;
          shouldUnlock = currentProgress >= achievement.requirement;
          break;
        case 'streak':
          currentProgress = stats.streakDays || 0;
          shouldUnlock = currentProgress >= achievement.requirement;
          break;
      }

      if (shouldUnlock) {
        const unlocked = await this.unlockAchievement(userId, achievement.id);
        if (unlocked) {
          newlyUnlocked.push(unlocked);
        }
      }
    }

    return newlyUnlocked;
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement | null> {
    try {
      const [userAchievement] = await db
        .insert(userAchievements)
        .values({
          userId,
          achievementId,
        })
        .returning();
      return userAchievement;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return null;
    }
  }
}

export const storage = new DatabaseStorage();
