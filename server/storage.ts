import { type User, type InsertUser, type UserStats, type InsertUserStats, users, userStats } from "@shared/schema";
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
  getUserStats(userId: string): Promise<UserStats | undefined>;
  createUserStats(userId: string): Promise<UserStats>;
  updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats | null>;
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
}

export const storage = new DatabaseStorage();
