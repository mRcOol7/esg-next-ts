import Redis from 'ioredis';

interface UserData {
  [key: string]: string | undefined;
  id?: string;
  email: string;
  username: string;
  password?: string;
  provider?: string;
  image?: string;
  createdAt?: string;
  lastLogin?: string;
}

interface SocialData {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  username?: string;
  accessToken?: string;
  refreshToken?: string;
  [key: string]: string | undefined;
}

class CustomRedis extends Redis {
  async generateUserId(): Promise<string> {
    const nextId = await this.incr('next_user_id');
    return `user:${nextId}`;
  }

  async checkUserExists(email: string, username: string): Promise<boolean> {
    const emailKey = `email:${email}`;
    const usernameKey = `username:${username}`;
    const [emailExists, usernameExists] = await Promise.all([
      this.exists(emailKey),
      this.exists(usernameKey)
    ]);
    return emailExists === 1 || usernameExists === 1;
  }

  async saveUserData(userData: UserData): Promise<string> {
    const userId = await this.generateUserId();
    const userKey = `user:${userId}`;
    await this.hset(userKey, userData);
    return userKey;
  }

  async cacheUserData(userId: string, userData: UserData): Promise<void> {
    try {
      console.log(`[Redis Cache] Attempting to cache data for user: ${userId}`);
      const key = `user:${userId}`;
      const startTime = Date.now();
      await this.set(key, JSON.stringify(userData), 'EX', 3600); // Cache for 1 hour
      const duration = Date.now() - startTime;
      console.log(`[Redis Cache] Successfully cached user data. Key: ${key}, Duration: ${duration}ms`);
      console.log(`[Redis Cache] Cache TTL set to 1 hour`);
    } catch (error) {
      console.error('[Redis Cache] Error caching user data:', error);
      throw error;
    }
  }

  async getCachedUser(userId: string): Promise<UserData | null> {
    try {
      console.log(`[Redis Cache] Attempting to retrieve cached data for user: ${userId}`);
      const key = `user:${userId}`;
      const startTime = Date.now();
      const cachedData = await this.get(key);
      const duration = Date.now() - startTime;
      
      if (cachedData) {
        console.log(`[Redis Cache] Cache HIT. Key: ${key}, Duration: ${duration}ms`);
        return JSON.parse(cachedData);
      } else {
        console.log(`[Redis Cache] Cache MISS. Key: ${key}, Duration: ${duration}ms`);
        return null;
      }
    } catch (error) {
      console.error('[Redis Cache] Error retrieving cached user:', error);
      return null;
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    try {
      console.log(`[Redis Cache] Attempting to invalidate cache for user: ${userId}`);
      const key = `user:${userId}`;
      const startTime = Date.now();
      await this.del(key);
      const duration = Date.now() - startTime;
      console.log(`[Redis Cache] Successfully invalidated cache. Key: ${key}, Duration: ${duration}ms`);
    } catch (error) {
      console.error('[Redis Cache] Error invalidating user cache:', error);
      throw error;
    }
  }

  async getUserData(userId: string) {
    return this.hgetall(`users:${userId}`);
  }

  async saveUserSocialData(userId: string, provider: string, socialData: SocialData) {
    const socialDataObj = {
      id: socialData.id || '',
      name: socialData.name || '',
      email: socialData.email || '',
      image: socialData.image || '',
      username: socialData.username || '',
      accessToken: socialData.accessToken || '',
      refreshToken: socialData.refreshToken || ''
    };
    await this.hmset(`users:${userId}:social:${provider}`, socialDataObj);
  }

  async getUserSocialAccounts(userId: string) {
    // Implementation for getting user's social accounts
    const pattern = `users:${userId}:social:*`;
    const keys = await this.keys(pattern);
    const accounts = await Promise.all(
      keys.map(async (key) => {
        const data = await this.hgetall(key);
        const provider = key.split(':').pop();
        return { provider, ...data };
      })
    );
    return accounts;
  }
}

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_PASSWORD) {
  throw new Error('Redis configuration is incomplete. Please check your environment variables.');
}

//redis
const redis = new CustomRedis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
  connectionName: process.env.REDIS_DB_NAME || 'Nehal-free-db',
  tls: {
    rejectUnauthorized: false,
    servername: process.env.REDIS_HOST
  }
});

// Add connection event handlers
redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('Connected to Redis successfully');
});

redis.on('ready', () => {
  console.log('Redis client is ready');
});

// Test the connection
redis.ping().then(() => {
  console.log('Redis connection test successful');
}).catch((error) => {
  console.error('Redis connection test failed:', error);
});

export async function saveUserSocialData(userId: string, provider: string, socialData: SocialData) {
  if (redis) {
    const socialDataObj = {
      id: socialData.id || '',
      name: socialData.name || '',
      email: socialData.email || '',
      image: socialData.image || '',
      username: socialData.username || '',
      accessToken: socialData.accessToken || '',
      refreshToken: socialData.refreshToken || ''
    };
    await redis.hmset(`users:${userId}:social:${provider}`, socialDataObj);
    return { success: true, data: socialDataObj };
  }
  throw new Error('Redis client is not initialized');
}

export async function saveUserData(userData: UserData): Promise<string> {
  if (!redis) {
    throw new Error('Redis client not initialized');
  }
  return redis.saveUserData(userData);
}

export { redis, type UserData, type SocialData };