-- Create ENUM for message roles
CREATE TYPE public.message_role AS ENUM ('user', 'assistant', 'system', 'tool');

-- Create Chat Sessions Table
CREATE TABLE public.chat_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_sessions_pkey PRIMARY KEY (id)
);

-- Create Chat Messages Table
CREATE TABLE public.chat_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL,
    role public.message_role NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
    CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies

-- Allow anyone to create a chat session (Anonymous + Authenticated)
CREATE POLICY "Enable insert for all users" ON public.chat_sessions
    FOR INSERT WITH CHECK (true);

-- Allow users to view their own sessions
CREATE POLICY "Enable select for owners" ON public.chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Allow anyone to add messages to a session (Anonymous + Authenticated)
CREATE POLICY "Enable insert for all users" ON public.chat_messages
    FOR INSERT WITH CHECK (true);

-- Allow users to view messages from their own sessions
CREATE POLICY "Enable select for owners" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE id = chat_messages.session_id
            AND user_id = auth.uid()
        )
    );
