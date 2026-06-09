/**
 * Database types — hand-written to match supabase/migrations.
 * Regenerate with: npm run supabase:types
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
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";
export type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded"
  | "cancelled";
export type NotificationChannel = "email" | "sms" | "whatsapp" | "push";
export type NotificationStatus = "queued" | "sent" | "failed" | "skipped";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "paused";
export type SlotOverrideType = "block" | "open";
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type Timestamps = { created_at: string; updated_at: string };

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
          theme_style: string | null;
          status: BusinessStatus;
          address: string | null;
          arrival_instructions: string | null;
          payment_methods: string | null;
        } & Timestamps;
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
          theme_style?: string | null;
          status?: BusinessStatus;
          address?: string | null;
          arrival_instructions?: string | null;
          payment_methods?: string | null;
        } & Partial<Timestamps>;
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
        Relationships: [];
      };
      business_members: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: MemberRole;
          permissions: Json;
          status: MemberStatus;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role?: MemberRole;
          permissions?: Json;
          status?: MemberStatus;
        } & Partial<Timestamps>;
        Update: Partial<Database["public"]["Tables"]["business_members"]["Insert"]>;
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          address_line: string | null;
          city: string | null;
          timezone: string | null;
          phone: string | null;
          is_primary: boolean;
          active: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          address_line?: string | null;
          city?: string | null;
          timezone?: string | null;
          phone?: string | null;
          is_primary?: boolean;
          active?: boolean;
        } & Partial<Timestamps>;
        Update: Partial<Database["public"]["Tables"]["locations"]["Insert"]>;
        Relationships: [];
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
        } & Timestamps;
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
        } & Partial<Timestamps>;
        Update: Partial<Database["public"]["Tables"]["staff_members"]["Insert"]>;
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
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          duration_minutes: number;
          price: number;
          currency?: string;
          buffer_before_minutes?: number;
          buffer_after_minutes?: number;
          capacity?: number;
          requires_payment?: boolean;
          deposit_amount?: number | null;
          active?: boolean;
        } & Partial<Timestamps>;
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          business_id: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          notes: string | null;
          sms_consent: boolean;
          whatsapp_consent: boolean;
          email_consent: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          sms_consent?: boolean;
          whatsapp_consent?: boolean;
          email_consent?: boolean;
        } & Partial<Timestamps>;
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      availability_rules: {
        Row: {
          id: string;
          business_id: string;
          staff_member_id: string | null;
          location_id: string | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          effective_from: string | null;
          effective_until: string | null;
          active: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          staff_member_id?: string | null;
          location_id?: string | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          effective_from?: string | null;
          effective_until?: string | null;
          active?: boolean;
        } & Partial<Timestamps>;
        Update: Partial<Database["public"]["Tables"]["availability_rules"]["Insert"]>;
        Relationships: [];
      };
      availability_exceptions: {
        Row: {
          id: string;
          business_id: string;
          staff_member_id: string | null;
          location_id: string | null;
          exception_date: string;
          closed: boolean;
          start_time: string | null;
          end_time: string | null;
          reason: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          staff_member_id?: string | null;
          location_id?: string | null;
          exception_date: string;
          closed?: boolean;
          start_time?: string | null;
          end_time?: string | null;
          reason?: string | null;
        } & Partial<Timestamps>;
        Update: Partial<
          Database["public"]["Tables"]["availability_exceptions"]["Insert"]
        >;
        Relationships: [];
      };
      slot_overrides: {
        Row: {
          id: string;
          business_id: string;
          staff_member_id: string | null;
          location_id: string | null;
          starts_at: string;
          ends_at: string;
          override_type: SlotOverrideType;
          reason: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          staff_member_id?: string | null;
          location_id?: string | null;
          starts_at: string;
          ends_at: string;
          override_type?: SlotOverrideType;
          reason?: string | null;
        } & Partial<Timestamps>;
        Update: Partial<Database["public"]["Tables"]["slot_overrides"]["Insert"]>;
        Relationships: [];
      };
      cancellation_policies: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          min_hours_before: number;
          fee_amount: number | null;
          currency: string;
          active: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          min_hours_before?: number;
          fee_amount?: number | null;
          currency?: string;
          active?: boolean;
        } & Partial<Timestamps>;
        Update: Partial<
          Database["public"]["Tables"]["cancellation_policies"]["Insert"]
        >;
        Relationships: [];
      };
      app_settings: {
        Row: {
          id: string;
          business_id: string;
          booking_window_days: number;
          min_hours_before_booking: number;
          max_appointments_per_customer_per_day: number;
          max_appointments_per_customer_per_week: number;
          max_appointments_per_customer_per_month: number;
          limit_one_booking_per_day: boolean;
          limit_one_booking_per_week: boolean;
          limit_one_booking_per_month: boolean;
          allow_customer_cancellation: boolean;
          cancellation_min_hours: number;
          default_slot_duration_minutes: number;
          break_between_appointments_minutes: number;
          confirmation_message: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          booking_window_days?: number;
          min_hours_before_booking?: number;
          max_appointments_per_customer_per_day?: number;
          max_appointments_per_customer_per_week?: number;
          max_appointments_per_customer_per_month?: number;
          limit_one_booking_per_day?: boolean;
          limit_one_booking_per_week?: boolean;
          limit_one_booking_per_month?: boolean;
          allow_customer_cancellation?: boolean;
          cancellation_min_hours?: number;
          default_slot_duration_minutes?: number;
          break_between_appointments_minutes?: number;
          confirmation_message?: string | null;
        } & Partial<Timestamps>;
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string;
          service_id: string;
          staff_member_id: string;
          location_id: string | null;
          starts_at: string;
          ends_at: string;
          status: AppointmentStatus;
          notes: string | null;
          internal_notes: string | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          cancellation_policy_id: string | null;
          reminder_sent_at: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          customer_id: string;
          service_id: string;
          staff_member_id: string;
          location_id?: string | null;
          starts_at: string;
          ends_at: string;
          status?: AppointmentStatus;
          notes?: string | null;
          internal_notes?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancellation_policy_id?: string | null;
          reminder_sent_at?: string | null;
        } & Partial<Timestamps>;
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          business_id: string;
          appointment_id: string | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          provider: string | null;
          provider_ref: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          appointment_id?: string | null;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          provider?: string | null;
          provider_ref?: string | null;
        } & Partial<Timestamps>;
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      notification_logs: {
        Row: {
          id: string;
          business_id: string;
          appointment_id: string | null;
          customer_id: string | null;
          channel: NotificationChannel;
          status: NotificationStatus;
          payload: Json;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          appointment_id?: string | null;
          customer_id?: string | null;
          channel: NotificationChannel;
          status?: NotificationStatus;
          payload?: Json;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["notification_logs"]["Insert"]
        >;
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          price: number;
          currency: string;
          interval: string;
          features: Json;
          active: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          price: number;
          currency?: string;
          interval?: string;
          features?: Json;
          active?: boolean;
        } & Partial<Timestamps>;
        Update: Partial<
          Database["public"]["Tables"]["subscription_plans"]["Insert"]
        >;
        Relationships: [];
      };
      business_subscriptions: {
        Row: {
          id: string;
          business_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          current_period_start: string;
          current_period_end: string;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          plan_id: string;
          status?: SubscriptionStatus;
          current_period_start?: string;
          current_period_end: string;
        } & Partial<Timestamps>;
        Update: Partial<
          Database["public"]["Tables"]["business_subscriptions"]["Insert"]
        >;
        Relationships: [];
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
        Relationships: [];
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
          secondary_color: string | null;
          theme_style: string | null;
          timezone: string;
          locale: string;
          currency: string;
          status: BusinessStatus;
          address: string | null;
          arrival_instructions: string | null;
          payment_methods: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_member_of: {
        Args: { target_business: string; required_roles?: MemberRole[] | null };
        Returns: boolean;
      };
      is_platform_admin: { Args: Record<string, never>; Returns: boolean };
      is_reserved_slug: { Args: { candidate: string }; Returns: boolean };
    };
    Enums: {
      business_status: BusinessStatus;
      member_role: MemberRole;
      member_status: MemberStatus;
      appointment_status: AppointmentStatus;
      payment_status: PaymentStatus;
      notification_channel: NotificationChannel;
      notification_status: NotificationStatus;
      subscription_status: SubscriptionStatus;
      slot_override_type: SlotOverrideType;
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
