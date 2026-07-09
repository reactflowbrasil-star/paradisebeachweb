
-- Roles infrastructure
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Properties: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can update properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can delete properties" ON public.properties;

CREATE POLICY "Admins can insert properties" ON public.properties
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update properties" ON public.properties
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete properties" ON public.properties
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Property photos: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can insert photos" ON public.property_photos;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON public.property_photos;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON public.property_photos;

CREATE POLICY "Admins can insert photos" ON public.property_photos
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update photos" ON public.property_photos
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete photos" ON public.property_photos
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Reservations: admin-only for all operations
DROP POLICY IF EXISTS "Authenticated users can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can delete reservations" ON public.reservations;

CREATE POLICY "Admins can view reservations" ON public.reservations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert reservations" ON public.reservations
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update reservations" ON public.reservations
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete reservations" ON public.reservations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage: remove broad listing and require admin for writes
DROP POLICY IF EXISTS "Anyone can view property photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update property photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete property photos" ON storage.objects;

CREATE POLICY "Admins can upload property photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update property photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'property-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete property photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-photos' AND public.has_role(auth.uid(), 'admin'));
