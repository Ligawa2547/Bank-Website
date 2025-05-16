export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name?: string
          last_name?: string
          phone?: string
          account_no?: string
          balance?: number
          created_at?: string
          updated_at?: string
          avatar_url?: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string
          last_name?: string
          phone?: string
          account_no?: string
          balance?: number
          created_at?: string
          updated_at?: string
          avatar_url?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string
          account_no?: string
          balance?: number
          created_at?: string
          updated_at?: string
          avatar_url?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          account_no?: string
          balance?: number
          created_at?: string
          updated_at?: string
          avatar_url?: string
        }
        Insert: {
          id: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          account_no?: string
          balance?: number
          created_at?: string
          updated_at?: string
          avatar_url?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          account_no?: string
          balance?: number
          created_at?: string
          updated_at?: string
          avatar_url?: string
        }
      }
    }
  }
}
