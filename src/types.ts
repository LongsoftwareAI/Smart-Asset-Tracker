export enum AssetStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  LOST = 'LOST',
  DAMAGED = 'DAMAGED',
  INACTIVE = 'INACTIVE',
}

export type LocationType = 'SITE' | 'ZONE' | 'FLOOR' | 'ROOM' | 'AREA';

export interface Project {
  project_id: string;
  project_name: string;
  project_code: string;
  address?: string;
  manager_user_id?: string;
  status: 'ACTIVE' | 'PLANNING' | 'COMPLETED';
  start_date?: string;
  description?: string;
}

export interface Location {
  location_id: string;
  location_name: string;
  location_type: LocationType;
  parent_location_id: string | null;
  project_id?: string | null;
  description?: string;
  is_active: boolean;
}

export type UserRole = 'ADMIN' | 'STAFF' | 'MANAGER';

export interface User {
  user_id: string;
  name: string;
  role: UserRole;
  department: string;
  email: string;
  avatar?: string;
}

export interface AssetCategory {
  category_id: string;
  category_name: string;
  description?: string;
  icon?: string;
}

export interface Asset {
  asset_id: string;
  asset_name: string;
  category_id: string;
  project_id?: string | null;
  serial_number?: string;
  qr_code: string;
  rfid_code?: string;
  status: AssetStatus;
  current_location_id?: string | null;
  current_user_id?: string | null;
  created_at: string;
  updated_at: string;
  description?: string;
  is_active: boolean;
  checked_out_at?: string | null;
  expected_return_at?: string | null;
  image_url?: string;
}

export type TransactionType = 'CHECK_OUT' | 'CHECK_IN' | 'MOVE' | 'PROJECT_TRANSFER' | 'STATUS_CHANGE';

export interface AssetTransaction {
  transaction_id: string;
  asset_id: string;
  transaction_type: TransactionType;
  user_id: string;
  location_id: string;
  from_project_id?: string | null;
  to_project_id?: string | null;
  timestamp: string;
  note?: string;
  previous_status: AssetStatus;
  new_status: AssetStatus;
}

export interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  asset_id: string;
  asset_name: string;
  location_name: string;
  timestamp: string;
  details?: string;
}

export interface DashboardStats {
  total_assets: number;
  available: number;
  in_use: number;
  maintenance: number;
  lost: number;
  damaged: number;
  inactive: number;
  assets_by_location: {
    location_name: string;
    count: number;
  }[];
  assets_currently_in_use: {
    asset_id: string;
    asset_name: string;
    user_name: string;
    location_name: string;
    checked_out_at: string;
    expected_return_at?: string | null;
    is_overdue: boolean;
  }[];
  overdue_count: number;
  lost_count: number;
}
