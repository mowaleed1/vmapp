'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'

export async function updateUserRole(userId: string, newRoleId: string) {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: "Unauthorized access." }
    }

    // Call securely elevated Postgres Function
    const { error: rpcError } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role_id: newRoleId
    })

    if (rpcError) {
        console.error('Supabase RPC failed:', rpcError)
        return { success: false, error: rpcError.message }
    }

    return { success: true }
}
