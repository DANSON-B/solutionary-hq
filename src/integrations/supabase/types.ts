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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounting_exports: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          export_type: string
          file_url: string | null
          format: string
          id: string
          period_end: string | null
          period_start: string | null
          row_count: number
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          export_type: string
          file_url?: string | null
          format?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          row_count?: number
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          export_type?: string
          file_url?: string | null
          format?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          row_count?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_exports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_onboarding: {
        Row: {
          business_id: string
          checklist_dismissed: boolean
          completed_at: string | null
          completed_steps: string[]
          created_at: string
          current_step: number
          skipped_steps: string[]
          updated_at: string
          wizard_dismissed: boolean
        }
        Insert: {
          business_id: string
          checklist_dismissed?: boolean
          completed_at?: string | null
          completed_steps?: string[]
          created_at?: string
          current_step?: number
          skipped_steps?: string[]
          updated_at?: string
          wizard_dismissed?: boolean
        }
        Update: {
          business_id?: string
          checklist_dismissed?: boolean
          completed_at?: string | null
          completed_steps?: string[]
          created_at?: string
          current_step?: number
          skipped_steps?: string[]
          updated_at?: string
          wizard_dismissed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "business_onboarding_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          auto_reschedule_on_cancel: boolean
          auto_review_request: boolean | null
          business_id: string
          checklist_block_completion: boolean
          checklist_customer_visible: boolean
          checklists_enabled: boolean
          created_at: string
          default_tax_rate: number | null
          geofence_radius_meters: number
          id: string
          invoice_due_days: number | null
          invoice_footer_note: string | null
          quote_footer_note: string | null
          quote_valid_days: number | null
          reminder_hours_before: number
          require_geofence: boolean
          updated_at: string
        }
        Insert: {
          auto_reschedule_on_cancel?: boolean
          auto_review_request?: boolean | null
          business_id: string
          checklist_block_completion?: boolean
          checklist_customer_visible?: boolean
          checklists_enabled?: boolean
          created_at?: string
          default_tax_rate?: number | null
          geofence_radius_meters?: number
          id?: string
          invoice_due_days?: number | null
          invoice_footer_note?: string | null
          quote_footer_note?: string | null
          quote_valid_days?: number | null
          reminder_hours_before?: number
          require_geofence?: boolean
          updated_at?: string
        }
        Update: {
          auto_reschedule_on_cancel?: boolean
          auto_review_request?: boolean | null
          business_id?: string
          checklist_block_completion?: boolean
          checklist_customer_visible?: boolean
          checklists_enabled?: boolean
          created_at?: string
          default_tax_rate?: number | null
          geofence_radius_meters?: number
          id?: string
          invoice_due_days?: number | null
          invoice_footer_note?: string | null
          quote_footer_note?: string | null
          quote_valid_days?: number | null
          reminder_hours_before?: number
          require_geofence?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_twilio: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          phone_number: string | null
          phone_sid: string | null
          purchased_at: string | null
          sms_enabled: boolean | null
          subaccount_auth_token: string | null
          subaccount_friendly_name: string | null
          subaccount_sid: string | null
          twilio_status: string | null
          updated_at: string | null
          voice_enabled: boolean | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          phone_number?: string | null
          phone_sid?: string | null
          purchased_at?: string | null
          sms_enabled?: boolean | null
          subaccount_auth_token?: string | null
          subaccount_friendly_name?: string | null
          subaccount_sid?: string | null
          twilio_status?: string | null
          updated_at?: string | null
          voice_enabled?: boolean | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          phone_number?: string | null
          phone_sid?: string | null
          purchased_at?: string | null
          sms_enabled?: boolean | null
          subaccount_auth_token?: string | null
          subaccount_friendly_name?: string | null
          subaccount_sid?: string | null
          twilio_status?: string | null
          updated_at?: string | null
          voice_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "business_twilio_business_id_fkey"
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
          call_recording_enabled: boolean | null
          city: string | null
          created_at: string
          email: string | null
          forward_phone: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          slug: string | null
          state: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string
          voicemail_enabled: boolean | null
          voicemail_greeting: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          call_recording_enabled?: boolean | null
          city?: string | null
          created_at?: string
          email?: string | null
          forward_phone?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          slug?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          voicemail_enabled?: boolean | null
          voicemail_greeting?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          call_recording_enabled?: boolean | null
          city?: string | null
          created_at?: string
          email?: string | null
          forward_phone?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          slug?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          voicemail_enabled?: boolean | null
          voicemail_greeting?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      call_quote_events: {
        Row: {
          call_quote_id: string
          created_at: string
          event_type: string
          id: string
          meta: Json
        }
        Insert: {
          call_quote_id: string
          created_at?: string
          event_type: string
          id?: string
          meta?: Json
        }
        Update: {
          call_quote_id?: string
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json
        }
        Relationships: [
          {
            foreignKeyName: "call_quote_events_call_quote_id_fkey"
            columns: ["call_quote_id"]
            isOneToOne: false
            referencedRelation: "call_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      call_quotes: {
        Row: {
          accepted_at: string | null
          addons: Json
          allow_customer_edits: boolean
          amount_paid: number
          bathrooms: number
          bedrooms: number
          breakdown: Json
          business_id: string
          call_notes: string | null
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          deposit_percent: number
          dining_rooms: number
          discount_amount: number
          expires_at: string | null
          finished_basement: number
          frequency: string
          frequency_discount_percent: number
          id: string
          kitchens: number
          laundry_room: number
          lead_source: string | null
          living_rooms: number
          manual_override: boolean
          offices: number
          paid_at: string | null
          payment_mode: string | null
          sent_at: string | null
          service_address: string | null
          service_tier: string
          service_type: string
          share_token: string
          sqft_tier: string | null
          status: string
          stripe_session_id: string | null
          subtotal: number
          total: number
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          addons?: Json
          allow_customer_edits?: boolean
          amount_paid?: number
          bathrooms?: number
          bedrooms?: number
          breakdown?: Json
          business_id: string
          call_notes?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          deposit_percent?: number
          dining_rooms?: number
          discount_amount?: number
          expires_at?: string | null
          finished_basement?: number
          frequency?: string
          frequency_discount_percent?: number
          id?: string
          kitchens?: number
          laundry_room?: number
          lead_source?: string | null
          living_rooms?: number
          manual_override?: boolean
          offices?: number
          paid_at?: string | null
          payment_mode?: string | null
          sent_at?: string | null
          service_address?: string | null
          service_tier?: string
          service_type: string
          share_token?: string
          sqft_tier?: string | null
          status?: string
          stripe_session_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          addons?: Json
          allow_customer_edits?: boolean
          amount_paid?: number
          bathrooms?: number
          bedrooms?: number
          breakdown?: Json
          business_id?: string
          call_notes?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          deposit_percent?: number
          dining_rooms?: number
          discount_amount?: number
          expires_at?: string | null
          finished_basement?: number
          frequency?: string
          frequency_discount_percent?: number
          id?: string
          kitchens?: number
          laundry_room?: number
          lead_source?: string | null
          living_rooms?: number
          manual_override?: boolean
          offices?: number
          paid_at?: string | null
          payment_mode?: string | null
          sent_at?: string | null
          service_address?: string | null
          service_tier?: string
          service_type?: string
          share_token?: string
          sqft_tier?: string | null
          status?: string
          stripe_session_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_quotes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_quotes_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_template_items: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          label: string
          photo_required: boolean
          room: string | null
          rotation_frequency: number
          rotation_offset: number
          sort_order: number
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          label: string
          photo_required?: boolean
          room?: string | null
          rotation_frequency?: number
          rotation_offset?: number
          sort_order?: number
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          label?: string
          photo_required?: boolean
          room?: string | null
          rotation_frequency?: number
          rotation_offset?: number
          sort_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          service_type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          service_type?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          service_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_automation_templates: {
        Row: {
          business_id: string
          created_at: string
          delay_days: number
          description: string | null
          id: string
          is_active: boolean
          message_template: string | null
          name: string
          template_type: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          delay_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          message_template?: string | null
          name: string
          template_type: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          delay_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          message_template?: string | null
          name?: string
          template_type?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_automation_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_booking_requests: {
        Row: {
          address: string | null
          amount_paid: number
          bathrooms: number | null
          bedrooms: number | null
          business_id: string
          category: string
          city: string | null
          cleaning_type: string | null
          created_at: string
          deposit_percent: number | null
          email: string
          estimated_total: number | null
          extras: string[] | null
          gift_card_code: string | null
          id: string
          is_high_value: boolean | null
          lead_score: number | null
          name: string
          notes: string | null
          phone: string | null
          preferred_date: string | null
          preferred_time: string | null
          property_sqft: number | null
          state: string | null
          status: string
          stripe_session_id: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          amount_paid?: number
          bathrooms?: number | null
          bedrooms?: number | null
          business_id: string
          category?: string
          city?: string | null
          cleaning_type?: string | null
          created_at?: string
          deposit_percent?: number | null
          email: string
          estimated_total?: number | null
          extras?: string[] | null
          gift_card_code?: string | null
          id?: string
          is_high_value?: boolean | null
          lead_score?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          property_sqft?: number | null
          state?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          amount_paid?: number
          bathrooms?: number | null
          bedrooms?: number | null
          business_id?: string
          category?: string
          city?: string | null
          cleaning_type?: string | null
          created_at?: string
          deposit_percent?: number | null
          email?: string
          estimated_total?: number | null
          extras?: string[] | null
          gift_card_code?: string | null
          id?: string
          is_high_value?: boolean | null
          lead_score?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          property_sqft?: number | null
          state?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_booking_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_booking_settings: {
        Row: {
          allow_recurring: boolean
          buffer_minutes: number
          business_id: string
          cancellation_policy: string | null
          created_at: string
          deposit_percentage: number
          id: string
          require_deposit: boolean
          updated_at: string
        }
        Insert: {
          allow_recurring?: boolean
          buffer_minutes?: number
          business_id: string
          cancellation_policy?: string | null
          created_at?: string
          deposit_percentage?: number
          id?: string
          require_deposit?: boolean
          updated_at?: string
        }
        Update: {
          allow_recurring?: boolean
          buffer_minutes?: number
          business_id?: string
          cancellation_policy?: string | null
          created_at?: string
          deposit_percentage?: number
          id?: string
          require_deposit?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_booking_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_custom_services: {
        Row: {
          business_id: string
          created_at: string
          enabled: boolean
          id: string
          label: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          label: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_custom_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_customer_details: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          business_id: string
          cleaning_notes: string | null
          created_at: string
          customer_id: string
          id: string
          preferred_service_type: string | null
          property_sqft: number | null
          updated_at: string
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          business_id: string
          cleaning_notes?: string | null
          created_at?: string
          customer_id: string
          id?: string
          preferred_service_type?: string | null
          property_sqft?: number | null
          updated_at?: string
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          business_id?: string
          cleaning_notes?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          preferred_service_type?: string | null
          property_sqft?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_customer_details_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_customer_details_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_gift_card_packages: {
        Row: {
          business_id: string
          cleaning_type: string
          created_at: string
          description: string | null
          estimated_duration_minutes: number
          id: string
          is_active: boolean
          max_rooms: number
          max_sqft: number
          name: string
          price: number
          rooms_included: string[] | null
          updated_at: string
        }
        Insert: {
          business_id: string
          cleaning_type?: string
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number
          id?: string
          is_active?: boolean
          max_rooms?: number
          max_sqft?: number
          name: string
          price?: number
          rooms_included?: string[] | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          cleaning_type?: string
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number
          id?: string
          is_active?: boolean
          max_rooms?: number
          max_sqft?: number
          name?: string
          price?: number
          rooms_included?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_gift_card_packages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_gift_cards: {
        Row: {
          amount: number
          business_id: string
          buyer_email: string
          buyer_name: string
          buyer_phone: string | null
          cleaning_type: string
          code: string
          created_at: string
          expires_at: string
          id: string
          job_id: string | null
          package_id: string | null
          purchased_at: string
          recipient_email: string | null
          recipient_message: string | null
          recipient_name: string | null
          redeemed_at: string | null
          redeemed_by_customer_id: string | null
          rooms_included: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          business_id: string
          buyer_email: string
          buyer_name: string
          buyer_phone?: string | null
          cleaning_type?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          job_id?: string | null
          package_id?: string | null
          purchased_at?: string
          recipient_email?: string | null
          recipient_message?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by_customer_id?: string | null
          rooms_included?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          business_id?: string
          buyer_email?: string
          buyer_name?: string
          buyer_phone?: string | null
          cleaning_type?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          job_id?: string | null
          package_id?: string | null
          purchased_at?: string
          recipient_email?: string | null
          recipient_message?: string | null
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by_customer_id?: string | null
          rooms_included?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_gift_cards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_gift_cards_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_gift_cards_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "cleaning_gift_card_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_gift_cards_redeemed_by_customer_id_fkey"
            columns: ["redeemed_by_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_package_purchases: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          expires_at: string | null
          id: string
          package_id: string
          price_paid: number
          purchased_at: string
          status: string
          updated_at: string
          visits_total: number
          visits_used: number
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          expires_at?: string | null
          id?: string
          package_id: string
          price_paid?: number
          purchased_at?: string
          status?: string
          updated_at?: string
          visits_total: number
          visits_used?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          expires_at?: string | null
          id?: string
          package_id?: string
          price_paid?: number
          purchased_at?: string
          status?: string
          updated_at?: string
          visits_total?: number
          visits_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_package_purchases_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_package_purchases_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_package_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "cleaning_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_packages: {
        Row: {
          business_id: string
          cleaning_type: string
          created_at: string
          discount_percentage: number
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
          visits_total: number
        }
        Insert: {
          business_id: string
          cleaning_type?: string
          created_at?: string
          discount_percentage?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
          visits_total?: number
        }
        Update: {
          business_id?: string
          cleaning_type?: string
          created_at?: string
          discount_percentage?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
          visits_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_packages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_pricing_rules: {
        Row: {
          add_ons: Json | null
          base_price: number
          bathroom_price: number
          bedroom_price: number
          business_id: string
          cleaning_type: string
          created_at: string
          id: string
          is_active: boolean | null
          price_per_sqft: number
          updated_at: string
        }
        Insert: {
          add_ons?: Json | null
          base_price?: number
          bathroom_price?: number
          bedroom_price?: number
          business_id: string
          cleaning_type: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          price_per_sqft?: number
          updated_at?: string
        }
        Update: {
          add_ons?: Json | null
          base_price?: number
          bathroom_price?: number
          bedroom_price?: number
          business_id?: string
          cleaning_type?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          price_per_sqft?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_pricing_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_recurring_bookings: {
        Row: {
          add_ons: Json | null
          assigned_to: string | null
          bathrooms: number | null
          bedrooms: number | null
          business_id: string
          cleaning_type: string
          created_at: string
          customer_id: string
          discount_percentage: number
          frequency: string
          id: string
          is_active: boolean
          last_job_id: string | null
          next_scheduled_date: string | null
          preferred_day_of_week: number | null
          preferred_time: string | null
          property_sqft: number | null
          total_per_visit: number
          updated_at: string
          visit_count: number
        }
        Insert: {
          add_ons?: Json | null
          assigned_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          business_id: string
          cleaning_type?: string
          created_at?: string
          customer_id: string
          discount_percentage?: number
          frequency?: string
          id?: string
          is_active?: boolean
          last_job_id?: string | null
          next_scheduled_date?: string | null
          preferred_day_of_week?: number | null
          preferred_time?: string | null
          property_sqft?: number | null
          total_per_visit?: number
          updated_at?: string
          visit_count?: number
        }
        Update: {
          add_ons?: Json | null
          assigned_to?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          business_id?: string
          cleaning_type?: string
          created_at?: string
          customer_id?: string
          discount_percentage?: number
          frequency?: string
          id?: string
          is_active?: boolean
          last_job_id?: string | null
          next_scheduled_date?: string | null
          preferred_day_of_week?: number | null
          preferred_time?: string | null
          property_sqft?: number | null
          total_per_visit?: number
          updated_at?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_recurring_bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_recurring_bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_recurring_bookings_last_job_id_fkey"
            columns: ["last_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_reminders: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          id: string
          job_id: string
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          id?: string
          job_id: string
          reminder_type?: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          job_id?: string
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_reminders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_reminders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_reminders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_wizard_config: {
        Row: {
          business_id: string
          commercial_addons: Json
          commercial_rates: Json
          condition_multipliers: Json
          created_at: string
          custom_services: Json
          frequencies: Json
          hide_price_above_sqft: number
          id: string
          min_commercial: number
          min_residential: number
          residential_addons: Json
          residential_rates: Json
          services: Json
          updated_at: string
        }
        Insert: {
          business_id: string
          commercial_addons?: Json
          commercial_rates?: Json
          condition_multipliers?: Json
          created_at?: string
          custom_services?: Json
          frequencies?: Json
          hide_price_above_sqft?: number
          id?: string
          min_commercial?: number
          min_residential?: number
          residential_addons?: Json
          residential_rates?: Json
          services?: Json
          updated_at?: string
        }
        Update: {
          business_id?: string
          commercial_addons?: Json
          commercial_rates?: Json
          condition_multipliers?: Json
          created_at?: string
          custom_services?: Json
          frequencies?: Json
          hide_price_above_sqft?: number
          id?: string
          min_commercial?: number
          min_residential?: number
          residential_addons?: Json
          residential_rates?: Json
          services?: Json
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          business_id: string
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          single_use: boolean
          updated_at: string
          use_count: number
        }
        Insert: {
          business_id: string
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          single_use?: boolean
          updated_at?: string
          use_count?: number
        }
        Update: {
          business_id?: string
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          single_use?: boolean
          updated_at?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_memberships: {
        Row: {
          business_id: string
          cancelled_at: string | null
          created_at: string
          customer_id: string
          id: string
          membership_id: string
          notes: string | null
          renews_at: string | null
          started_at: string
          status: string
          updated_at: string
          visits_used_this_period: number
        }
        Insert: {
          business_id: string
          cancelled_at?: string | null
          created_at?: string
          customer_id: string
          id?: string
          membership_id: string
          notes?: string | null
          renews_at?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          visits_used_this_period?: number
        }
        Update: {
          business_id?: string
          cancelled_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          membership_id?: string
          notes?: string | null
          renews_at?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          visits_used_this_period?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_memberships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_memberships_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_portal_tokens: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          expires_at?: string
          id?: string
          token?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_portal_tokens_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_portal_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_properties: {
        Row: {
          address: string
          bathrooms: number | null
          bedrooms: number | null
          business_id: string
          city: string | null
          created_at: string
          customer_id: string
          entry_instructions: string | null
          gate_code: string | null
          id: string
          is_primary: boolean
          label: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          sqft: number | null
          state: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address: string
          bathrooms?: number | null
          bedrooms?: number | null
          business_id: string
          city?: string | null
          created_at?: string
          customer_id: string
          entry_instructions?: string | null
          gate_code?: string | null
          id?: string
          is_primary?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          sqft?: number | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string
          bathrooms?: number | null
          bedrooms?: number | null
          business_id?: string
          city?: string | null
          created_at?: string
          customer_id?: string
          entry_instructions?: string | null
          gate_code?: string | null
          id?: string
          is_primary?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          sqft?: number | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_properties_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_properties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          billing_address: string | null
          billing_email: string | null
          birthday: string | null
          business_id: string
          city: string | null
          company_name: string | null
          created_at: string
          email: string | null
          entry_instructions: string | null
          first_name: string
          gate_code: string | null
          id: string
          is_commercial: boolean
          last_job_at: string | null
          last_name: string
          lifetime_value: number
          marketing_email_consent: boolean
          marketing_sms_consent: boolean
          notes: string | null
          payment_terms_days: number
          pets: Json
          phone: string | null
          po_number: string | null
          preferred_contact: string
          referral_code: string | null
          referral_credit_cents: number
          referral_source: string | null
          referred_by_customer_id: string | null
          state: string | null
          tags: string[] | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          billing_address?: string | null
          billing_email?: string | null
          birthday?: string | null
          business_id: string
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          entry_instructions?: string | null
          first_name: string
          gate_code?: string | null
          id?: string
          is_commercial?: boolean
          last_job_at?: string | null
          last_name: string
          lifetime_value?: number
          marketing_email_consent?: boolean
          marketing_sms_consent?: boolean
          notes?: string | null
          payment_terms_days?: number
          pets?: Json
          phone?: string | null
          po_number?: string | null
          preferred_contact?: string
          referral_code?: string | null
          referral_credit_cents?: number
          referral_source?: string | null
          referred_by_customer_id?: string | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          billing_address?: string | null
          billing_email?: string | null
          birthday?: string | null
          business_id?: string
          city?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          entry_instructions?: string | null
          first_name?: string
          gate_code?: string | null
          id?: string
          is_commercial?: boolean
          last_job_at?: string | null
          last_name?: string
          lifetime_value?: number
          marketing_email_consent?: boolean
          marketing_sms_consent?: boolean
          notes?: string | null
          payment_terms_days?: number
          pets?: Json
          phone?: string | null
          po_number?: string | null
          preferred_contact?: string
          referral_code?: string | null
          referral_credit_cents?: number
          referral_source?: string | null
          referred_by_customer_id?: string | null
          state?: string | null
          tags?: string[] | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_referred_by_customer_id_fkey"
            columns: ["referred_by_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      help_articles: {
        Row: {
          body: string | null
          category_slug: string
          created_at: string
          description: string | null
          id: string
          image_urls: string[]
          keywords: string[]
          published: boolean
          related_slugs: string[]
          routes: string[]
          slug: string
          sort_order: number
          steps: Json
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          body?: string | null
          category_slug: string
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[]
          keywords?: string[]
          published?: boolean
          related_slugs?: string[]
          routes?: string[]
          slug: string
          sort_order?: number
          steps?: Json
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          body?: string | null
          category_slug?: string
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[]
          keywords?: string[]
          published?: boolean
          related_slugs?: string[]
          routes?: string[]
          slug?: string
          sort_order?: number
          steps?: Json
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_articles_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      help_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      industry_change_log: {
        Row: {
          business_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_industry: string
          old_industry: string | null
          reason: string | null
        }
        Insert: {
          business_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_industry: string
          old_industry?: string | null
          reason?: string | null
        }
        Update: {
          business_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_industry?: string
          old_industry?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "industry_change_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          on_hand: number
          reorder_threshold: number
          sku: string | null
          unit: string
          unit_cost_cents: number
          updated_at: string
          vendor: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          on_hand?: number
          reorder_threshold?: number
          sku?: string | null
          unit?: string
          unit_cost_cents?: number
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          on_hand?: number
          reorder_threshold?: number
          sku?: string | null
          unit?: string
          unit_cost_cents?: number
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          job_id: string | null
          movement_type: string
          note: string | null
          quantity: number
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          job_id?: string | null
          movement_type: string
          note?: string | null
          quantity: number
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          job_id?: string | null
          movement_type?: string
          note?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          description: string
          id: string
          invoice_id: string
          quantity: number
          sort_order: number | null
          total: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number | null
          total?: number
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          business_id: string
          created_at: string
          customer_id: string
          due_date: string | null
          id: string
          invoice_number: string
          is_recurring: boolean | null
          job_id: string | null
          net_days: number
          next_invoice_date: string | null
          notes: string | null
          paid_at: string | null
          po_number: string | null
          quote_id: string | null
          recurring_interval: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_url: string | null
          stripe_session_id: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          total: number | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          business_id: string
          created_at?: string
          customer_id: string
          due_date?: string | null
          id?: string
          invoice_number: string
          is_recurring?: boolean | null
          job_id?: string | null
          net_days?: number
          next_invoice_date?: string | null
          notes?: string | null
          paid_at?: string | null
          po_number?: string | null
          quote_id?: string | null
          recurring_interval?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_url?: string | null
          stripe_session_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          business_id?: string
          created_at?: string
          customer_id?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          is_recurring?: boolean | null
          job_id?: string | null
          net_days?: number
          next_invoice_date?: string | null
          notes?: string | null
          paid_at?: string | null
          po_number?: string | null
          quote_id?: string | null
          recurring_interval?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_url?: string | null
          stripe_session_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_checklist_items: {
        Row: {
          business_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          is_completed: boolean
          is_required: boolean
          job_id: string
          label: string
          notes: string | null
          photo_id: string | null
          photo_required: boolean
          room: string | null
          sort_order: number | null
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          is_required?: boolean
          job_id: string
          label: string
          notes?: string | null
          photo_id?: string | null
          photo_required?: boolean
          room?: string | null
          sort_order?: number | null
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          is_required?: boolean
          job_id?: string
          label?: string
          notes?: string | null
          photo_id?: string | null
          photo_required?: boolean
          room?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_checklist_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_checklist_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_checklist_items_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "job_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      job_incident_reports: {
        Row: {
          business_id: string
          created_at: string
          description: string
          id: string
          incident_type: string
          job_id: string
          photo_urls: string[]
          reported_by: string | null
          resolution_notes: string | null
          resolved: boolean
          resolved_at: string | null
          severity: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description: string
          id?: string
          incident_type?: string
          job_id: string
          photo_urls?: string[]
          reported_by?: string | null
          resolution_notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string
          id?: string
          incident_type?: string
          job_id?: string
          photo_urls?: string[]
          reported_by?: string | null
          resolution_notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_incident_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_incident_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_notes: {
        Row: {
          business_id: string
          content: string
          created_at: string
          id: string
          job_id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          content: string
          created_at?: string
          id?: string
          job_id: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          content?: string
          created_at?: string
          id?: string
          job_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_photos: {
        Row: {
          business_id: string
          caption: string | null
          created_at: string
          id: string
          job_id: string
          photo_type: string
          storage_path: string
        }
        Insert: {
          business_id: string
          caption?: string | null
          created_at?: string
          id?: string
          job_id: string
          photo_type?: string
          storage_path: string
        }
        Update: {
          business_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          job_id?: string
          photo_type?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string | null
          assigned_team_member_id: string | null
          assigned_to: string | null
          business_id: string
          cancel_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          customer_id: string
          description: string | null
          id: string
          notes: string | null
          quote_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          signature_name: string | null
          signature_url: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          total: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_team_member_id?: string | null
          assigned_to?: string | null
          business_id: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          notes?: string | null
          quote_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          signature_name?: string | null
          signature_url?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          total?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_team_member_id?: string | null
          assigned_to?: string | null
          business_id?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          notes?: string | null
          quote_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          signature_name?: string | null
          signature_url?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_team_member_id_fkey"
            columns: ["assigned_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaign_sends: {
        Row: {
          business_id: string
          campaign_id: string
          created_at: string
          customer_id: string | null
          error: string | null
          id: string
          recipient: string
          sent_at: string | null
          status: string
        }
        Insert: {
          business_id: string
          campaign_id: string
          created_at?: string
          customer_id?: string | null
          error?: string | null
          id?: string
          recipient: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          campaign_id?: string
          created_at?: string
          customer_id?: string | null
          error?: string | null
          id?: string
          recipient?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaign_sends_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaign_sends_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          audience: Json
          body: string
          business_id: string
          channel: string
          created_at: string
          created_by: string | null
          delivered_count: number
          failed_count: number
          id: string
          name: string
          recipient_count: number
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          audience?: Json
          body: string
          business_id: string
          channel: string
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          failed_count?: number
          id?: string
          name: string
          recipient_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          audience?: Json
          body?: string
          business_id?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          failed_count?: number
          id?: string
          name?: string
          recipient_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          billing_period: string
          business_id: string
          created_at: string
          description: string | null
          id: string
          included_visits: number
          is_active: boolean
          member_discount_percent: number
          name: string
          perks: Json
          price_cents: number
          updated_at: string
        }
        Insert: {
          billing_period?: string
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          included_visits?: number
          is_active?: boolean
          member_discount_percent?: number
          name: string
          perks?: Json
          price_cents?: number
          updated_at?: string
        }
        Update: {
          billing_period?: string
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          included_visits?: number
          is_active?: boolean
          member_discount_percent?: number
          name?: string
          perks?: Json
          price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          paid_at: string
          reference: string | null
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_line_items: {
        Row: {
          bonus_cents: number
          business_id: string
          commission_pay_cents: number
          created_at: string
          deductions_cents: number
          hourly_pay_cents: number
          hours_worked: number
          id: string
          notes: string | null
          period_id: string
          team_member_id: string
          total_cents: number
        }
        Insert: {
          bonus_cents?: number
          business_id: string
          commission_pay_cents?: number
          created_at?: string
          deductions_cents?: number
          hourly_pay_cents?: number
          hours_worked?: number
          id?: string
          notes?: string | null
          period_id: string
          team_member_id: string
          total_cents?: number
        }
        Update: {
          bonus_cents?: number
          business_id?: string
          commission_pay_cents?: number
          created_at?: string
          deductions_cents?: number
          hourly_pay_cents?: number
          hours_worked?: number
          id?: string
          notes?: string | null
          period_id?: string
          team_member_id?: string
          total_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_line_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_line_items_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_line_items_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          business_id: string
          created_at: string
          id: string
          period_end: string
          period_start: string
          status: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          status?: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          status?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          business_id: string
          created_at: string
          discount_by_tier: Json
          frequency_discounts: Json
          min_job_price: number
          room_prices: Json
          sqft_tier_prices: Json
          tier_multipliers: Json
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          discount_by_tier?: Json
          frequency_discounts?: Json
          min_job_price?: number
          room_prices?: Json
          sqft_tier_prices?: Json
          tier_multipliers?: Json
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          discount_by_tier?: Json
          frequency_discounts?: Json
          min_job_price?: number
          room_prices?: Json
          sqft_tier_prices?: Json
          tier_multipliers?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_id: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          description: string
          id: string
          quantity: number
          quote_id: string
          service_id: string | null
          sort_order: number | null
          total: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          quantity?: number
          quote_id: string
          service_id?: string | null
          sort_order?: number | null
          total?: number
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          quantity?: number
          quote_id?: string
          service_id?: string | null
          sort_order?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          amount_paid: number
          approved_at: string | null
          business_id: string
          created_at: string
          customer_id: string
          deposit_percent: number | null
          id: string
          notes: string | null
          quote_number: string
          sent_at: string | null
          status: Database["public"]["Enums"]["quote_status"]
          stripe_session_id: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          total: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          amount_paid?: number
          approved_at?: string | null
          business_id: string
          created_at?: string
          customer_id: string
          deposit_percent?: number | null
          id?: string
          notes?: string | null
          quote_number: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          stripe_session_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          amount_paid?: number
          approved_at?: string | null
          business_id?: string
          created_at?: string
          customer_id?: string
          deposit_percent?: number | null
          id?: string
          notes?: string | null
          quote_number?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          stripe_session_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      review_request_tokens: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          is_used: boolean
          job_id: string | null
          token: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          expires_at?: string
          id?: string
          is_used?: boolean
          job_id?: string | null
          token?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          job_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_request_tokens_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_request_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_request_tokens_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          business_id: string
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          is_public: boolean | null
          job_id: string | null
          rating: number
        }
        Insert: {
          business_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_public?: boolean | null
          job_id?: string | null
          rating: number
        }
        Update: {
          business_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_public?: boolean | null
          job_id?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          customer_id: string
          description: string | null
          id: string
          preferred_date: string | null
          preferred_time: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          business_id: string
          created_at: string
          default_price: number | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          default_price?: number | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          default_price?: number | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_messages: {
        Row: {
          business_id: string
          created_at: string | null
          customer_id: string | null
          customer_phone: string
          direction: string
          error_code: string | null
          error_message: string | null
          id: string
          message: string
          status: string | null
          twilio_sid: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          customer_id?: string | null
          customer_phone: string
          direction: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          message: string
          status?: string | null
          twilio_sid?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          customer_id?: string | null
          customer_phone?: string
          direction?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          message?: string
          status?: string | null
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          event_id: string
          event_type: string
          id: number
          processed_at: string | null
        }
        Insert: {
          event_id: string
          event_type: string
          id?: number
          processed_at?: string | null
        }
        Update: {
          event_id?: string
          event_type?: string
          id?: number
          processed_at?: string | null
        }
        Relationships: []
      }
      subscription_overrides: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          has_ai: boolean | null
          has_call_recording: boolean | null
          has_missed_call_sms: boolean | null
          has_sms: boolean | null
          has_voice: boolean | null
          has_voicemail: boolean | null
          id: string
          name: string
          phone_numbers: number
          sms_limit: number
          stripe_price_id: string
          voice_minutes: number
        }
        Insert: {
          created_at?: string | null
          has_ai?: boolean | null
          has_call_recording?: boolean | null
          has_missed_call_sms?: boolean | null
          has_sms?: boolean | null
          has_voice?: boolean | null
          has_voicemail?: boolean | null
          id?: string
          name: string
          phone_numbers?: number
          sms_limit: number
          stripe_price_id: string
          voice_minutes: number
        }
        Update: {
          created_at?: string | null
          has_ai?: boolean | null
          has_call_recording?: boolean | null
          has_missed_call_sms?: boolean | null
          has_sms?: boolean | null
          has_voice?: boolean | null
          has_voicemail?: boolean | null
          id?: string
          name?: string
          phone_numbers?: number
          sms_limit?: number
          stripe_price_id?: string
          voice_minutes?: number
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      team_availability: {
        Row: {
          business_id: string
          created_at: string
          date: string
          end_time: string | null
          id: string
          reason: string | null
          start_time: string | null
          team_member_id: string
          type: string
        }
        Insert: {
          business_id: string
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          reason?: string | null
          start_time?: string | null
          team_member_id: string
          type?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          reason?: string | null
          start_time?: string | null
          team_member_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_availability_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_availability_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          business_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["team_role"]
          status: string
          token: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: string
          token?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          business_id: string
          commission_pct: number
          created_at: string
          email: string
          emergency_contact: string | null
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          overtime_multiplier: number
          pay_rate_cents: number | null
          pay_type: string | null
          phone: string | null
          role: Database["public"]["Enums"]["team_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          commission_pct?: number
          created_at?: string
          email: string
          emergency_contact?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          overtime_multiplier?: number
          pay_rate_cents?: number | null
          pay_type?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          commission_pct?: number
          created_at?: string
          email?: string
          emergency_contact?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          overtime_multiplier?: number
          pay_rate_cents?: number | null
          pay_type?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_blog_posts: {
        Row: {
          body_md: string | null
          business_id: string
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          published_at: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body_md?: string | null
          business_id: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body_md?: string | null
          business_id?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_blog_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_site_areas: {
        Row: {
          body: string | null
          business_id: string
          city: string
          created_at: string
          headline: string | null
          id: string
          is_active: boolean
          slug: string
          state: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          business_id: string
          city: string
          created_at?: string
          headline?: string | null
          id?: string
          is_active?: boolean
          slug: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          business_id?: string
          city?: string
          created_at?: string
          headline?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_site_areas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_site_faqs: {
        Row: {
          answer: string
          business_id: string
          created_at: string
          id: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          business_id: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          business_id?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_site_faqs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_site_services: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          price_from: number | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_from?: number | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_from?: number | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_site_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_sites: {
        Row: {
          about_text: string | null
          accent_color: string
          address: string | null
          business_id: string
          created_at: string
          cta_text: string | null
          email: string | null
          generated_at: string | null
          hero_headline: string | null
          hero_image_url: string | null
          hero_subheadline: string | null
          hours: Json | null
          id: string
          meta_description: string | null
          meta_title: string | null
          nav_items: Json | null
          phone: string | null
          primary_color: string
          published: boolean
          socials: Json | null
          tagline: string | null
          theme: string
          updated_at: string
        }
        Insert: {
          about_text?: string | null
          accent_color?: string
          address?: string | null
          business_id: string
          created_at?: string
          cta_text?: string | null
          email?: string | null
          generated_at?: string | null
          hero_headline?: string | null
          hero_image_url?: string | null
          hero_subheadline?: string | null
          hours?: Json | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          nav_items?: Json | null
          phone?: string | null
          primary_color?: string
          published?: boolean
          socials?: Json | null
          tagline?: string | null
          theme?: string
          updated_at?: string
        }
        Update: {
          about_text?: string | null
          accent_color?: string
          address?: string | null
          business_id?: string
          created_at?: string
          cta_text?: string | null
          email?: string | null
          generated_at?: string | null
          hero_headline?: string | null
          hero_image_url?: string | null
          hero_subheadline?: string | null
          hours?: Json | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          nav_items?: Json | null
          phone?: string | null
          primary_color?: string
          published?: boolean
          socials?: Json | null
          tagline?: string | null
          theme?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_sites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          business_id: string
          clock_in: string
          clock_in_accuracy: number | null
          clock_in_lat: number | null
          clock_in_lng: number | null
          clock_out: string | null
          clock_out_accuracy: number | null
          clock_out_lat: number | null
          clock_out_lng: number | null
          created_at: string
          geofence_ok: boolean | null
          id: string
          job_id: string | null
          minutes: number | null
          notes: string | null
          team_member_id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          clock_in?: string
          clock_in_accuracy?: number | null
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out?: string | null
          clock_out_accuracy?: number | null
          clock_out_lat?: number | null
          clock_out_lng?: number | null
          created_at?: string
          geofence_ok?: boolean | null
          id?: string
          job_id?: string | null
          minutes?: number | null
          notes?: string | null
          team_member_id: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          clock_in?: string
          clock_in_accuracy?: number | null
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out?: string | null
          clock_out_accuracy?: number | null
          clock_out_lat?: number | null
          clock_out_lng?: number | null
          created_at?: string
          geofence_ok?: boolean | null
          id?: string
          job_id?: string | null
          minutes?: number | null
          notes?: string | null
          team_member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      twilio_calls: {
        Row: {
          answered_by: string | null
          business_id: string
          call_sid: string
          created_at: string | null
          customer_id: string | null
          direction: string
          duration: number | null
          ended_at: string | null
          from_number: string
          id: string
          recording_sid: string | null
          recording_url: string | null
          started_at: string | null
          status: string | null
          to_number: string
        }
        Insert: {
          answered_by?: string | null
          business_id: string
          call_sid: string
          created_at?: string | null
          customer_id?: string | null
          direction: string
          duration?: number | null
          ended_at?: string | null
          from_number: string
          id?: string
          recording_sid?: string | null
          recording_url?: string | null
          started_at?: string | null
          status?: string | null
          to_number: string
        }
        Update: {
          answered_by?: string | null
          business_id?: string
          call_sid?: string
          created_at?: string | null
          customer_id?: string | null
          direction?: string
          duration?: number | null
          ended_at?: string | null
          from_number?: string
          id?: string
          recording_sid?: string | null
          recording_url?: string | null
          started_at?: string | null
          status?: string | null
          to_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "twilio_calls_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "twilio_calls_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      twilio_logs: {
        Row: {
          action: string
          business_id: string | null
          created_at: string | null
          id: string
          level: string | null
          message: string | null
          payload: Json | null
          resource: string | null
          resource_sid: string | null
        }
        Insert: {
          action: string
          business_id?: string | null
          created_at?: string | null
          id?: string
          level?: string | null
          message?: string | null
          payload?: Json | null
          resource?: string | null
          resource_sid?: string | null
        }
        Update: {
          action?: string
          business_id?: string | null
          created_at?: string | null
          id?: string
          level?: string | null
          message?: string | null
          payload?: Json | null
          resource?: string | null
          resource_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "twilio_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      twilio_messages: {
        Row: {
          body: string | null
          business_id: string | null
          created_at: string | null
          customer_phone: string | null
          direction: string | null
          id: string
          message_sid: string | null
          status: string | null
        }
        Insert: {
          body?: string | null
          business_id?: string | null
          created_at?: string | null
          customer_phone?: string | null
          direction?: string | null
          id?: string
          message_sid?: string | null
          status?: string | null
        }
        Update: {
          body?: string | null
          business_id?: string | null
          created_at?: string | null
          customer_phone?: string | null
          direction?: string | null
          id?: string
          message_sid?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "twilio_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      twilio_phone_numbers: {
        Row: {
          active: boolean | null
          business_id: string
          capabilities: Json | null
          friendly_name: string | null
          id: string
          phone_number: string
          phone_sid: string
          purchased_at: string | null
        }
        Insert: {
          active?: boolean | null
          business_id: string
          capabilities?: Json | null
          friendly_name?: string | null
          id?: string
          phone_number: string
          phone_sid: string
          purchased_at?: string | null
        }
        Update: {
          active?: boolean | null
          business_id?: string
          capabilities?: Json | null
          friendly_name?: string | null
          id?: string
          phone_number?: string
          phone_sid?: string
          purchased_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "twilio_phone_numbers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      twilio_templates: {
        Row: {
          active: boolean | null
          business_id: string | null
          created_at: string | null
          id: string
          message: string | null
          template_name: string | null
        }
        Insert: {
          active?: boolean | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          template_name?: string | null
        }
        Update: {
          active?: boolean | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "twilio_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      twilio_usage: {
        Row: {
          billing_month: string
          business_id: string
          id: string
          sms_used: number | null
          updated_at: string | null
          voice_minutes_used: number | null
        }
        Insert: {
          billing_month: string
          business_id: string
          id?: string
          sms_used?: number | null
          updated_at?: string | null
          voice_minutes_used?: number | null
        }
        Update: {
          billing_month?: string
          business_id?: string
          id?: string
          sms_used?: number | null
          updated_at?: string | null
          voice_minutes_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "twilio_usage_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      twilio_usage_logs: {
        Row: {
          business_id: string
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          quantity: number
          reference_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          quantity: number
          reference_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          quantity?: number
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "twilio_usage_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      twilio_voicemails: {
        Row: {
          business_id: string
          call_sid: string
          caller_number: string | null
          created_at: string | null
          customer_id: string | null
          duration: number | null
          id: string
          listened: boolean | null
          recording_sid: string | null
          recording_url: string
          transcription: string | null
        }
        Insert: {
          business_id: string
          call_sid: string
          caller_number?: string | null
          created_at?: string | null
          customer_id?: string | null
          duration?: number | null
          id?: string
          listened?: boolean | null
          recording_sid?: string | null
          recording_url: string
          transcription?: string | null
        }
        Update: {
          business_id?: string
          call_sid?: string
          caller_number?: string | null
          created_at?: string | null
          customer_id?: string | null
          duration?: number | null
          id?: string
          listened?: boolean | null
          recording_sid?: string | null
          recording_url?: string
          transcription?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "twilio_voicemails_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "twilio_voicemails_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      voicemail_messages: {
        Row: {
          business_id: string
          call_sid: string | null
          created_at: string | null
          duration_seconds: number | null
          from_number: string | null
          id: string
          recording_sid: string | null
          recording_url: string | null
          status: string | null
          transcription: string | null
        }
        Insert: {
          business_id: string
          call_sid?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          from_number?: string | null
          id?: string
          recording_sid?: string | null
          recording_url?: string | null
          status?: string | null
          transcription?: string | null
        }
        Update: {
          business_id?: string
          call_sid?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          from_number?: string | null
          id?: string
          recording_sid?: string | null
          recording_url?: string | null
          status?: string | null
          transcription?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voicemail_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      voicemails: {
        Row: {
          ai_summary: string | null
          business_id: string
          caller_number: string
          created_at: string | null
          customer_name: string | null
          duration_seconds: number | null
          id: string
          intent: string | null
          phone_number: string
          recommended_action: string | null
          recording_sid: string
          recording_url: string
          sentiment: string | null
          status: string | null
          tags: Json | null
          transcription: string | null
          urgency: string | null
        }
        Insert: {
          ai_summary?: string | null
          business_id: string
          caller_number: string
          created_at?: string | null
          customer_name?: string | null
          duration_seconds?: number | null
          id?: string
          intent?: string | null
          phone_number: string
          recommended_action?: string | null
          recording_sid: string
          recording_url: string
          sentiment?: string | null
          status?: string | null
          tags?: Json | null
          transcription?: string | null
          urgency?: string | null
        }
        Update: {
          ai_summary?: string | null
          business_id?: string
          caller_number?: string
          created_at?: string | null
          customer_name?: string | null
          duration_seconds?: number | null
          id?: string
          intent?: string | null
          phone_number?: string
          recommended_action?: string | null
          recording_sid?: string
          recording_url?: string
          sentiment?: string | null
          status?: string | null
          tags?: Json | null
          transcription?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voicemails_business_id_fkey"
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
      _log_call_quote_event: {
        Args: { p_event_type: string; p_meta: Json; p_quote_id: string }
        Returns: undefined
      }
      accept_call_quote: { Args: { p_token: string }; Returns: undefined }
      apply_checklist_template_to_job: {
        Args: { p_job_id: string; p_template_id: string }
        Returns: number
      }
      bulk_apply_default_checklist_templates: {
        Args: { p_business_id: string }
        Returns: number
      }
      customer_update_call_quote_config: {
        Args: { p_config: Json; p_token: string }
        Returns: Json
      }
      customer_update_call_quote_frequency: {
        Args: { p_frequency: string; p_token: string }
        Returns: Json
      }
      customer_update_call_quote_selection: {
        Args: { p_included_addon_ids: string[]; p_token: string }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_call_quote_by_token: { Args: { p_token: string }; Returns: Json }
      get_call_quote_events_by_token: {
        Args: { p_token: string }
        Returns: {
          created_at: string
          event_type: string
          meta: Json
        }[]
      }
      get_cleaning_custom_services: {
        Args: { p_business_id: string }
        Returns: {
          enabled: boolean
          id: string
          label: string
          price: number
          sort_order: number
        }[]
      }
      get_cleaning_wizard_config: {
        Args: { p_business_id: string }
        Returns: {
          business_id: string
          commercial_addons: Json
          commercial_rates: Json
          condition_multipliers: Json
          created_at: string
          custom_services: Json
          frequencies: Json
          hide_price_above_sqft: number
          id: string
          min_commercial: number
          min_residential: number
          residential_addons: Json
          residential_rates: Json
          services: Json
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "cleaning_wizard_config"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_invoice_for_payment: { Args: { p_invoice_id: string }; Returns: Json }
      get_just_purchased_gift_card: {
        Args: { p_buyer_email: string; p_id: string }
        Returns: {
          code: string
          expires_at: string
        }[]
      }
      get_portal_bundle: { Args: { p_token: string }; Returns: Json }
      get_portal_token_data: {
        Args: { p_token: string }
        Returns: {
          business_id: string
          customer_id: string
        }[]
      }
      get_pricing_rules_for_token: { Args: { p_token: string }; Returns: Json }
      get_public_business_by_id: {
        Args: { p_id: string }
        Returns: {
          city: string
          email: string
          id: string
          industry: string
          logo_url: string
          name: string
          phone: string
          slug: string
          state: string
          website: string
        }[]
      }
      get_public_business_by_slug: {
        Args: { p_slug: string }
        Returns: {
          city: string
          email: string
          id: string
          industry: string
          logo_url: string
          name: string
          phone: string
          slug: string
          state: string
          website: string
        }[]
      }
      get_review_token_bundle: { Args: { p_token: string }; Returns: Json }
      get_review_token_data: {
        Args: { p_token: string }
        Returns: {
          business_id: string
          customer_id: string
          id: string
          job_id: string
        }[]
      }
      get_tenant_site_bundle: { Args: { p_slug: string }; Returns: Json }
      increment_sms_usage: {
        Args: { p_business_id: string; p_quantity: number }
        Returns: undefined
      }
      increment_voice_usage: {
        Args: { p_business_id: string; p_minutes: number }
        Returns: undefined
      }
      lookup_coupon_by_code: {
        Args: { p_business_id: string; p_code: string }
        Returns: {
          code: string
          discount_type: string
          discount_value: number
          expires_at: string
          id: string
          single_use: boolean
          use_count: number
        }[]
      }
      lookup_gift_card_by_code: {
        Args: { p_code: string }
        Returns: {
          amount: number
          business_id: string
          cleaning_type: string
          code: string
          expires_at: string
          id: string
          recipient_name: string
          rooms_included: string[]
          status: string
        }[]
      }
      mark_call_quote_viewed: { Args: { p_token: string }; Returns: undefined }
      mark_review_token_used: { Args: { p_token: string }; Returns: undefined }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      portal_approve_quote: {
        Args: { p_approve: boolean; p_quote_id: string; p_token: string }
        Returns: undefined
      }
      portal_submit_service_request: {
        Args: {
          p_address: string
          p_description: string
          p_preferred_date: string
          p_preferred_time: string
          p_title: string
          p_token: string
        }
        Returns: string
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      request_public_gift_card: {
        Args: { p_business_id: string; p_payload: Json }
        Returns: string
      }
      search_public_businesses: {
        Args: { p_query: string }
        Returns: {
          city: string
          id: string
          industry: string
          name: string
          slug: string
          state: string
        }[]
      }
      submit_public_booking_request: {
        Args: { p_business_id: string; p_payload: Json }
        Returns: string
      }
      submit_review_with_token: {
        Args: { p_comment: string; p_rating: number; p_token: string }
        Returns: string
      }
    }
    Enums: {
      invoice_status:
        | "draft"
        | "sent"
        | "viewed"
        | "paid"
        | "overdue"
        | "cancelled"
      job_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      payment_method: "card" | "ach" | "cash" | "check" | "other"
      quote_status:
        | "draft"
        | "sent"
        | "viewed"
        | "approved"
        | "declined"
        | "expired"
      team_role: "admin" | "manager" | "technician"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      invoice_status: [
        "draft",
        "sent",
        "viewed",
        "paid",
        "overdue",
        "cancelled",
      ],
      job_status: ["scheduled", "in_progress", "completed", "cancelled"],
      payment_method: ["card", "ach", "cash", "check", "other"],
      quote_status: [
        "draft",
        "sent",
        "viewed",
        "approved",
        "declined",
        "expired",
      ],
      team_role: ["admin", "manager", "technician"],
    },
  },
} as const
