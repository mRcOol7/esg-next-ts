import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getUserFromTiDB } from '@/lib/db';

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: Context) {
  try {
    const params = await context.params;
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!redis) {
      return NextResponse.json(
        { error: 'Redis client not initialized' },
        { status: 500 }
      );
    }

    // 1. Try to get from Redis cache first
    const cachedUser = await redis.getCachedUser(id);
    if (cachedUser) {
      return NextResponse.json(cachedUser);
    }

    // 2. If not in cache, get from TiDB
    const user = await getUserFromTiDB(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Cache the user data for future requests
    await redis.cacheUserData(id, {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      image: user.image,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}