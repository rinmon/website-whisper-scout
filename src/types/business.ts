
export interface Business {
  id: number;
  name: string;
  industry: string;
  location: string;
  website_url: string | null;
  has_website: boolean;
  overall_score: number;
  technical_score: number;
  eeat_score: number;
  content_score: number;
  ai_content_score: number | null;
  phone?: string;
  address?: string;
  established_year?: number;
  employee_count?: string;
  capital?: string;
  description?: string;
  last_analyzed?: string;
}

export interface BusinessAnalysis {
  business_id: number;
  analysis_date: string;
  technical_details: {
    page_speed: number;
    mobile_friendly: boolean;
    ssl_certificate: boolean;
    meta_tags_complete: boolean;
    structured_data: boolean;
  };
  content_analysis: {
    text_quality: number;
    readability_score: number;
    keyword_density: number;
    content_length: number;
  };
  eeat_factors: {
    contact_info: boolean;
    about_page: boolean;
    privacy_policy: boolean;
    terms_of_service: boolean;
    social_media_links: boolean;
  };
}

export interface DataSource {
  name: string;
  url: string;
  type: 'csv' | 'json' | 'api' | 'scrape';
  last_updated: string;
  total_records: number;
}
