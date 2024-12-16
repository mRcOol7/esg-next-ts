import { NextResponse, NextRequest } from 'next/server'
import { saveUserSocialData, saveUserData } from '@/lib/redis'
import { getToken } from 'next-auth/jwt'

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token) {
      console.error('❌ Authentication token missing');
      return new NextResponse('Unauthorized: Authentication token missing', { status: 401 })
    }

    const data = await req.json()
    const userId = token.sub as string

    if (!userId) {
      console.error('❌ User ID missing from token');
      return NextResponse.json({ error: 'Invalid user token' }, { status: 400 })
    }

    if (data.provider) {
      // Social data save
      console.log('📝 Attempting to save social data:', { 
        userId, 
        provider: data.provider
      });

      if (!data.provider || typeof data.provider !== 'string') {
        return NextResponse.json({ 
          error: 'Invalid provider specified' 
        }, { status: 400 });
      }

      try {
        const result = await saveUserSocialData(userId, data.provider, {
          id: data.id,
          name: data.name,
          email: data.email,
          image: data.image,
          username: data.username,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          ...data.providerData // Any additional provider-specific data
        });

        return NextResponse.json({ 
          message: 'Social profile data saved successfully',
          provider: data.provider,
          data: result.data,
          success: result.success
        }, { status: 200 });
      } catch (error) {
        console.error('❌ Failed to save social data:', { 
          userId, 
          provider: data.provider,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return NextResponse.json({ 
          error: error instanceof Error ? error.message : 'Failed to save social profile data',
          provider: data.provider
        }, { status: 400 })
      }
    } else {
      // Manual data save
      console.log('📝 Attempting to save user data:', { 
        userId,
        email: data.email 
      });

      // Fix: Pass only the `data` object to `saveUserData`
      await saveUserData(data)
      return NextResponse.json({ 
        message: 'User data saved successfully' 
      }, { status: 200 })
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('❌ API Error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 })
  }
}