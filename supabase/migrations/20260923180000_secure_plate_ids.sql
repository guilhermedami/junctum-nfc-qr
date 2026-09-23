-- Generate unpredictable public identifiers for future plates. Existing printed URLs stay valid.
CREATE OR REPLACE FUNCTION public.generate_public_id()
RETURNS TEXT LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT substr(replace(gen_random_uuid()::text, '-', ''), 1, 20)
$$;
