import { NextRequest, NextResponse } from 'next/server';
import { redis, type UserData as RedisUserData } from '@/lib/redis';
import { hash } from 'bcrypt';
import { saveUserToTiDB } from '@/lib/db';
import type { UserData as DBUserData } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    console.log('Starting user signup process');
    const body = await req.json();
    const { email, username, password } = body;

    // Input validation
    if (!email || !username || !password) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`Attempting to create user: ${username} (${email})`);

    // Check Redis client
    if (!redis) {
      console.error('Redis client not initialized');
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Check if user exists
    console.log('Checking if user already exists in Redis');
    const userExists = await redis.checkUserExists(email, username);
    if (userExists) {
      console.log('User already exists, signup rejected');
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    console.log('Hashing password');
    const hashedPassword = await hash(password, 10);

    // 1. Save to TiDB first
    console.log('Saving user data to TiDB');
    const userData: DBUserData = {
      email,
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };
    
    let userId;
    try {
      userId = await saveUserToTiDB(userData);
      console.log(`User successfully saved to TiDB with ID: ${userId}`);
    } catch (dbError) {
      console.error('Error saving to TiDB:', dbError);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }

    // 2. Cache the user data in Redis
    try {
      console.log('Caching user data in Redis');
      const cacheData: RedisUserData = {
        id: userId,
        email,
        username,
        createdAt: userData.createdAt,
      };
      await redis.cacheUserData(userId, cacheData);
      console.log('User data successfully cached in Redis');
    } catch (cacheError) {
      console.error('Error caching in Redis:', cacheError);
      // Continue even if caching fails
    }

    console.log('User signup process completed successfully');
    return NextResponse.json({ 
      message: 'User created successfully',
      userId 
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
