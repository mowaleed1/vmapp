export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full p-8 border rounded-lg bg-card text-card-foreground shadow-sm text-center">
                <h1 className="text-2xl font-bold mb-4">Login to VMApp</h1>
                <p className="text-muted-foreground mb-8">Authentication is not yet configured.</p>
                <p className="text-sm">Please set up your Supabase project credentials in `.env.local` to proceed.</p>
            </div>
        </div>
    )
}
