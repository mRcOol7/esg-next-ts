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
    console.log(`Attempting to create user: ${username} (${email})`);

    // Check if user exists
    if (redis) {
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
      
      const userId = await saveUserToTiDB(userData);
      console.log(`User successfully saved to TiDB with ID: ${userId}`);

      // 2. Cache the user data in Redis
      if (redis) {
        console.log('Caching user data in Redis');
        const cacheData: RedisUserData = {
          id: userId,
          email,
          username,
          createdAt: userData.createdAt,
        };
        await redis.cacheUserData(userId, cacheData);
        console.log('User data successfully cached in Redis');
      }

      console.log('User signup process completed successfully');
      return NextResponse.json({ 
        message: 'User created successfully',
        userId 
      }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Redis client not initialized' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
