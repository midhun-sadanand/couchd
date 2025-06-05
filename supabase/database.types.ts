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
      friend_requests: {
        Row: {
          created_at: string | null
          id: number
          receiver_id: string | null
          receiver_username: string | null
          sender_id: string | null
          sender_username: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          receiver_id?: string | null
          receiver_username?: string | null
          sender_id?: string | null
          sender_username?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          receiver_id?: string | null
          receiver_username?: string | null
          sender_id?: string | null
          sender_username?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_receiver_username_fkey"
            columns: ["receiver_username"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["username"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_username_fkey"
            columns: ["sender_username"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["username"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          added_by: string | null
          created_at: string | null
          creator: string | null
          id: string
          image: string | null
          length: number | null
          medium: string | null
          notes: string | null
          order: number | null
          rating: number | null
          release_date: string | null
          status: string | null
          synopsis: string | null
          title: string
          updated_at: string | null
          url: string | null
          watchlist_id: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          creator?: string | null
          id?: string
          image?: string | null
          length?: number | null
          medium?: string | null
          notes?: string | null
          order?: number | null
          rating?: number | null
          release_date?: string | null
          status?: string | null
          synopsis?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
          watchlist_id?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          creator?: string | null
          id?: string
          image?: string | null
          length?: number | null
          medium?: string | null
          notes?: string | null
          order?: number | null
          rating?: number | null
          release_date?: string | null
          status?: string | null
          synopsis?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
          watchlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_items_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      watchlist_ownership: {
        Row: {
          id: string
          user_id: string
          watchlist_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          watchlist_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          watchlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_ownership_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_ownership_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist_sharing: {
        Row: {
          id: string
          shared_with_user_id: string | null
          watchlist_id: string | null
        }
        Insert: {
          id?: string
          shared_with_user_id?: string | null
          watchlist_id?: string | null
        }
        Update: {
          id?: string
          shared_with_user_id?: string | null
          watchlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_sharing_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_sharing_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          consumed_count: number | null
          consuming_count: number | null
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          is_public: boolean | null
          media_ids: Json | null
          name: string
          order: number | null
          shared_with: Json | null
          tags: string | null
          to_consume_count: number | null
          user_id: string
        }
        Insert: {
          consumed_count?: number | null
          consuming_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_public?: boolean | null
          media_ids?: Json | null
          name: string
          order?: number | null
          shared_with?: Json | null
          tags?: string | null
          to_consume_count?: number | null
          user_id: string
        }
        Update: {
          consumed_count?: number | null
          consuming_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_public?: boolean | null
          media_ids?: Json | null
          name?: string
          order?: number | null
          shared_with?: Json | null
          tags?: string | null
          to_consume_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      append_friend: {
        Args:
          | { p_profile_id: string; p_friend_id: string }
          | {
              p_profile_id: string
              p_friend_id: string
              p_friend_username: string
            }
        Returns: undefined
      }
      requesting_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
