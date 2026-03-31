export type UserRole = 'admin' | 'coach' | 'equipment_manager'
export type ItemCondition = 'new' | 'good' | 'fair' | 'poor' | 'replace'
export type ItemStatus = 'available' | 'on_loan' | 'retired'
export type TransferStatus = 'pending' | 'accepted' | 'rejected'

export interface CustomFieldDef {
  name: string
  type: 'text' | 'number' | 'select'
  options?: string[] // for select type
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: UserRole
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role?: UserRole
          avatar_url?: string | null
        }
        Update: {
          full_name?: string
          role?: UserRole
          avatar_url?: string | null
          updated_at?: string
        }
      }
      equipment_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          custom_fields: CustomFieldDef[]
          created_at: string
        }
        Insert: { name: string; description?: string | null; custom_fields?: CustomFieldDef[] }
        Update: { name?: string; description?: string | null; custom_fields?: CustomFieldDef[] }
      }
      locations: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: { name: string; description?: string | null }
        Update: { name?: string; description?: string | null }
      }
      equipment_items: {
        Row: {
          id: string
          category_id: string
          home_location_id: string | null
          name: string
          asset_tag: string | null
          serial_number: string | null
          description: string | null
          purchase_date: string | null
          purchase_cost: number | null
          expected_life_years: number | null
          status: ItemStatus
          notes: string | null
          custom_attributes: Record<string, string>
          created_at: string
          updated_at: string
        }
        Insert: {
          category_id: string
          name: string
          home_location_id?: string | null
          asset_tag?: string | null
          serial_number?: string | null
          description?: string | null
          purchase_date?: string | null
          purchase_cost?: number | null
          expected_life_years?: number | null
          status?: ItemStatus
          notes?: string | null
          custom_attributes?: Record<string, string>
        }
        Update: {
          category_id?: string
          name?: string
          home_location_id?: string | null
          asset_tag?: string | null
          serial_number?: string | null
          description?: string | null
          purchase_date?: string | null
          purchase_cost?: number | null
          expected_life_years?: number | null
          status?: ItemStatus
          notes?: string | null
          custom_attributes?: Record<string, string>
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          full_name: string
          jersey_number: number | null
          position: string | null
          email: string | null
          phone: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          full_name: string
          jersey_number?: number | null
          position?: string | null
          email?: string | null
          phone?: string | null
          is_active?: boolean
        }
        Update: {
          full_name?: string
          jersey_number?: number | null
          position?: string | null
          email?: string | null
          phone?: string | null
          is_active?: boolean
        }
      }
      equipment_loans: {
        Row: {
          id: string
          item_id: string
          player_id: string | null
          recipient_name: string | null
          checked_out_by: string
          checked_out_at: string
          expected_return_date: string | null
          purpose: string | null
          location_while_out: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          return_notes: string | null
          created_at: string
        }
        Insert: {
          item_id: string
          checked_out_by: string
          player_id?: string | null
          recipient_name?: string | null
          expected_return_date?: string | null
          purpose?: string | null
          location_while_out?: string | null
        }
        Update: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          return_notes?: string | null
        }
      }
      condition_logs: {
        Row: {
          id: string
          item_id: string
          assessed_by: string
          assessed_at: string
          condition: ItemCondition
          notes: string | null
          photo_url: string | null
        }
        Insert: {
          item_id: string
          assessed_by: string
          condition: ItemCondition
          notes?: string | null
          photo_url?: string | null
          assessed_at?: string
        }
        Update: {
          condition?: ItemCondition
          notes?: string | null
          photo_url?: string | null
        }
      }
      equipment_packages: {
        Row: {
          id: string
          name: string
          description: string | null
          season: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
          season?: string | null
          assigned_to?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          season?: string | null
          assigned_to?: string | null
          updated_at?: string
        }
      }
      package_items: {
        Row: {
          id: string
          package_id: string
          item_id: string
          added_at: string
        }
        Insert: {
          package_id: string
          item_id: string
        }
        Update: {}
      }
      equipment_transfers: {
        Row: {
          id: string
          loan_id: string
          item_id: string
          from_profile_id: string
          to_profile_id: string
          status: TransferStatus
          notes: string | null
          initiated_at: string
          responded_at: string | null
          created_at: string
        }
        Insert: {
          loan_id: string
          item_id: string
          from_profile_id: string
          to_profile_id: string
          notes?: string | null
        }
        Update: {
          status?: TransferStatus
          responded_at?: string | null
        }
      }
    }
    Views: {}
    Functions: {
      is_admin: { Returns: boolean }
      complete_transfer: { Args: { p_transfer_id: string }; Returns: void }
    }
    Enums: {
      user_role: UserRole
      item_condition: ItemCondition
      item_status: ItemStatus
      transfer_status: TransferStatus
    }
  }
}
