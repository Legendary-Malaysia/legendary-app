-- Create a reusable function to update the updated_at timestamp
-- This function can be used by multiple tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments explaining the trigger behavior
COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Automatically updates the updated_at column to the current timestamp when a row is modified.';
