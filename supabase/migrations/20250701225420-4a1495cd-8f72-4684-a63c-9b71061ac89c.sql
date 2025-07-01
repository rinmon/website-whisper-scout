-- Add corporate_number column to businesses table
ALTER TABLE public.businesses 
ADD COLUMN corporate_number VARCHAR UNIQUE;

-- Add index for performance
CREATE INDEX idx_businesses_corporate_number ON public.businesses(corporate_number);

-- Add missing columns for complete website analysis
ALTER TABLE public.businesses 
ADD COLUMN user_experience_score NUMERIC DEFAULT 0,
ADD COLUMN seo_score NUMERIC DEFAULT 0,
ADD COLUMN catch_copy TEXT,
ADD COLUMN establishment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN phone_number TEXT,
ADD COLUMN number_of_employees TEXT;

-- Create website_analysis table for detailed analysis results
CREATE TABLE public.website_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  lighthouse_score JSONB,
  core_web_vitals JSONB,
  mobile_friendly BOOLEAN DEFAULT false,
  ssl_certificate BOOLEAN DEFAULT false,
  structured_data JSONB,
  meta_tags JSONB,
  eeat_factors JSONB,
  content_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on website_analysis
ALTER TABLE public.website_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for website_analysis
CREATE POLICY "Anyone can view website analysis" 
ON public.website_analysis 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage website analysis" 
ON public.website_analysis 
FOR ALL 
USING (auth.role() = 'authenticated'::text);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_website_analysis_updated_at
BEFORE UPDATE ON public.website_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();