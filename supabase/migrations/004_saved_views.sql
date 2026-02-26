-- Migration: 004_saved_views
-- Description: Creates the saved_views table to store user-defined ticket filter combinations.

CREATE TABLE IF NOT EXISTS public.saved_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own saved views"
    ON public.saved_views FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own saved views"
    ON public.saved_views FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved views"
    ON public.saved_views FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved views"
    ON public.saved_views FOR DELETE
    USING (auth.uid() = user_id);
