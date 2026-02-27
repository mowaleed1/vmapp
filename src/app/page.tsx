import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from('users').select('role:roles(name)').eq('id', user.id).single()
    const roleData = profile?.role as any
    const currentRoleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name

    if (currentRoleName === 'user') {
      redirect('/dashboard/user')
    } else {
      redirect('/dashboard/agent')
    }
  } else {
    redirect('/login')
  }
}
