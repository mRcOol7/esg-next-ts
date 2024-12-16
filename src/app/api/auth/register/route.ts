import { NextResponse } from 'next/server';
import { saveUserToTiDB, checkUserExistsInTiDB } from '@/lib/tidb';
import { redis } from '@/lib/redis';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, username, password } = body;

        if (!email || !username || !password) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user exists in both Redis and TiDB
        const [tidbUserExists, redisUserExists] = await Promise.all([
            checkUserExistsInTiDB(email, username),
            redis?.checkUserExists(email, username)
        ]);

        if (tidbUserExists || redisUserExists) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 409 }
            );
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user to both TiDB and Redis
        const userData = {
            id: username, // Using username as ID for now
            email,
            username,
            password: hashedPassword
        };

        try {
            await Promise.all([
                saveUserToTiDB(userData),
                redis?.saveUserData(userData)
            ]);
        } catch (saveError) {
            console.error('Error saving user data:', saveError);
            return NextResponse.json(
                { error: 'Failed to save user data' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'User registered successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
