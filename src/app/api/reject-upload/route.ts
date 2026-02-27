import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const { uploadFileId } = await req.json()

        if (!uploadFileId) {
            return NextResponse.json({ error: 'Upload File ID is required' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Check if the user is authorized to reject (admin or agent)
        const { data: profile } = await supabase.from('users').select('role:roles(name)').eq('id', user.id).single()
        const roleData = profile?.role as any
        const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name

        if (roleName === 'user') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Update the upload file status to 'failed' or 'rejected'
        const { error: updateError } = await supabase
            .from('upload_files')
            .update({ status: 'failed' }) // Using 'failed' as the terminal rejection state since we don't have a 'rejected' option in FileStatus type currently
            .eq('id', uploadFileId)

        if (updateError) {
            return NextResponse.json({ error: 'Failed to to reject upload: ' + updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
