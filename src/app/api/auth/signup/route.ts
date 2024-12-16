import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { hash } from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password } = body;

    // Check if user exists
    if (redis) {
      const userExists = await redis.checkUserExists(email, username);
      if (userExists) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await hash(password, 10);

      // Save user data
      const userId = await redis.saveUserData({
        email,
        username,
        password: hashedPassword,
      });

      return NextResponse.json(
        { message: 'User created successfully', userId },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: 'Redis client not available' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
