-- Check if chalans table exists in the publication before adding it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'chalans'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chalans;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'chalan_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chalan_items;
  END IF;
END $$;
