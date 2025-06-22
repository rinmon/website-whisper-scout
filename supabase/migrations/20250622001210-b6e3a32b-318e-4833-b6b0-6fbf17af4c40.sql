
-- 企業データを格納するメインテーブル
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  location TEXT,
  website_url TEXT,
  has_website BOOLEAN DEFAULT false,
  overall_score DECIMAL(3,2) DEFAULT 0,
  technical_score DECIMAL(3,2) DEFAULT 0,
  eeat_score DECIMAL(3,2) DEFAULT 0,
  content_score DECIMAL(3,2) DEFAULT 0,
  ai_content_score DECIMAL(3,2),
  phone TEXT,
  address TEXT,
  established_year INTEGER,
  employee_count TEXT,
  capital TEXT,
  description TEXT,
  last_analyzed TIMESTAMP WITH TIME ZONE,
  is_new BOOLEAN DEFAULT true,
  data_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 企業分析詳細データテーブル
CREATE TABLE public.business_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  technical_details JSONB,
  content_analysis JSONB,
  eeat_factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- データソース管理テーブル
CREATE TABLE public.data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('csv', 'json', 'api', 'scrape', 'mock', 'document', 'catalog')),
  last_updated TIMESTAMP WITH TIME ZONE,
  total_records INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ユーザープロファイルテーブル
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS (Row Level Security) を有効化
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 企業データは認証されたユーザーなら誰でも閲覧可能
CREATE POLICY "Anyone can view businesses" ON public.businesses
  FOR SELECT USING (true);

-- 企業データの作成・更新は認証されたユーザーのみ
CREATE POLICY "Authenticated users can insert businesses" ON public.businesses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update businesses" ON public.businesses
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 分析データも同様
CREATE POLICY "Anyone can view analyses" ON public.business_analyses
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage analyses" ON public.business_analyses
  FOR ALL USING (auth.role() = 'authenticated');

-- データソースはadminのみが管理
CREATE POLICY "Anyone can view data sources" ON public.data_sources
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage data sources" ON public.data_sources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- プロファイルは自分のもののみ閲覧・編集可能
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 新規ユーザー登録時にプロファイルを自動作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
