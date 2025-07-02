-- スコアフィールドの制約を緩和（0-10の範囲をサポート）
ALTER TABLE public.businesses 
ALTER COLUMN overall_score TYPE NUMERIC(4,2),
ALTER COLUMN technical_score TYPE NUMERIC(4,2),
ALTER COLUMN eeat_score TYPE NUMERIC(4,2),
ALTER COLUMN content_score TYPE NUMERIC(4,2),
ALTER COLUMN ai_content_score TYPE NUMERIC(4,2),
ALTER COLUMN user_experience_score TYPE NUMERIC(4,2),
ALTER COLUMN seo_score TYPE NUMERIC(4,2);

-- user_businessesテーブルのスコアフィールドも同様に更新
ALTER TABLE public.user_businesses
ALTER COLUMN user_overall_score TYPE NUMERIC(4,2),
ALTER COLUMN user_technical_score TYPE NUMERIC(4,2),
ALTER COLUMN user_eeat_score TYPE NUMERIC(4,2),
ALTER COLUMN user_content_score TYPE NUMERIC(4,2),
ALTER COLUMN user_ai_content_score TYPE NUMERIC(4,2),
ALTER COLUMN user_experience_score TYPE NUMERIC(4,2),
ALTER COLUMN user_seo_score TYPE NUMERIC(4,2);