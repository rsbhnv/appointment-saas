/**
 * Database types — Phase 1 hand-written stub.
 *
 * Regenerate with `npm run supabase:types` once a Supabase project is linked:
 *   supabase gen types typescript --linked > src/types/database.ts
 *
 * Until then, this file matches `supabase/migrations/20260519100000_initial_schema.sql`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BusinessStatus = "active" | "suspended" | "pending_setup";
export type MemberRole = "business_owner" | "business_admin" | "staff";
export type MemberStatus = "active" | "invited" | "suspended";

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          name: string;
          slug: string;
          industry_type: string | null;
          description: string | null;
          phone: string | null;
          email: string | null;
          timezone: string;
          locale: string;
          currency: string;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          status: BusinessStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          industry_type?: string | null;
          description?: string | null;
          phone?: string | null;
          email?: string | null;
          timezone?: string;
          locale?: string;
          currency?: string;
          logo_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          status?: BusinessStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number;
          currency: string;
          buffer_before_minutes: number;
          buffer_after_minutes: number;
          capacity: number;
          requires_payment: boolean;
          deposit_amount: number | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          duration_minutes: number;
          price: number;
          currency: string;
          buffer_before_minutes?: number;
          buffer_after_minutes?: number;
          capacity?: number;
          requires_payment?: boolean;
          deposit_amount?: number | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_members: {
        Row: {
          id: string;
          business_id: string;
          user_id: string | null;
          name: string;
          title: string | null;
          phone: string | null;
          email: string | null;
          color: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id?: string | null;
          name: string;
          title?: string | null;
          phone?: string | null;
          email?: string | null;
          color?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff_members"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "staff_members_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      app_settings: {
        Row: {
          id: string;
          business_id: string;
          booking_window_days: number;
          min_hours_before_booking: number;
          max_appointments_per_customer_per_day: number;
          allow_customer_cancellation: boolean;
          cancellation_min_hours: number;
          confirmation_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          booking_window_days?: number;
          min_hours_before_booking?: number;
          max_appointments_per_customer_per_day?: number;
          allow_customer_cancellation?: boolean;
          cancellation_min_hours?: number;
          confirmation_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "app_settings_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      business_members: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: MemberRole;
          permissions: Json;
          status: MemberStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role?: MemberRole;
          permissions?: Json;
          status?: MemberStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["business_members"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          business_id: string | null;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id?: string | null;
          user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      business_public: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          primary_color: string | null;
          timezone: string;
          locale: string;
          currency: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_member_of: {
        Args: { target_business: string; required_roles?: MemberRole[] | null };
        Returns: boolean;
      };
      is_platform_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_reserved_slug: {
        Args: { candidate: string };
        Returns: boolean;
      };
    };
    Enums: {
      business_status: BusinessStatus;
      member_role: MemberRole;
      member_status: MemberStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
