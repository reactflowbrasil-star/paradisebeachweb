
-- Enums
DO $$ BEGIN
  CREATE TYPE public.property_type AS ENUM ('casa', 'villa', 'apartamento', 'terreno');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.listing_type AS ENUM ('venda', 'aluguel');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.property_status AS ENUM ('disponivel', 'vendido', 'alugado');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.reservation_status AS ENUM ('confirmada', 'pendente', 'cancelada');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type property_type NOT NULL DEFAULT 'casa',
  listing listing_type NOT NULL DEFAULT 'venda',
  price NUMERIC NOT NULL DEFAULT 0,
  price_label TEXT,
  location TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  area NUMERIC NOT NULL DEFAULT 0,
  ocean_view BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  status property_status NOT NULL DEFAULT 'disponivel',
  amenities TEXT[] NOT NULL DEFAULT '{}',
  lat NUMERIC,
  lng NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Property photos table
CREATE TABLE IF NOT EXISTS public.property_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT true,
  cover BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  email TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status reservation_status NOT NULL DEFAULT 'pendente',
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Properties: public read, authenticated write
DO $$ BEGIN
  CREATE POLICY "Anyone can view properties" ON public.properties FOR SELECT USING (true);
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert properties" ON public.properties FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update properties" ON public.properties FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete properties" ON public.properties FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

-- Photos: public read, authenticated write
DO $$ BEGIN
  CREATE POLICY "Anyone can view photos" ON public.property_photos FOR SELECT USING (true);
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert photos" ON public.property_photos FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update photos" ON public.property_photos FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete photos" ON public.property_photos FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

-- Reservations: only authenticated
DO $$ BEGIN
  CREATE POLICY "Authenticated users can view reservations" ON public.reservations FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update reservations" ON public.reservations FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete reservations" ON public.reservations FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_updated_at ON public.reservations;
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for property photos
INSERT INTO storage.buckets (id, name, public) VALUES ('property-photos', 'property-photos', true) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Anyone can view property photos" ON storage.objects FOR SELECT USING (bucket_id = 'property-photos');
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload property photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-photos');
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update property photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'property-photos');
EXCEPTION WHEN duplicate_policy THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete property photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'property-photos');
EXCEPTION WHEN duplicate_policy THEN null;
END $$;
