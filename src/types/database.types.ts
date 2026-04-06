//src/types/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_activities: {
        Row: {
          action: string;
          created_at: string | null;
          id: string;
          request_id: string | null;
          staff_id: string;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          id?: string;
          request_id?: string | null;
          staff_id: string;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          id?: string;
          request_id?: string | null;
          staff_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_activities_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_activities_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      aircraft_classes: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          price_per_km_max: number | null;
          price_per_km_min: number | null;
          priority: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          price_per_km_max?: number | null;
          price_per_km_min?: number | null;
          priority?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          price_per_km_max?: number | null;
          price_per_km_min?: number | null;
          priority?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      aircraft_listings: {
        Row: {
          aircraft_type_id: string | null;
          created_at: string | null;
          created_by: string | null;
          currency_code: string | null;
          description: string | null;
          id: string;
          images: Json | null;
          price: number | null;
          registration_number: string | null;
          specifications: Json | null;
          status: string | null;
          title: string;
          updated_at: string | null;
          year: number | null;
        };
        Insert: {
          aircraft_type_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          currency_code?: string | null;
          description?: string | null;
          id?: string;
          images?: Json | null;
          price?: number | null;
          registration_number?: string | null;
          specifications?: Json | null;
          status?: string | null;
          title: string;
          updated_at?: string | null;
          year?: number | null;
        };
        Update: {
          aircraft_type_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          currency_code?: string | null;
          description?: string | null;
          id?: string;
          images?: Json | null;
          price?: number | null;
          registration_number?: string | null;
          specifications?: Json | null;
          status?: string | null;
          title?: string;
          updated_at?: string | null;
          year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "aircraft_listings_aircraft_type_id_fkey";
            columns: ["aircraft_type_id"];
            isOneToOne: false;
            referencedRelation: "aircraft_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "aircraft_listings_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      aircraft_types: {
        Row: {
          aircraft_class_id: string | null;
          altitude: number | null;
          cabin_height: number | null;
          cabin_length: number | null;
          cabin_width: number | null;
          created_at: string | null;
          cruise_speed_kt: number | null;
          description: string | null;
          icao: string | null;
          id: string;
          images: Json | null;
          luggage_volume: number | null;
          manufacturer_name: string | null;
          name: string;
          pax_maximum: number | null;
          range_maximum: number | null;
          slug: string | null;
          updated_at: string | null;
        };
        Insert: {
          aircraft_class_id?: string | null;
          altitude?: number | null;
          cabin_height?: number | null;
          cabin_length?: number | null;
          cabin_width?: number | null;
          created_at?: string | null;
          cruise_speed_kt?: number | null;
          description?: string | null;
          icao?: string | null;
          id?: string;
          images?: Json | null;
          luggage_volume?: number | null;
          manufacturer_name?: string | null;
          name: string;
          pax_maximum?: number | null;
          range_maximum?: number | null;
          slug?: string | null;
          updated_at?: string | null;
        };
        Update: {
          aircraft_class_id?: string | null;
          altitude?: number | null;
          cabin_height?: number | null;
          cabin_length?: number | null;
          cabin_width?: number | null;
          created_at?: string | null;
          cruise_speed_kt?: number | null;
          description?: string | null;
          icao?: string | null;
          id?: string;
          images?: Json | null;
          luggage_volume?: number | null;
          manufacturer_name?: string | null;
          name?: string;
          pax_maximum?: number | null;
          range_maximum?: number | null;
          slug?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "aircraft_types_aircraft_class_id_fkey";
            columns: ["aircraft_class_id"];
            isOneToOne: false;
            referencedRelation: "aircraft_classes";
            referencedColumns: ["id"];
          },
        ];
      };
      airports: {
        Row: {
          city: string | null;
          country: string | null;
          country_code: string | null;
          created_at: string | null;
          iata: string | null;
          icao: string;
          id: string;
          latitude: number | null;
          lid: string | null;
          longitude: number | null;
          name: string;
          slug: string | null;
          updated_at: string | null;
        };
        Insert: {
          city?: string | null;
          country?: string | null;
          country_code?: string | null;
          created_at?: string | null;
          iata?: string | null;
          icao: string;
          id?: string;
          latitude?: number | null;
          lid?: string | null;
          longitude?: number | null;
          name: string;
          slug?: string | null;
          updated_at?: string | null;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          country_code?: string | null;
          created_at?: string | null;
          iata?: string | null;
          icao?: string;
          id?: string;
          latitude?: number | null;
          lid?: string | null;
          longitude?: number | null;
          name?: string;
          slug?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          message: string;
          name: string;
          phone: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          message: string;
          name: string;
          phone?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          created_at: string | null;
          file_url: string;
          id: string;
          invoice_id: string | null;
          request_id: string | null;
          title: string | null;
          type: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          file_url: string;
          id?: string;
          invoice_id?: string | null;
          request_id?: string | null;
          title?: string | null;
          type?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          file_url?: string;
          id?: string;
          invoice_id?: string | null;
          request_id?: string | null;
          title?: string | null;
          type?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      empty_legs: {
        Row: {
          aircraft_type: string | null;
          aircraft_type_id: string | null;
          arr_airport_icao: string | null;
          arr_airport_id: string | null;
          arr_iata: string | null;
          comment: string | null;
          created_at: string | null;
          created_by: string | null;
          currency_code: string | null;
          dep_airport_icao: string | null;
          dep_airport_id: string | null;
          dep_iata: string | null;
          destination_description: string | null;
          destination_image_url: string | null;
          from_date_utc: string;
          id: string;
          is_public: boolean | null;
          price: number | null;
          price_type: Database["public"]["Enums"]["price_type"] | null;
          source: string;
          to_date_utc: string;
          updated_at: string | null;
        };
        Insert: {
          aircraft_type?: string | null;
          aircraft_type_id?: string | null;
          arr_airport_icao?: string | null;
          arr_airport_id?: string | null;
          arr_iata?: string | null;
          comment?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          currency_code?: string | null;
          dep_airport_icao?: string | null;
          dep_airport_id?: string | null;
          dep_iata?: string | null;
          destination_description?: string | null;
          destination_image_url?: string | null;
          from_date_utc: string;
          id?: string;
          is_public?: boolean | null;
          price?: number | null;
          price_type?: Database["public"]["Enums"]["price_type"] | null;
          source: string;
          to_date_utc: string;
          updated_at?: string | null;
        };
        Update: {
          aircraft_type?: string | null;
          aircraft_type_id?: string | null;
          arr_airport_icao?: string | null;
          arr_airport_id?: string | null;
          arr_iata?: string | null;
          comment?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          currency_code?: string | null;
          dep_airport_icao?: string | null;
          dep_airport_id?: string | null;
          dep_iata?: string | null;
          destination_description?: string | null;
          destination_image_url?: string | null;
          from_date_utc?: string;
          id?: string;
          is_public?: boolean | null;
          price?: number | null;
          price_type?: Database["public"]["Enums"]["price_type"] | null;
          source?: string;
          to_date_utc?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "empty_legs_aircraft_type_id_fkey";
            columns: ["aircraft_type_id"];
            isOneToOne: false;
            referencedRelation: "aircraft_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "empty_legs_arr_airport_id_fkey";
            columns: ["arr_airport_id"];
            isOneToOne: false;
            referencedRelation: "airports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "empty_legs_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "empty_legs_dep_airport_id_fkey";
            columns: ["dep_airport_id"];
            isOneToOne: false;
            referencedRelation: "airports";
            referencedColumns: ["id"];
          },
        ];
      };
      invitations: {
        Row: {
          created_at: string | null;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          role: string;
          token: string;
          used_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          expires_at: string;
          id?: string;
          invited_by: string;
          role: string;
          token: string;
          used_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          role?: string;
          token?: string;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          amount: number;
          bank_details: Json | null;
          created_at: string | null;
          currency_code: string | null;
          id: string;
          paid_at: string | null;
          reference_code: string | null;
          request_id: string;
          sent_at: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          bank_details?: Json | null;
          created_at?: string | null;
          currency_code?: string | null;
          id?: string;
          paid_at?: string | null;
          reference_code?: string | null;
          request_id: string;
          sent_at?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          bank_details?: Json | null;
          created_at?: string | null;
          currency_code?: string | null;
          id?: string;
          paid_at?: string | null;
          reference_code?: string | null;
          request_id?: string;
          sent_at?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          attachment_urls: string[] | null;
          content: string;
          created_at: string | null;
          id: string;
          request_id: string;
          sender_id: string;
        };
        Insert: {
          attachment_urls?: string[] | null;
          content: string;
          created_at?: string | null;
          id?: string;
          request_id: string;
          sender_id: string;
        };
        Update: {
          attachment_urls?: string[] | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          request_id?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string | null;
          id: string;
          invoice_id: string;
          receipt_urls: string[] | null;
          reference: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string | null;
          id?: string;
          invoice_id: string;
          receipt_urls?: string[] | null;
          reference?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string | null;
          id?: string;
          invoice_id?: string;
          receipt_urls?: string[] | null;
          reference?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_confirmed_by_fkey";
            columns: ["confirmed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          country: string | null;
          created_at: string | null;
          id: string;
          onboarding_completed: boolean | null;
          phone: string | null;
          role: string;
          updated_at: string | null;
        };
        Insert: {
          country?: string | null;
          created_at?: string | null;
          id: string;
          onboarding_completed?: boolean | null;
          phone?: string | null;
          role?: string;
          updated_at?: string | null;
        };
        Update: {
          country?: string | null;
          created_at?: string | null;
          id?: string;
          onboarding_completed?: boolean | null;
          phone?: string | null;
          role?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      requests: {
        Row: {
          assigned_staff_id: string | null;
          closed_at: string | null;
          confirmation_document_data: Json | null;
          confirmation_document_sent_at: string | null;
          created_at: string | null;
          currency_code: string | null;
          details: Json;
          estimated_flight_time_minutes: number | null;
          id: string;
          price_agreed: number | null;
          status: Database["public"]["Enums"]["request_status"] | null;
          type: Database["public"]["Enums"]["request_type"];
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          assigned_staff_id?: string | null;
          closed_at?: string | null;
          confirmation_document_data?: Json | null;
          confirmation_document_sent_at?: string | null;
          created_at?: string | null;
          currency_code?: string | null;
          details: Json;
          estimated_flight_time_minutes?: number | null;
          id?: string;
          price_agreed?: number | null;
          status?: Database["public"]["Enums"]["request_status"] | null;
          type: Database["public"]["Enums"]["request_type"];
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          assigned_staff_id?: string | null;
          closed_at?: string | null;
          confirmation_document_data?: Json | null;
          confirmation_document_sent_at?: string | null;
          created_at?: string | null;
          currency_code?: string | null;
          details?: Json;
          estimated_flight_time_minutes?: number | null;
          id?: string;
          price_agreed?: number | null;
          status?: Database["public"]["Enums"]["request_status"] | null;
          type?: Database["public"]["Enums"]["request_type"];
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "requests_assigned_staff_id_fkey";
            columns: ["assigned_staff_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      distance_km: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number };
        Returns: number;
      };
      flight_duration_minutes: {
        Args: {
          arr_airport_id: string;
          cruise_speed_kt: number;
          dep_airport_id: string;
        };
        Returns: number;
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_manager: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: {
      price_type: "fixed" | "contact";
      request_status: "open" | "assigned" | "confirmed" | "closed";
      request_type: "charter" | "empty_leg_inquiry" | "aircraft_inquiry";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;
