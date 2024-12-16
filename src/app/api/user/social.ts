import { NextResponse, NextRequest } from 'next/server';
import { saveUserSocialData, saveUserData, redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { userId, provider, socialData } = await req.json();

    // Validate required fields
    if (!userId || !provider || !socialData) {
      return NextResponse.json({ error: 'Invalid request: Missing required fields' }, { status: 400 });
    }

    // Log the incoming data for debugging
    console.log('📝 Received social sign-in data:', {
      userId,
      provider,
      email: socialData.email,
      name: socialData.name,
    });

    // Check if Redis is available
    if (!redis) {
      console.error('Redis client is not initialized');
      return NextResponse.json({ error: 'Internal server error: Database not available' }, { status: 500 });
    }

    // Check if user exists, if not create them
    const existingUser = await redis.getUserData(userId);
    if (!existingUser || Object.keys(existingUser).length === 0) {
      console.log('👤 Creating new user in Redis:', {
        id: userId,
        email: socialData.email,
        name: socialData.name,
      });
      // Create new user with social data
      await saveUserData({
        id: userId,
        email: socialData.email,
        name: socialData.name,
        username: socialData.username || socialData.email?.split('@')[0] || '',
        image: socialData.image,
        provider: provider,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
    }

    // Process and save social sign-up data to Redis
    console.log('🔄 Processing social data for Redis storage');
    const processedSocialData = {
      id: socialData.id,
      name: socialData.name,
      email: socialData.email,
      image: socialData.image,
      username: socialData.username || socialData.email?.split('@')[0],
      accessToken: socialData.accessToken,
      refreshToken: socialData.refreshToken,
      provider: provider,
      providerData: socialData.providerData ? JSON.stringify(socialData.providerData) : undefined,
    };

    // Save social sign-up data to Redis
    const result = await saveUserSocialData(userId, provider, processedSocialData);
    console.log('✅ Social data saved successfully:', {
      userId,
      provider,
      result: result.data
    });

    // Return success response with the saved data
    return NextResponse.json({ 
      message: 'Social sign-up data saved successfully',
      data: result.data 
    }, { status: 200 });

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error saving social sign-up data:', error.message);
    } else {
      console.error('An unknown error occurred');
    }

    // Return a generic error response
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
