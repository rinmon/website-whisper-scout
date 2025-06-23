
-- 1. businessesテーブルからuser_id関連のカラムを削除し、共有マスターデータ化
ALTER TABLE public.businesses DROP COLUMN IF EXISTS user_id;

-- 2. ユーザーと企業の関連付けテーブルを作成
CREATE TABLE public.user_businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  -- ユーザー固有のスコアや分析結果
  user_overall_score DECIMAL(3,2) DEFAULT NULL,
  user_technical_score DECIMAL(3,2) DEFAULT NULL,
  user_eeat_score DECIMAL(3,2) DEFAULT NULL,
  user_content_score DECIMAL(3,2) DEFAULT NULL,
  user_ai_content_score DECIMAL(3,2) DEFAULT NULL,
  user_experience_score DECIMAL(3,2) DEFAULT NULL,
  user_seo_score DECIMAL(3,2) DEFAULT NULL,
  -- ユーザー固有のメタデータ
  user_notes TEXT,
  user_tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  last_user_analyzed TIMESTAMP WITH TIME ZONE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- 一意制約：同一ユーザーが同じ企業を複数回追加できないように
  UNIQUE(user_id, business_id)
);

-- 3. user_businessesテーブルのRLS設定
ALTER TABLE public.user_businesses ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の関連付けデータのみ閲覧可能
CREATE POLICY "Users can view their own business relationships" 
  ON public.user_businesses 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- ユーザーは自分の関連付けデータのみ作成可能
CREATE POLICY "Users can create their own business relationships" 
  ON public.user_businesses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の関連付けデータのみ更新可能
CREATE POLICY "Users can update their own business relationships" 
  ON public.user_businesses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- ユーザーは自分の関連付けデータのみ削除可能
CREATE POLICY "Users can delete their own business relationships" 
  ON public.user_businesses 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 4. businessesテーブルのRLS設定を更新（全ユーザーが参照可能に）
DROP POLICY IF EXISTS "Anyone can view businesses" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can insert businesses" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can update businesses" ON public.businesses;

-- 企業マスターデータは全ユーザーが参照可能
CREATE POLICY "Anyone can view businesses" 
  ON public.businesses 
  FOR SELECT 
  USING (true);

-- 企業マスターデータの追加・更新は認証されたユーザーのみ（データソース機能用）
CREATE POLICY "Authenticated users can manage businesses" 
  ON public.businesses 
  FOR ALL 
  USING (auth.role() = 'authenticated');

-- 5. 更新日時の自動更新トリガー
CREATE TRIGGER update_user_businesses_updated_at 
  BEFORE UPDATE ON public.user_businesses
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
