-- Create a reusable function to update the updated_at timestamp
-- This function can be used by multiple tables
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

-- Create trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to update the parent chat_session when a message is added
CREATE OR REPLACE FUNCTION public.update_chat_session_on_message()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    -- Update the parent session's timestamp
    UPDATE public.chat_sessions
    SET updated_at = now()
    WHERE id = NEW.session_id;
    
    -- Always return NEW for AFTER INSERT triggers
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update chat_session when a message is inserted
CREATE TRIGGER update_session_on_message_insert
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_chat_session_on_message();

-- Add comments explaining the trigger behavior
COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Automatically updates the updated_at column to the current timestamp when a row is modified.';

COMMENT ON FUNCTION public.update_chat_session_on_message() IS 
'Updates the parent chat_session updated_at timestamp when a new message is added to the session.';
