
-- Storage bucket for job photos
INSERT INTO storage.buckets (id, name, public) VALUES ('job-photos', 'job-photos', true);

-- Storage RLS: business owners can upload/manage photos for their jobs
CREATE POLICY "Business owners can upload job photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT j.id::text FROM jobs j
    JOIN businesses b ON j.business_id = b.id
    WHERE b.owner_id = auth.uid()
  )
);

CREATE POLICY "Business owners can view job photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'job-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT j.id::text FROM jobs j
    JOIN businesses b ON j.business_id = b.id
    WHERE b.owner_id = auth.uid()
  )
);

CREATE POLICY "Business owners can delete job photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'job-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT j.id::text FROM jobs j
    JOIN businesses b ON j.business_id = b.id
    WHERE b.owner_id = auth.uid()
  )
);

CREATE POLICY "Public can view job photos"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'job-photos');

-- Job photos metadata table
CREATE TABLE public.job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  photo_type TEXT NOT NULL DEFAULT 'during' CHECK (photo_type IN ('before', 'during', 'after')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage job photos"
ON public.job_photos FOR ALL TO authenticated
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Job notes table
CREATE TABLE public.job_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage job notes"
ON public.job_notes FOR ALL TO authenticated
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Job checklists table
CREATE TABLE public.job_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage checklist items"
ON public.job_checklist_items FOR ALL TO authenticated
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
