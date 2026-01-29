-- Create ENUM for message roles
CREATE TYPE public.message_role AS ENUM ('human', 'ai', 'system', 'tool');

-- Create Chat Sessions Table
CREATE TABLE public.chat_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    is_anonymous boolean NOT NULL DEFAULT false,
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
CREATE INDEX idx_chat_sessions_is_anonymous ON public.chat_sessions(is_anonymous);

-- Enable Row Level Security (RLS)
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for chat_sessions
CREATE POLICY "sessions_insert_policy" ON public.chat_sessions
    FOR INSERT WITH CHECK (
        (auth.uid() = user_id) OR 
        (is_anonymous = true AND user_id IS NULL)
    );

CREATE POLICY "sessions_select_policy" ON public.chat_sessions
    FOR SELECT USING (
        (auth.uid() = user_id) OR 
        (is_anonymous = true AND user_id IS NULL) OR
        public.is_admin()
    );

CREATE POLICY "sessions_delete_policy" ON public.chat_sessions
    FOR DELETE USING (
        (auth.uid() = user_id) OR 
        public.is_admin()
    );

-- Policies for chat_messages
CREATE POLICY "messages_insert_policy" ON public.chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE id = chat_messages.session_id
            AND ((user_id = auth.uid()) OR (is_anonymous = true AND user_id IS NULL))
        )
    );

CREATE POLICY "messages_select_policy" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE id = chat_messages.session_id
            AND ((user_id = auth.uid()) OR (is_anonymous = true AND user_id IS NULL))
        ) OR public.is_admin()
    );

CREATE POLICY "messages_delete_policy" ON public.chat_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE id = chat_messages.session_id
            AND (user_id = auth.uid() OR public.is_admin())
        )
    );

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for chat_sessions table
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to update the parent chat_session when a message is added
CREATE OR REPLACE FUNCTION public.update_chat_session_on_message()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    UPDATE public.chat_sessions
    SET updated_at = now()
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update chat_session when a message is inserted
CREATE TRIGGER update_session_on_message_insert
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_chat_session_on_message();

COMMENT ON FUNCTION public.update_chat_session_on_message() IS 
'Updates the parent chat_session updated_at timestamp when a new message is added to the session.';