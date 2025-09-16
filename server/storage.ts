import { 
  type User, type InsertUser, type UserStats, type InsertUserStats, 
  type CompletedAnime, type InsertCompletedAnime, type WatchProgress, 
  type Achievement, type InsertAchievement, type UserAchievement, type InsertUserAchievement,
  type Post, type InsertPost, type PostWithUser,
  type Comment, type InsertComment, type CommentWithUser,
  type Reaction, type InsertReaction,
  type Follow, type InsertFollow,
  type Group, type InsertGroup, type GroupWithDetails,
  type GroupMember, type InsertGroupMember,
  type Tag, type InsertTag, type PostTag, type InsertPostTag,
  type Notification, type InsertNotification,
  type Report, type InsertReport,
  type Bookmark, type InsertBookmark,
  type UserProfile,
  users, userStats, completedAnimes, watchProgress, achievements, userAchievements,
  posts, comments, reactions, follows, groups, groupMembers, tags, postTags, notifications, reports, bookmarks
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql, count, asc } from "drizzle-orm";
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

  // Community Posts methods
  createPost(post: InsertPost): Promise<Post>;
  getPost(postId: string, requestingUserId?: string): Promise<PostWithUser | null>;
  getPosts(requestingUserId?: string, options?: { userId?: string; groupId?: string; limit?: number; offset?: number; visibility?: string }): Promise<PostWithUser[]>;
  updatePost(postId: string, userId: string, updates: Partial<Post>): Promise<Post | null>;
  deletePost(postId: string, userId: string): Promise<void>;
  getFeedPosts(userId: string, options?: { limit?: number; offset?: number; filter?: 'all' | 'following' | 'groups' }): Promise<PostWithUser[]>;

  // Comments methods
  createComment(comment: InsertComment): Promise<Comment>;
  getPostComments(postId: string): Promise<CommentWithUser[]>;
  deleteComment(commentId: string, userId: string): Promise<void>;

  // Reactions methods
  createReaction(reaction: InsertReaction): Promise<Reaction>;
  deleteReaction(userId: string, postId?: string, commentId?: string, type?: string): Promise<void>;
  getPostReactions(postId: string): Promise<Reaction[]>;
  getUserReaction(userId: string, postId?: string, commentId?: string): Promise<Reaction | null>;

  // Follow methods
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  getFollowers(userId: string): Promise<UserProfile[]>;
  getFollowing(userId: string): Promise<UserProfile[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowCounts(userId: string): Promise<{ followersCount: number; followingCount: number }>;

  // Groups methods
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(groupId: string): Promise<GroupWithDetails | null>;
  getGroups(options?: { ownerId?: string; privacy?: string; limit?: number }): Promise<GroupWithDetails[]>;
  joinGroup(groupId: string, userId: string): Promise<GroupMember>;
  leaveGroup(groupId: string, userId: string): Promise<void>;
  getUserGroups(userId: string): Promise<GroupWithDetails[]>;
  updateGroupMemberRole(groupId: string, userId: string, role: string): Promise<GroupMember | null>;

  // Tags methods
  createTag(tag: InsertTag): Promise<Tag>;
  getTags(search?: string): Promise<Tag[]>;
  getPostTags(postId: string): Promise<Tag[]>;
  addTagToPost(postId: string, tagId: string): Promise<PostTag>;
  removeTagFromPost(postId: string, tagId: string): Promise<void>;

  // Notifications methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, options?: { limit?: number; unreadOnly?: boolean }): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationsCount(userId: string): Promise<number>;

  // Reports methods
  createReport(report: InsertReport): Promise<Report>;
  getReports(options?: { status?: string; limit?: number }): Promise<Report[]>;
  updateReportStatus(reportId: string, status: string, reviewedBy?: string): Promise<Report | null>;

  // Bookmarks methods
  createBookmark(userId: string, postId: string): Promise<Bookmark>;
  removeBookmark(userId: string, postId: string): Promise<void>;
  getUserBookmarks(userId: string): Promise<PostWithUser[]>;
  isPostBookmarked(userId: string, postId: string): Promise<boolean>;

  // User Profile methods
  getUserProfile(userId: string, viewerId?: string): Promise<UserProfile | null>;
  updateUserOnlineStatus(userId: string, online: boolean): Promise<void>;
  searchUsers(query: string, limit?: number): Promise<UserProfile[]>;
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
      .where(and(
        eq(watchProgress.userId, userId),
        eq(watchProgress.animeId, animeId)
      ));
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
      .where(and(
        eq(watchProgress.userId, userId),
        eq(watchProgress.animeId, animeId)
      ));

    if (existingProgress) {
      // Atualizar progresso existente
      const [updatedProgress] = await db
        .update(watchProgress)
        .set({
          episodeNumber,
          updatedAt: new Date(),
        })
        .where(and(
          eq(watchProgress.userId, userId),
          eq(watchProgress.animeId, animeId)
        ))
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

  // Community Posts methods
  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db
      .insert(posts)
      .values(post)
      .returning();
    return newPost;
  }

  async getPost(postId: string, requestingUserId?: string): Promise<PostWithUser | null> {
    const result = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        mediaUrls: posts.mediaUrls,
        animeId: posts.animeId,
        animeTitle: posts.animeTitle,
        animeImage: posts.animeImage,
        visibility: posts.visibility,
        groupId: posts.groupId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, postId));

    if (!result[0]) return null;

    const post = result[0];
    
    // Enforce visibility controls
    if (post.visibility === 'public') {
      // Public posts are visible to everyone
    } else if (post.visibility === 'private') {
      // Private posts are only visible to the author
      if (!requestingUserId || requestingUserId !== post.userId) {
        return null;
      }
    } else if (post.visibility === 'group') {
      // Group posts are only visible to group members
      if (!requestingUserId || !post.groupId) {
        return null;
      }
      
      // Check if requesting user is a member of the group
      const [membership] = await db
        .select()
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, post.groupId),
          eq(groupMembers.userId, requestingUserId)
        ));
      
      if (!membership) {
        return null;
      }
    }

    return {
      ...post,
      user: post.user as User,
    } as PostWithUser;
  }

  async getPosts(requestingUserId?: string, options: { userId?: string; groupId?: string; limit?: number; offset?: number; visibility?: string } = {}): Promise<PostWithUser[]> {
    const { userId, groupId, limit = 20, offset = 0, visibility } = options;
    
    const conditions = [];
    if (userId) conditions.push(eq(posts.userId, userId));
    if (groupId) conditions.push(eq(posts.groupId, groupId));
    if (visibility) conditions.push(eq(posts.visibility, visibility));

    // Add visibility enforcement
    if (requestingUserId) {
      // User can see:
      // 1. Public posts
      // 2. Their own private posts
      // 3. Group posts where they are a member
      const visibilityConditions = [
        eq(posts.visibility, 'public'),
        and(
          eq(posts.visibility, 'private'),
          eq(posts.userId, requestingUserId)
        )
      ];
      
      if (groupId) {
        // SECURITY FIX: Verify user is actually a member of the group before allowing access
        const [membership] = await db
          .select()
          .from(groupMembers)
          .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, requestingUserId)
          ));
        
        if (membership) {
          // User is a member, allow group posts for this group
          visibilityConditions.push(
            and(
              eq(posts.visibility, 'group'),
              eq(posts.groupId, groupId)
            )
          );
        }
        // If not a member, group posts won't be accessible
      }
      
      conditions.push(or(...visibilityConditions));
    } else {
      // Anonymous users can only see public posts
      conditions.push(eq(posts.visibility, 'public'));
    }

    let query = db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        mediaUrls: posts.mediaUrls,
        animeId: posts.animeId,
        animeTitle: posts.animeTitle,
        animeImage: posts.animeImage,
        visibility: posts.visibility,
        groupId: posts.groupId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    const result = await query;
    
    return result.map(post => ({
      ...post,
      user: post.user as User,
    })) as PostWithUser[];
  }

  async updatePost(postId: string, userId: string, updates: Partial<Post>): Promise<Post | null> {
    const [updatedPost] = await db
      .update(posts)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(posts.id, postId),
        eq(posts.userId, userId)
      ))
      .returning();
    
    return updatedPost || null;
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    await db.delete(posts).where(and(
      eq(posts.id, postId),
      eq(posts.userId, userId)
    ));
  }

  async getFeedPosts(userId: string, options: { limit?: number; offset?: number; filter?: 'all' | 'following' | 'groups' } = {}): Promise<PostWithUser[]> {
    const { limit = 20, offset = 0, filter = 'all' } = options;

    let query = db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        mediaUrls: posts.mediaUrls,
        animeId: posts.animeId,
        animeTitle: posts.animeTitle,
        animeImage: posts.animeImage,
        visibility: posts.visibility,
        groupId: posts.groupId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    if (filter === 'following') {
      query = query
        .leftJoin(follows, eq(follows.followingId, posts.userId))
        .where(and(
          eq(follows.followerId, userId),
          or(
            eq(posts.visibility, 'public'),
            and(
              eq(posts.visibility, 'private'),
              eq(posts.userId, userId)
            )
          )
        ));
    } else if (filter === 'groups') {
      query = query
        .leftJoin(groupMembers, eq(groupMembers.groupId, posts.groupId))
        .where(and(
          eq(groupMembers.userId, userId),
          or(
            eq(posts.visibility, 'group'),
            and(
              eq(posts.visibility, 'private'),
              eq(posts.userId, userId)
            )
          )
        ));
    } else {
      query = query.where(or(
        eq(posts.visibility, 'public'),
        and(
          eq(posts.visibility, 'private'),
          eq(posts.userId, userId)
        )
      ));
    }

    const result = await query;
    
    return result.map(post => ({
      ...post,
      user: post.user as User,
    })) as PostWithUser[];
  }

  // Comments methods
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    return newComment;
  }

  async getPostComments(postId: string): Promise<CommentWithUser[]> {
    const result = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        parentCommentId: comments.parentCommentId,
        createdAt: comments.createdAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
        }
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt));

    return result.map(comment => ({
      ...comment,
      user: comment.user as User,
    })) as CommentWithUser[];
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    await db.delete(comments).where(and(
      eq(comments.id, commentId),
      eq(comments.userId, userId)
    ));
  }

  // Reactions methods
  async createReaction(reaction: InsertReaction): Promise<Reaction> {
    const [newReaction] = await db
      .insert(reactions)
      .values(reaction)
      .returning();
    return newReaction;
  }

  async deleteReaction(userId: string, postId?: string, commentId?: string, type?: string): Promise<void> {
    const conditions = [eq(reactions.userId, userId)];
    if (postId) conditions.push(eq(reactions.postId, postId));
    if (commentId) conditions.push(eq(reactions.commentId, commentId));
    if (type) conditions.push(eq(reactions.type, type));

    await db.delete(reactions).where(and(...conditions));
  }

  async getPostReactions(postId: string): Promise<Reaction[]> {
    return await db
      .select()
      .from(reactions)
      .where(eq(reactions.postId, postId));
  }

  async getUserReaction(userId: string, postId?: string, commentId?: string): Promise<Reaction | null> {
    const conditions = [eq(reactions.userId, userId)];
    if (postId) conditions.push(eq(reactions.postId, postId));
    if (commentId) conditions.push(eq(reactions.commentId, commentId));

    const [reaction] = await db
      .select()
      .from(reactions)
      .where(and(...conditions));

    return reaction || null;
  }

  // Follow methods
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    const [follow] = await db
      .insert(follows)
      .values({ followerId, followingId })
      .returning();
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));
  }

  async getFollowers(userId: string): Promise<UserProfile[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
        online: users.online,
        lastActivity: users.lastActivity,
      })
      .from(follows)
      .leftJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));

    return result as UserProfile[];
  }

  async getFollowing(userId: string): Promise<UserProfile[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
        online: users.online,
        lastActivity: users.lastActivity,
      })
      .from(follows)
      .leftJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));

    return result as UserProfile[];
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));

    return !!follow;
  }

  async getFollowCounts(userId: string): Promise<{ followersCount: number; followingCount: number }> {
    const [followersResult] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));

    const [followingResult] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));

    return {
      followersCount: followersResult?.count || 0,
      followingCount: followingResult?.count || 0,
    };
  }

  // Groups methods
  async createGroup(group: InsertGroup): Promise<Group> {
    return await db.transaction(async (tx) => {
      const [newGroup] = await tx
        .insert(groups)
        .values(group)
        .returning();
      
      // Add creator as owner member
      await tx
        .insert(groupMembers)
        .values({
          groupId: newGroup.id,
          userId: group.ownerId,
          role: 'owner',
        });

      return newGroup;
    });
  }

  async getGroup(groupId: string): Promise<GroupWithDetails | null> {
    const result = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        coverImage: groups.coverImage,
        ownerId: groups.ownerId,
        privacy: groups.privacy,
        memberCount: groups.memberCount,
        createdAt: groups.createdAt,
        owner: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
        }
      })
      .from(groups)
      .leftJoin(users, eq(groups.ownerId, users.id))
      .where(eq(groups.id, groupId));

    if (!result[0]) return null;

    const group = result[0];
    return {
      ...group,
      owner: group.owner as User,
    } as GroupWithDetails;
  }

  async getGroups(options: { ownerId?: string; privacy?: string; limit?: number } = {}): Promise<GroupWithDetails[]> {
    const { ownerId, privacy, limit = 20 } = options;
    
    let query = db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        coverImage: groups.coverImage,
        ownerId: groups.ownerId,
        privacy: groups.privacy,
        memberCount: groups.memberCount,
        createdAt: groups.createdAt,
        owner: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
        }
      })
      .from(groups)
      .leftJoin(users, eq(groups.ownerId, users.id))
      .orderBy(desc(groups.createdAt))
      .limit(limit);

    const conditions = [];
    if (ownerId) conditions.push(eq(groups.ownerId, ownerId));
    if (privacy) conditions.push(eq(groups.privacy, privacy));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query;
    
    return result.map(group => ({
      ...group,
      owner: group.owner as User,
    })) as GroupWithDetails[];
  }

  async joinGroup(groupId: string, userId: string): Promise<GroupMember> {
    return await db.transaction(async (tx) => {
      const [member] = await tx
        .insert(groupMembers)
        .values({
          groupId,
          userId,
          role: 'member',
        })
        .returning();

      // Update member count
      await tx
        .update(groups)
        .set({ memberCount: sql`${groups.memberCount} + 1` })
        .where(eq(groups.id, groupId));

      return member;
    });
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .delete(groupMembers)
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        ));

      // Update member count
      await tx
        .update(groups)
        .set({ memberCount: sql`${groups.memberCount} - 1` })
        .where(eq(groups.id, groupId));
    });
  }

  async getUserGroups(userId: string): Promise<GroupWithDetails[]> {
    const result = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        coverImage: groups.coverImage,
        ownerId: groups.ownerId,
        privacy: groups.privacy,
        memberCount: groups.memberCount,
        createdAt: groups.createdAt,
        owner: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
        }
      })
      .from(groupMembers)
      .leftJoin(groups, eq(groupMembers.groupId, groups.id))
      .leftJoin(users, eq(groups.ownerId, users.id))
      .where(eq(groupMembers.userId, userId));

    return result.map(group => ({
      ...group,
      owner: group.owner as User,
    })) as GroupWithDetails[];
  }

  async updateGroupMemberRole(groupId: string, userId: string, role: string): Promise<GroupMember | null> {
    const [updatedMember] = await db
      .update(groupMembers)
      .set({ role })
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      ))
      .returning();

    return updatedMember || null;
  }

  // Tags methods
  async createTag(tag: InsertTag): Promise<Tag> {
    const [newTag] = await db
      .insert(tags)
      .values(tag)
      .returning();
    return newTag;
  }

  async getTags(search?: string): Promise<Tag[]> {
    let query = db.select().from(tags).orderBy(desc(tags.postCount));
    
    if (search) {
      query = query.where(like(tags.name, `%${search}%`));
    }

    return await query;
  }

  async getPostTags(postId: string): Promise<Tag[]> {
    const result = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        postCount: tags.postCount,
        createdAt: tags.createdAt,
      })
      .from(postTags)
      .leftJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, postId));
    
    return result.filter(tag => tag.id !== null) as Tag[];
  }

  async addTagToPost(postId: string, tagId: string): Promise<PostTag> {
    return await db.transaction(async (tx) => {
      const [postTag] = await tx
        .insert(postTags)
        .values({ postId, tagId })
        .returning();

      // Update tag post count
      await tx
        .update(tags)
        .set({ postCount: sql`${tags.postCount} + 1` })
        .where(eq(tags.id, tagId));

      return postTag;
    });
  }

  async removeTagFromPost(postId: string, tagId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .delete(postTags)
        .where(and(
          eq(postTags.postId, postId),
          eq(postTags.tagId, tagId)
        ));

      // Update tag post count
      await tx
        .update(tags)
        .set({ postCount: sql`${tags.postCount} - 1` })
        .where(eq(tags.id, tagId));
    });
  }

  // Notifications methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: string, options: { limit?: number; unreadOnly?: boolean } = {}): Promise<Notification[]> {
    const { limit = 20, unreadOnly = false } = options;
    
    const conditions = [eq(notifications.userId, userId)];
    
    if (unreadOnly) {
      conditions.push(sql`${notifications.readAt} IS NULL`);
    }

    return await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(
        eq(notifications.userId, userId),
        sql`${notifications.readAt} IS NULL`
      ));
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        sql`${notifications.readAt} IS NULL`
      ));

    return result?.count || 0;
  }

  // Reports methods
  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db
      .insert(reports)
      .values(report)
      .returning();
    return newReport;
  }

  async getReports(options: { status?: string; limit?: number } = {}): Promise<Report[]> {
    const { status, limit = 50 } = options;
    
    let query = db
      .select()
      .from(reports);

    if (status) {
      query = query.where(eq(reports.status, status));
    }

    query = query
      .orderBy(desc(reports.createdAt))
      .limit(limit);

    return await query;
  }

  async updateReportStatus(reportId: string, status: string, reviewedBy?: string): Promise<Report | null> {
    const [updatedReport] = await db
      .update(reports)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
      })
      .where(eq(reports.id, reportId))
      .returning();

    return updatedReport || null;
  }

  // Bookmarks methods
  async createBookmark(userId: string, postId: string): Promise<Bookmark> {
    const [bookmark] = await db
      .insert(bookmarks)
      .values({ userId, postId })
      .returning();
    return bookmark;
  }

  async removeBookmark(userId: string, postId: string): Promise<void> {
    await db
      .delete(bookmarks)
      .where(and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.postId, postId)
      ));
  }

  async getUserBookmarks(userId: string): Promise<PostWithUser[]> {
    const result = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        mediaUrls: posts.mediaUrls,
        animeId: posts.animeId,
        animeTitle: posts.animeTitle,
        animeImage: posts.animeImage,
        visibility: posts.visibility,
        groupId: posts.groupId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
        }
      })
      .from(bookmarks)
      .leftJoin(posts, eq(bookmarks.postId, posts.id))
      .leftJoin(users, eq(posts.userId, users.id))
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));

    return result.map(post => ({
      ...post,
      user: post.user as User,
    })) as PostWithUser[];
  }

  async isPostBookmarked(userId: string, postId: string): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.postId, postId)
      ));

    return !!bookmark;
  }

  // User Profile methods
  async getUserProfile(userId: string, viewerId?: string): Promise<UserProfile | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) return null;

    const stats = await this.getUserStats(userId);
    const followCounts = await this.getFollowCounts(userId);
    
    // Count user's posts
    const [postsResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.userId, userId));

    let isFollowing = false;
    let isFollowingYou = false;

    if (viewerId && viewerId !== userId) {
      isFollowing = await this.isFollowing(viewerId, userId);
      isFollowingYou = await this.isFollowing(userId, viewerId);
    }

    return {
      ...user,
      stats,
      followersCount: followCounts.followersCount,
      followingCount: followCounts.followingCount,
      postsCount: postsResult?.count || 0,
      isFollowing,
      isFollowingYou,
    };
  }

  async updateUserOnlineStatus(userId: string, online: boolean): Promise<void> {
    await db
      .update(users)
      .set({
        online,
        lastActivity: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async searchUsers(query: string, limit: number = 20): Promise<UserProfile[]> {
    const result = await db
      .select()
      .from(users)
      .where(or(
        like(users.username, `%${query}%`),
        like(users.displayName, `%${query}%`)
      ))
      .limit(limit);

    return result as UserProfile[];
  }
}

export const storage = new DatabaseStorage();
