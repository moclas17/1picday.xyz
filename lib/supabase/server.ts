import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createClient() {
    // We use the Service Role Key to bypass RLS since we are managing Auth via MagicLink + Custom Session.
    // We must ensure all queries are manually filtered by user_id from the session.
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}
