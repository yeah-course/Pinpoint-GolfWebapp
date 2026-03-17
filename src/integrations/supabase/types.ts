export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      course_holes: {
        Row: {
          course_id: string
          hole_number: number
          id: string
          par: number
          stroke_index: number | null
          tee_set_id: string
          yardage: number
        }
        Insert: {
          course_id: string
          hole_number: number
          id?: string
          par: number
          stroke_index?: number | null
          tee_set_id: string
          yardage: number
        }
        Update: {
          course_id?: string
          hole_number?: number
          id?: string
          par?: number
          stroke_index?: number | null
          tee_set_id?: string
          yardage?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_holes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_holes_tee_set_id_fkey"
            columns: ["tee_set_id"]
            isOneToOne: false
            referencedRelation: "tee_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          location: string | null
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          handicap_index: number | null
          id: string
          preferred_units: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          handicap_index?: number | null
          id?: string
          preferred_units?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          handicap_index?: number | null
          id?: string
          preferred_units?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      round_holes: {
        Row: {
          approach_distance: number | null
          approach_result: string | null
          approach_start_lie: string | null
          fairway_hit: boolean | null
          gir: boolean | null
          hole_number: number
          id: string
          par: number
          penalty_strokes: number
          putt_distance_feet: number | null
          putts: number | null
          round_id: string
          sand_save_attempted: boolean | null
          sand_save_converted: boolean | null
          score: number | null
          scramble_attempted: boolean | null
          scramble_converted: boolean | null
          tee_shot_result: Database["public"]["Enums"]["tee_shot_result"] | null
          yardage: number
        }
        Insert: {
          approach_distance?: number | null
          approach_result?: string | null
          approach_start_lie?: string | null
          fairway_hit?: boolean | null
          gir?: boolean | null
          hole_number: number
          id?: string
          par: number
          penalty_strokes?: number
          putt_distance_feet?: number | null
          putts?: number | null
          round_id: string
          sand_save_attempted?: boolean | null
          sand_save_converted?: boolean | null
          score?: number | null
          scramble_attempted?: boolean | null
          scramble_converted?: boolean | null
          tee_shot_result?:
            | Database["public"]["Enums"]["tee_shot_result"]
            | null
          yardage: number
        }
        Update: {
          approach_distance?: number | null
          approach_result?: string | null
          approach_start_lie?: string | null
          fairway_hit?: boolean | null
          gir?: boolean | null
          hole_number?: number
          id?: string
          par?: number
          penalty_strokes?: number
          putt_distance_feet?: number | null
          putts?: number | null
          round_id?: string
          sand_save_attempted?: boolean | null
          sand_save_converted?: boolean | null
          score?: number | null
          scramble_attempted?: boolean | null
          scramble_converted?: boolean | null
          tee_shot_result?:
            | Database["public"]["Enums"]["tee_shot_result"]
            | null
          yardage?: number
        }
        Relationships: [
          {
            foreignKeyName: "round_holes_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          course_id: string
          created_at: string
          date_played: string
          holes_played: number
          id: string
          is_completed: boolean
          is_public: boolean
          mode: Database["public"]["Enums"]["round_mode"]
          notes: string | null
          tee_set_id: string
          total_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          date_played?: string
          holes_played?: number
          id?: string
          is_completed?: boolean
          is_public?: boolean
          mode?: Database["public"]["Enums"]["round_mode"]
          notes?: string | null
          tee_set_id: string
          total_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          date_played?: string
          holes_played?: number
          id?: string
          is_completed?: boolean
          is_public?: boolean
          mode?: Database["public"]["Enums"]["round_mode"]
          notes?: string | null
          tee_set_id?: string
          total_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_tee_set_id_fkey"
            columns: ["tee_set_id"]
            isOneToOne: false
            referencedRelation: "tee_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      tee_sets: {
        Row: {
          color: string
          course_id: string
          course_rating: number | null
          created_at: string
          id: string
          name: string
          slope_rating: number | null
        }
        Insert: {
          color?: string
          course_id: string
          course_rating?: number | null
          created_at?: string
          id?: string
          name: string
          slope_rating?: number | null
        }
        Update: {
          color?: string
          course_id?: string
          course_rating?: number | null
          created_at?: string
          id?: string
          name?: string
          slope_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tee_sets_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_round_public: { Args: { _round_id: string }; Returns: boolean }
      owns_round: { Args: { _round_id: string }; Returns: boolean }
    }
    Enums: {
      round_mode: "quick" | "standard" | "advanced"
      tee_shot_result: "fairway" | "rough" | "sand" | "recovery" | "penalty"
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
    Enums: {
      round_mode: ["quick", "standard", "advanced"],
      tee_shot_result: ["fairway", "rough", "sand", "recovery", "penalty"],
    },
  },
} as const
