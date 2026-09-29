export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'bursar' | 'teacher' | 'guardian';
export type LearnerStatus = 'active' | 'inactive' | 'transferred' | 'graduated';
export type RelationshipType = 'father' | 'mother' | 'guardian' | 'sponsor';
export type CbcPerformanceLevel = 'EE' | 'ME' | 'AE' | 'BE';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone_number: string | null;
          national_id: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone_number?: string | null;
          national_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone_number?: string | null;
          national_id?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: UserRole;
        };
      };
      academic_years: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          start_date: string;
          end_date: string;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          start_date?: string;
          end_date?: string;
          is_current?: boolean;
          updated_at?: string;
        };
      };
      terms: {
        Row: {
          id: string;
          academic_year_id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_current: boolean;
          next_term_start_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          academic_year_id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_current?: boolean;
          next_term_start_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          academic_year_id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          is_current?: boolean;
          next_term_start_date?: string | null;
          updated_at?: string;
        };
      };
      grade_levels: {
        Row: {
          id: string;
          name: string;
          category: string;
          order_index: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          order_index: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          category?: string;
          order_index?: number;
          is_active?: boolean;
        };
      };
      classes: {
        Row: {
          id: string;
          grade_level_id: string;
          name: string;
          stream: string;
          class_teacher_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          grade_level_id: string;
          name: string;
          stream?: string;
          class_teacher_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          grade_level_id?: string;
          name?: string;
          stream?: string;
          class_teacher_id?: string | null;
          updated_at?: string;
        };
      };
      learning_areas: {
        Row: {
          id: string;
          grade_level_id: string;
          name: string;
          code: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          grade_level_id: string;
          name: string;
          code: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          grade_level_id?: string;
          name?: string;
          code?: string;
          description?: string | null;
        };
      };
      students: {
        Row: {
          id: string;
          admission_number: string;
          first_name: string;
          middle_name: string | null;
          last_name: string;
          date_of_birth: string;
          gender: 'Male' | 'Female';
          nemis_upi: string | null;
          status: LearnerStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          admission_number: string;
          first_name: string;
          middle_name?: string | null;
          last_name: string;
          date_of_birth: string;
          gender: 'Male' | 'Female';
          nemis_upi?: string | null;
          status?: LearnerStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          admission_number?: string;
          first_name?: string;
          middle_name?: string | null;
          last_name?: string;
          date_of_birth?: string;
          gender?: 'Male' | 'Female';
          nemis_upi?: string | null;
          status?: LearnerStatus;
          updated_at?: string;
        };
      };
      guardians: {
        Row: {
          id: string;
          profile_id: string;
          relationship_description: string | null;
          primary_phone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          relationship_description?: string | null;
          primary_phone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          relationship_description?: string | null;
          primary_phone?: string;
          updated_at?: string;
        };
      };
      student_guardians: {
        Row: {
          id: string;
          student_id: string;
          guardian_id: string;
          relationship: RelationshipType;
          is_primary: boolean;
          can_pay: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          guardian_id: string;
          relationship?: RelationshipType;
          is_primary?: boolean;
          can_pay?: boolean;
          created_at?: string;
        };
        Update: {
          relationship?: RelationshipType;
          is_primary?: boolean;
          can_pay?: boolean;
        };
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          class_id: string;
          academic_year_id: string;
          enrolled_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          class_id: string;
          academic_year_id: string;
          enrolled_at?: string;
          created_at?: string;
        };
        Update: {
          class_id?: string;
          academic_year_id?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          before_data: Json | null;
          after_data: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          action?: string;
        };
      };
    };
  };
}
