BEGIN;
CREATE TABLE public.profiles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 input jsonb NOT NULL CHECK (jsonb_typeof(input)='object'),
 input_revision integer NOT NULL DEFAULT 1 CHECK(input_revision>0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
CREATE POLICY owner_read ON public.profiles FOR SELECT TO authenticated USING ((SELECT auth.uid())=user_id);
COMMENT ON TABLE public.profiles IS 'Private inputs; API validates and performs compare-and-swap writes.';
COMMIT;
