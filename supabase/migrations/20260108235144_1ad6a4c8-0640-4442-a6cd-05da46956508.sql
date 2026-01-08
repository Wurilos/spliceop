-- Create a function to auto-confirm admin email on signup
CREATE OR REPLACE FUNCTION public.handle_admin_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_email TEXT := 'sergio.silva@splice.com.br';
BEGIN
  -- If the new user is the admin, set them as admin role
  IF LOWER(NEW.email) = LOWER(admin_email) THEN
    -- Update the user role to admin (the default 'user' role is already created by handle_new_user)
    UPDATE public.user_roles 
    SET role = 'admin' 
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after the main user creation trigger
DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
CREATE TRIGGER on_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_signup();

-- Also update existing admin user if they exist
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE LOWER(email) = 'sergio.silva@splice.com.br'
);