import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { saveSocialProviderToTiDB, saveUserToTiDB, checkUserExistsInTiDB } from "@/lib/tidb";
import crypto from 'crypto';

export async function POST(req: Request) {
  console.log(' [Social API] Received request');
  
  try {
    const body = await req.json();
    console.log(' [Social API] Request body:', JSON.stringify(body, null, 2));

    const { provider, socialData } = body;
    
    const {
      id: providerAccountId,
      email,
      name,
      image,
      accessToken,
      refreshToken
    } = socialData;

    // Data validation with detailed logging
    const validationErrors = [];
    if (!provider) validationErrors.push('Provider is required');
    if (!providerAccountId) validationErrors.push('Provider Account ID is required');
    
    // Make email validation conditional based on provider
    if (provider !== 'twitter' && !email) {
      validationErrors.push('Email is required');
    }

    if (validationErrors.length > 0) {
      console.error(' [Social API] Validation errors:', validationErrors);
      return NextResponse.json({ 
        success: false, 
        message: "Validation failed", 
        errors: validationErrors 
      }, { status: 400 });
    }

    // Generate a username if not provided
    const finalUsername = socialData.username || name || (email ? email.split('@')[0] : `${provider}_${providerAccountId}`);
    console.log(' [Social API] Final username:', finalUsername);
    
    try {
      console.log(' [Social API] Checking if user exists...');
      const userExists = await checkUserExistsInTiDB(email, finalUsername);
      
      let userId;
      if (userExists) {
        console.log(' [Social API] User exists, retrieving data...');
        const emailKey = email ? `email:${email}` : `username:${finalUsername}`;
        userId = await redis.get(emailKey);
        
        if (!userId) {
          console.error(' [Social API] User exists but ID not found in Redis');
          return NextResponse.json({ 
            success: false, 
            message: "User data inconsistency detected" 
          }, { status: 500 });
        }
      } else {
        console.log(' [Social API] Creating new user...');
        userId = crypto.randomUUID();
        
        // Save to TiDB
        await saveUserToTiDB({
          id: userId,
          email: email || null,
          username: finalUsername,
          name: name || finalUsername,
          image
        });

        // Save social provider data
        await saveSocialProviderToTiDB({
          id: crypto.randomUUID(),
          user_id: userId,
          provider,
          provider_user_id: providerAccountId,
          provider_email: email || null,
          provider_username: finalUsername,
          provider_name: name || finalUsername,
          provider_image: image,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        });
        
        // Save to Redis
        if (email) {
          const emailKey = `email:${email}`;
          await redis.set(emailKey, userId);
        }
        const usernameKey = `username:${finalUsername}`;
        await redis.set(usernameKey, userId);
        
        await redis.hset(`user:${userId}`, {
          email: email || '',
          username: finalUsername,
          name: name || finalUsername,
          image: image || '',
          created_at: new Date().toISOString()
        });
      }

      console.log(' [Social API] Saving social provider data...');
      // Save social provider data to TiDB
      const socialProviderId = await saveSocialProviderToTiDB({
        user_id: userId,
        provider: provider,
        provider_user_id: providerAccountId,
        provider_email: email,
        provider_name: name,
        provider_username: finalUsername,
        provider_image: image,
        access_token: accessToken,
        refresh_token: refreshToken
      });

      // Cache social provider data in Redis
      const socialKey = `social:${userId}:${provider}`;
      await redis.hset(socialKey, {
        id: socialProviderId,
        provider: provider,
        provider_user_id: providerAccountId,
        email,
        name: name || '',
        image: image || '',
        username: finalUsername,
        access_token: accessToken || '',
        refresh_token: refreshToken || '',
        updated_at: new Date().toISOString()
      });

      console.log(' [Social API] Social login successful');
      return NextResponse.json({ 
        success: true, 
        message: "Social login successful",
        userId,
        profile: {
          email,
          name: name || finalUsername,
          image: image || '',
          username: finalUsername
        }
      });

    } catch (error) {
      console.error(' [Social API] Database error:', error);
      return NextResponse.json({ 
        success: false, 
        message: "Error processing social login",
        error: error instanceof Error ? error.message : "Unknown error"
      }, { status: 500 });
    }

  } catch (error) {
    console.error(' [Social API] Request parsing error:', error);
    return NextResponse.json({ 
      success: false, 
      message: "Invalid request data",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 400 });
  }
}
