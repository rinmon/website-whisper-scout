
export interface WebsiteAnalysis {
  id: string;
  business_id: string;
  overall_score: number;
  technical_score: number;
  content_score: number;
  user_experience_score: number;
  seo_score: number;
  performance_score: number;
  accessibility_score: number;
  security_score: number;
  mobile_compatibility: boolean;
  ssl_certificate: boolean;
  page_speed: number;
  recommendations: string[];
  analyzed_at: string;
  created_at: string;
  updated_at: string;
}
