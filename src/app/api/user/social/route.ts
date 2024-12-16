import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, image, provider, username } = body;

    console.log('Received social login data:', { email, name, image, provider, username });

    // Validate required fields
    if (!email) {
      console.error('Email missing in social login request');
      return NextResponse.json({ 
        success: false, 
        message: "Email is required for social login" 
      }, { status: 400 });
    }

    if (!provider) {
      console.error('Provider missing in social login request');
      return NextResponse.json({ 
        success: false, 
        message: "Provider is required for social login" 
      }, { status: 400 });
    }

    // Save basic user data first
    if (!redis) {
      console.error('Redis client not initialized');
      throw new Error('Redis client not initialized');
    }

    try {
      // Generate a username if not provided
      const finalUsername = username || email.split('@')[0];
      
      // Check if user already exists
      const userExists = await redis.checkUserExists(email, finalUsername);
      if (userExists) {
        console.log('User already exists, updating social data');
        // Get existing user ID
        const emailKey = `email:${email}`;
        const userId = await redis.get(emailKey);
        if (!userId) {
          throw new Error('User exists but ID not found');
        }

        // Update social account data
        await redis.saveUserSocialData(userId, provider, {
          email,
          name,
          image,
          username: finalUsername,
        });

        return NextResponse.json({ 
          success: true, 
          userId,
          message: "Social account linked successfully",
          exists: true
        });
      }

      // Create new user
      const userId = await redis.saveUserData({
        email,
        username: finalUsername,
        password: '', // social login doesn't need password
        name: name || '',
      });

      console.log('User data saved successfully:', { userId });

      // Save social account data
      await redis.saveUserSocialData(userId, provider, {
        email,
        name,
        image,
        username: finalUsername,
      });

      console.log('Social data saved successfully');

      return NextResponse.json({ 
        success: true, 
        userId,
        message: "User created and social account linked successfully",
        exists: false
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error in social login:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to store social user data" 
    }, { status: 500 });
  }
}
