export interface Business {
  id: string; // UUIDはstringとして扱う
  user_id: string; // どのユーザーのデータかを示すFK
  name: string;
  industry?: string;
  location?: string;
  website_url?: string;
  has_website?: boolean;
  overall_score?: number;
  technical_score?: number;
  eeat_score?: number;
  content_score?: number;
  ai_content_score?: number;
  user_experience_score?: number;
  seo_score?: number;
  phone?: string;
  phone_number?: string;
  address?: string;
  established_year?: number;
  establishment_date?: string;
  employee_count?: string;
  number_of_employees?: string;
  capital?: string;
  description?: string;
  catch_copy?: string;
  last_analyzed?: string;
  is_new?: boolean;
  data_source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessAnalysis {
  id?: string;
  business_id: string; // BusinessテーブルへのFK
  analyzed_at: string;
  overall_score: number;
  recommendations?: string[];
  technical_details?: {
    page_speed?: number;
    mobile_friendly?: boolean;
    ssl_certificate?: boolean;
    meta_tags_complete?: boolean;
    structured_data?: boolean;
  };
  content_analysis?: {
    readability_score?: number;
    word_count?: number;
    keyword_density?: number;
    ai_generated_content_ratio?: number;
  };
  eeat_factors?: {
    has_author_info?: boolean;
    has_contact_info?: boolean;
    has_about_us_page?: boolean;
    has_privacy_policy?: boolean;
    has_terms_of_service?: boolean;
  };
}

// Supabaseへの保存・更新時に使用するペイロードの型定義
// DBが自動生成するカラムや、サーバー側で付与するuser_idは除外
export interface BusinessPayload {
  name: string;
  industry?: string;
  location?: string;
  website_url?: string;
  has_website?: boolean;
  overall_score?: number;
  technical_score?: number;
  eeat_score?: number;
  content_score?: number;
  ai_content_score?: number;
  user_experience_score?: number;
  seo_score?: number;
  phone?: string;
  phone_number?: string;
  address?: string;
  established_year?: number;
  establishment_date?: string;
  employee_count?: string;
  number_of_employees?: string;
  capital?: string;
  description?: string;
  catch_copy?: string;
  last_analyzed?: string;
  is_new?: boolean;
  data_source?: string;
}
