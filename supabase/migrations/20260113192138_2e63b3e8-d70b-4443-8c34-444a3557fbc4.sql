-- Confirmar email da usuária Claudia Mirim manualmente
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE id = 'eb279f01-a7a6-448f-837f-22c5bd95c75b';