import {
  Asset,
  AssetCategory,
  AssetStatus,
  AssetTransaction,
  AuditLog,
  DashboardStats,
  Location,
  Project,
  User,
} from '../types';
import * as MESSAGES from '../../shared/messages';

function getApiErrorMessage(body: { error?: string | { message?: string } }) {
  return typeof body.error === 'string' ? body.error : body.error?.message;
}

export interface CheckoutPayload {
  user_id: string;
  location_id?: string;
  note?: string;
  expected_return_at?: string;
}

export interface CheckinPayload {
  location_id: string;
  note?: string;
  returned_by_user_id?: string;
  condition_status?: AssetStatus;
}

export interface MovePayload {
  location_id: string;
  note?: string;
  user_id?: string;
}

export interface TransferProjectPayload {
  to_project_id: string;
  location_id?: string;
  note?: string;
  user_id?: string;
}

export interface CreateAssetPayload {
  asset_id?: string;
  asset_name: string;
  category_id: string;
  project_id?: string;
  serial_number?: string;
  rfid_code?: string;
  current_location_id?: string;
  description?: string;
  status?: AssetStatus;
}

export const api = {
  async getHealth(): Promise<{ status: string }> {
    const res = await fetch('/api/health');
    return res.json();
  },

  async resetData(): Promise<void> {
    await fetch('/api/reset-data', { method: 'POST' });
  },

  async getProjects(): Promise<Project[]> {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error(MESSAGES.DATA_REQUEST_FAILED);
    return res.json();
  },

  async createProject(payload: {
    project_name: string;
    project_code: string;
    address?: string;
    manager_user_id?: string;
    description?: string;
    status?: 'ACTIVE' | 'PLANNING' | 'COMPLETED';
  }): Promise<Project> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage(err) || MESSAGES.API_REQUEST_FAILED);
    }
    return res.json();
  },

  async getAssets(filters?: {
    status?: string;
    category?: string;
    location?: string;
    user?: string;
    project?: string;
    search?: string;
  }): Promise<Asset[]> {
    const params = new URLSearchParams();
    if (filters?.project && filters.project !== 'ALL') params.append('project', filters.project);
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters?.location && filters.location !== 'ALL') params.append('location', filters.location);
    if (filters?.user && filters.user !== 'ALL') params.append('user', filters.user);
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`/api/assets?${params.toString()}`);
    if (!res.ok) throw new Error(MESSAGES.DATA_REQUEST_FAILED);
    return res.json();
  },

  async searchAssets(query: string): Promise<Asset[]> {
    const res = await fetch(`/api/assets/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(MESSAGES.DATA_REQUEST_FAILED);
    return res.json();
  },

  async getAsset(assetId: string): Promise<Asset> {
    const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage(err) || MESSAGES.ASSET_NOT_FOUND());
    }
    return res.json();
  },

  async createAsset(payload: CreateAssetPayload): Promise<Asset> {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage(err) || MESSAGES.SAVE_FAILED);
    }
    return res.json();
  },

  async updateAsset(assetId: string, payload: Partial<Asset>): Promise<Asset> {
    const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage(err) || MESSAGES.SAVE_FAILED);
    }
    return res.json();
  },

  async updateAssetStatus(
    assetId: string,
    status: AssetStatus,
    note?: string,
    userId?: string
  ): Promise<Asset> {
    const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note, user_id: userId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage(err) || MESSAGES.STATUS_UPDATE_FAILED);
    }
    return res.json();
  },

  async checkoutAsset(
    assetId: string,
    payload: CheckoutPayload
  ): Promise<{ success: boolean; asset: Asset; transaction: AssetTransaction }> {
    const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage(err) || MESSAGES.CHECKOUT_FAILED);
    }
    return res.json();
  },

  async checkinAsset(
    assetId: string,
    payload: CheckinPayload
  ): Promise<{ success: boolean; asset: Asset; transaction: AssetTransaction }> {
    const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage(err) || MESSAGES.CHECKIN_FAILED);
    }
    return res.json();
  },

  async moveAsset(
    assetId: string,
    payload: MovePayload
  ): Promise<{ success: boolean; asset: Asset; transaction: AssetTransaction }> {
    const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage(err) || MESSAGES.MOVE_FAILED);
    }
    return res.json();
  },

  async transferAssetProject(
    assetId: string,
    payload: TransferProjectPayload
  ): Promise<{ success: boolean; asset: Asset; transaction: AssetTransaction }> {
    const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}/transfer-project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage(err) || MESSAGES.TRANSFER_FAILED);
    }
    return res.json();
  },

  async getAssetHistory(
    assetId: string
  ): Promise<(AssetTransaction & { user_name: string; location_name: string })[]> {
    const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}/history`);
    if (!res.ok) throw new Error(MESSAGES.DATA_REQUEST_FAILED);
    return res.json();
  },

  async getLocations(projectId?: string): Promise<Location[]> {
    const params = new URLSearchParams();
    if (projectId && projectId !== 'ALL') params.append('project_id', projectId);
    const res = await fetch(`/api/locations${params.toString() ? `?${params.toString()}` : ''}`);
    if (!res.ok) throw new Error(MESSAGES.DATA_REQUEST_FAILED);
    return res.json();
  },

  async createLocation(data: {
    location_name: string;
    location_type: string;
    parent_location_id?: string | null;
    project_id?: string | null;
    description?: string;
  }): Promise<Location> {
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(getApiErrorMessage(err) || MESSAGES.LOCATION_CREATE_FAILED);
    }
    return res.json();
  },

  async getCategories(): Promise<AssetCategory[]> {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error(MESSAGES.DATA_REQUEST_FAILED);
    return res.json();
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error(MESSAGES.DATA_REQUEST_FAILED);
    return res.json();
  },

  async getDashboardStats(projectId?: string): Promise<DashboardStats> {
    const query = projectId && projectId !== 'ALL' ? `?project=${encodeURIComponent(projectId)}` : '';
    const res = await fetch(`/api/dashboard/stats${query}`);
    if (!res.ok) throw new Error(MESSAGES.DATA_REQUEST_FAILED);
    return res.json();
  },

  async getStats(projectId?: string): Promise<DashboardStats> {
    return this.getDashboardStats(projectId);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error(MESSAGES.DATA_REQUEST_FAILED);
    return res.json();
  },
};
