
export interface Business {
  id: string; // UUIDはstringとして扱う
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
  user_experience_score?: number; // 追加
  seo_score?: number; // 追加
  phone?: string;
  phone_number?: string; // 追加（別名）
  address?: string;
  established_year?: number;
  establishment_date?: string; // 追加
  employee_count?: string;
  number_of_employees?: string; // 追加（別名）
  capital?: string;
  description?: string;
  catch_copy?: string; // 追加
  last_analyzed?: string;
  is_new?: boolean;
  data_source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessAnalysis {
  id?: string;
  business_id: string; // UUIDはstringとして扱う
  analysis_date: string;
  technical_details?: {
    page_speed?: number;
    mobile_friendly?: boolean;
    ssl_certificate?: boolean;
    meta_tags_complete?: boolean;
    structured_data?: boolean;
  };
  content_analysis?: {
    text_quality?: number;
    readability_score?: number;
    keyword_density?: number;
    content_length?: number;
  };
  eeat_factors?: {
    contact_info?: boolean;
    about_page?: boolean;
    privacy_policy?: boolean;
    terms_of_service?: boolean;
    social_media_links?: boolean;
  };
}
