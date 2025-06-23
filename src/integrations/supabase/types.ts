export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      business_analyses: {
        Row: {
          analysis_date: string
          business_id: string | null
          content_analysis: Json | null
          created_at: string
          eeat_factors: Json | null
          id: string
          technical_details: Json | null
        }
        Insert: {
          analysis_date?: string
          business_id?: string | null
          content_analysis?: Json | null
          created_at?: string
          eeat_factors?: Json | null
          id?: string
          technical_details?: Json | null
        }
        Update: {
          analysis_date?: string
          business_id?: string | null
          content_analysis?: Json | null
          created_at?: string
          eeat_factors?: Json | null
          id?: string
          technical_details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "business_analyses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          ai_content_score: number | null
          capital: string | null
          content_score: number | null
          created_at: string
          data_source: string | null
          description: string | null
          eeat_score: number | null
          employee_count: string | null
          established_year: number | null
          has_website: boolean | null
          id: string
          industry: string | null
          is_new: boolean | null
          last_analyzed: string | null
          location: string | null
          name: string
          overall_score: number | null
          phone: string | null
          technical_score: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          ai_content_score?: number | null
          capital?: string | null
          content_score?: number | null
          created_at?: string
          data_source?: string | null
          description?: string | null
          eeat_score?: number | null
          employee_count?: string | null
          established_year?: number | null
          has_website?: boolean | null
          id?: string
          industry?: string | null
          is_new?: boolean | null
          last_analyzed?: string | null
          location?: string | null
          name: string
          overall_score?: number | null
          phone?: string | null
          technical_score?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          ai_content_score?: number | null
          capital?: string | null
          content_score?: number | null
          created_at?: string
          data_source?: string | null
          description?: string | null
          eeat_score?: number | null
          employee_count?: string | null
          established_year?: number | null
          has_website?: boolean | null
          id?: string
          industry?: string | null
          is_new?: boolean | null
          last_analyzed?: string | null
          location?: string | null
          name?: string
          overall_score?: number | null
          phone?: string | null
          technical_score?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      data_sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          last_updated: string | null
          name: string
          total_records: number | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          name: string
          total_records?: number | null
          type: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          name?: string
          total_records?: number | null
          type?: string
          url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      user_businesses: {
        Row: {
          added_at: string
          business_id: string
          id: string
          is_favorite: boolean | null
          last_user_analyzed: string | null
          updated_at: string
          user_ai_content_score: number | null
          user_content_score: number | null
          user_eeat_score: number | null
          user_experience_score: number | null
          user_id: string
          user_notes: string | null
          user_overall_score: number | null
          user_seo_score: number | null
          user_tags: string[] | null
          user_technical_score: number | null
        }
        Insert: {
          added_at?: string
          business_id: string
          id?: string
          is_favorite?: boolean | null
          last_user_analyzed?: string | null
          updated_at?: string
          user_ai_content_score?: number | null
          user_content_score?: number | null
          user_eeat_score?: number | null
          user_experience_score?: number | null
          user_id: string
          user_notes?: string | null
          user_overall_score?: number | null
          user_seo_score?: number | null
          user_tags?: string[] | null
          user_technical_score?: number | null
        }
        Update: {
          added_at?: string
          business_id?: string
          id?: string
          is_favorite?: boolean | null
          last_user_analyzed?: string | null
          updated_at?: string
          user_ai_content_score?: number | null
          user_content_score?: number | null
          user_eeat_score?: number | null
          user_experience_score?: number | null
          user_id?: string
          user_notes?: string | null
          user_overall_score?: number | null
          user_seo_score?: number | null
          user_tags?: string[] | null
          user_technical_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
