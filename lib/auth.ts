import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { magicAdmin } from './magic-server';
import { createClient } from '@supabase/supabase-js';

const secret = new TextEncoder().encode(process.env.MAGIC_SECRET_KEY || 'default-secret-key-change-me');

export async function createSession(didToken: string) {
    const metadata = await magicAdmin.users.getMetadataByToken(didToken);
    console.log('Magic Metadata:', metadata);

    if (!metadata.email) {
        throw new Error('Email is required');
    }

    // Sync with Supabase
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user exists in profiles or auth
    // We can try to find by email in profiles first, if linked
    let userId = '';

    // 1. Check Auth Users (using Admin)
    // There isn't a direct "getUserByEmail" in admin API easily exposed without generic "listUsers", 
    // but we can try to "invite" or just rely on our profiles table if we are drifting from Auth.
    // BETTER: Select from profiles.
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', metadata.email)
        .single();

    if (profile) {
        userId = profile.id;
    } else {
        // Create new user in Supabase Auth to generate a valid UUID and keep constraints happy
        // We use admin.createUser
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: metadata.email,
            email_confirm: true,
            user_metadata: { magic_issuer: metadata.issuer }
        });

        if (createError) {
            console.log('User might already exist, attempting lookup...');

            // Fallback: List users and filter by email
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

            if (listError) {
                console.error('List Users Error:', listError);
                throw new Error('Failed to create or find user record');
            }

            const existingUser = users.find(u => u.email === metadata.email);
            if (existingUser) {
                userId = existingUser.id;
                // Optional: Ensure profile exists?
                const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
                    id: userId,
                    email: metadata.email,
                }).select();

                if (profileError) console.error('Profile Upsert Error:', profileError);

            } else {
                console.error('User creation failed but user not found in list.', createError);
                throw new Error('Failed to create user record: ' + createError.message);
            }
        } else if (newUser && newUser.user) {
            userId = newUser.user.id;
        }
    }

    if (!userId) throw new Error('Could not resolve User ID');

    // Create JWT Session
    const token = await new SignJWT({ userId, email: metadata.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });

    return userId;
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as { userId: string; email: string };
    } catch (err) {
        return null;
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('session_token');
    // Optional: Magic Logout server side?
}
