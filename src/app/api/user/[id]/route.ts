import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getUserFromTiDB } from '@/lib/db';
import { corsHeaders, handleCORS } from '@/lib/cors';

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCORS(NextResponse.json({}));
  }

  try {
    const params = await context.params;
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!redis) {
      return NextResponse.json(
        { error: 'Redis client not initialized' },
        { status: 500, headers: corsHeaders }
      );
    }

    // 1. Try to get from Redis cache first
    const cachedUser = await redis.getCachedUser(id);
    if (cachedUser) {
      return NextResponse.json(cachedUser, { headers: corsHeaders });
    }

    // 2. If not in cache, get from TiDB
    const user = await getUserFromTiDB(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
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

    return NextResponse.json(user, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}