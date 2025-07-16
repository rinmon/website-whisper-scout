export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
          catch_copy: string | null
          content_score: number | null
          corporate_number: string | null
          created_at: string
          data_source: string | null
          description: string | null
          eeat_score: number | null
          employee_count: string | null
          established_year: number | null
          establishment_date: string | null
          has_website: boolean | null
          id: string
          industry: string | null
          is_new: boolean | null
          last_analyzed: string | null
          location: string | null
          name: string
          number_of_employees: string | null
          overall_score: number | null
          phone: string | null
          phone_number: string | null
          seo_score: number | null
          technical_score: number | null
          updated_at: string
          user_experience_score: number | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          ai_content_score?: number | null
          capital?: string | null
          catch_copy?: string | null
          content_score?: number | null
          corporate_number?: string | null
          created_at?: string
          data_source?: string | null
          description?: string | null
          eeat_score?: number | null
          employee_count?: string | null
          established_year?: number | null
          establishment_date?: string | null
          has_website?: boolean | null
          id?: string
          industry?: string | null
          is_new?: boolean | null
          last_analyzed?: string | null
          location?: string | null
          name: string
          number_of_employees?: string | null
          overall_score?: number | null
          phone?: string | null
          phone_number?: string | null
          seo_score?: number | null
          technical_score?: number | null
          updated_at?: string
          user_experience_score?: number | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          ai_content_score?: number | null
          capital?: string | null
          catch_copy?: string | null
          content_score?: number | null
          corporate_number?: string | null
          created_at?: string
          data_source?: string | null
          description?: string | null
          eeat_score?: number | null
          employee_count?: string | null
          established_year?: number | null
          establishment_date?: string | null
          has_website?: boolean | null
          id?: string
          industry?: string | null
          is_new?: boolean | null
          last_analyzed?: string | null
          location?: string | null
          name?: string
          number_of_employees?: string | null
          overall_score?: number | null
          phone?: string | null
          phone_number?: string | null
          seo_score?: number | null
          technical_score?: number | null
          updated_at?: string
          user_experience_score?: number | null
          user_id?: string | null
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
      website_analysis: {
        Row: {
          analyzed_at: string
          business_id: string
          content_analysis: Json | null
          core_web_vitals: Json | null
          created_at: string
          eeat_factors: Json | null
          id: string
          lighthouse_score: Json | null
          meta_tags: Json | null
          mobile_friendly: boolean | null
          ssl_certificate: boolean | null
          structured_data: Json | null
          updated_at: string
        }
        Insert: {
          analyzed_at?: string
          business_id: string
          content_analysis?: Json | null
          core_web_vitals?: Json | null
          created_at?: string
          eeat_factors?: Json | null
          id?: string
          lighthouse_score?: Json | null
          meta_tags?: Json | null
          mobile_friendly?: boolean | null
          ssl_certificate?: boolean | null
          structured_data?: Json | null
          updated_at?: string
        }
        Update: {
          analyzed_at?: string
          business_id?: string
          content_analysis?: Json | null
          core_web_vitals?: Json | null
          created_at?: string
          eeat_factors?: Json | null
          id?: string
          lighthouse_score?: Json | null
          meta_tags?: Json | null
          mobile_friendly?: boolean | null
          ssl_certificate?: boolean | null
          structured_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_analysis_business_id_fkey"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
