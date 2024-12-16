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
    const userDataObj = {
      id: userData.id || userId,
      email: userData.email,
      username: userData.username,
      password: userData.password
    };
    
    // Create unique keys for email and username lookups
    const emailKey = `email:${userData.email}`;
    const usernameKey = `username:${userData.username}`;
    
    // Use multi to ensure atomic operation
    const multi = this.multi();
    multi.hmset(`users:${userId}`, userDataObj);
    multi.set(emailKey, userId);
    multi.set(usernameKey, userId);
    
    await multi.exec();
    return userId;
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

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not defined');
}

// Only initialize Redis client on the server side
const redis = (typeof window === 'undefined') ? new CustomRedis(process.env.REDIS_URL!, {
  retryStrategy: (times) => Math.min(times * 50, 3000),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
}) : null;

if (redis) {
  redis.on('error', (err) => console.error('Redis Client Error:', err));
  redis.on('connect', () => console.log('Successfully connected to Redis'));
}

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