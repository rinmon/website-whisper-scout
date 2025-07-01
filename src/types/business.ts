
export interface Business {
  id: string; // UUIDはstringとして扱う
  corporate_number?: string; // 法人番号
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

// ユーザーと企業の関連付けテーブル
export interface UserBusiness {
  id: string;
  user_id: string;
  business_id: string;
  user_overall_score?: number;
  user_technical_score?: number;
  user_eeat_score?: number;
  user_content_score?: number;
  user_ai_content_score?: number;
  user_experience_score?: number;
  user_seo_score?: number;
  user_notes?: string;
  user_tags?: string[];
  is_favorite?: boolean;
  last_user_analyzed?: string;
  added_at: string;
  updated_at: string;
}

// ユーザーの企業データ（Business + UserBusiness の結合）
export interface UserBusinessData extends Business {
  user_business_id?: string;
  user_overall_score?: number;
  user_technical_score?: number;
  user_eeat_score?: number;
  user_content_score?: number;
  user_ai_content_score?: number;
  user_experience_score?: number;
  user_seo_score?: number;
  user_notes?: string;
  user_tags?: string[];
  is_favorite?: boolean;
  last_user_analyzed?: string;
  added_at?: string;
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
// user_id は除外（共有マスターデータのため）
export interface BusinessPayload {
  corporate_number?: string; // 法人番号
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

// ウェブサイト分析結果の型定義
export interface WebsiteAnalysis {
  id: string;
  business_id: string;
  analyzed_at: string;
  lighthouse_score?: any;
  core_web_vitals?: any;
  mobile_friendly?: boolean;
  ssl_certificate?: boolean;
  structured_data?: any;
  meta_tags?: any;
  eeat_factors?: any;
  content_analysis?: any;
  created_at: string;
  updated_at: string;
}

// 営業提案書の型定義
export interface ProposalData {
  basicInfo: {
    companyName: string;
    industry: string;
    location: string;
    websiteUrl?: string;
    hasWebsite: boolean;
    generateDate: string;
  };
  scores: {
    overall: number;
    technical: number;
    eeat: number;
    content: number;
    userExperience: number;
    seo: number;
  };
  improvements: Array<{
    category: string;
    priority: string;
    items: string[];
    expectedImpact: string;
    timeline: string;
  }>;
  competitorAnalysis: {
    summary: string;
    avgScore?: number;
    gap?: number;
    topCompetitors?: Array<{
      name: string;
      score: number;
      strengths: string[];
    }>;
  };
  costBenefit: {
    initialCost: number;
    monthlyCost: number;
    expectedAnnualBenefit: number;
    roi: string;
    paybackPeriod: string | number;
  };
  content: {
    title: string;
    sections: Array<{
      title: string;
      content: string[];
    }>;
  };
  metadata: {
    type: string;
    generatedAt: string;
    version: string;
  };
}

// ユーザー企業関連付けのペイロード
export interface UserBusinessPayload {
  business_id: string;
  user_overall_score?: number;
  user_technical_score?: number;
  user_eeat_score?: number;
  user_content_score?: number;
  user_ai_content_score?: number;
  user_experience_score?: number;
  user_seo_score?: number;
  user_notes?: string;
  user_tags?: string[];
  is_favorite?: boolean;
  last_user_analyzed?: string;
}
