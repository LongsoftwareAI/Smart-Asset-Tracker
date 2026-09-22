import { AssetStatus, Location, User, AssetCategory } from '../types';
import * as MESSAGES from '../../shared/messages';

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

export function formatTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

export function getStatusConfig(status: AssetStatus) {
  switch (status) {
    case AssetStatus.AVAILABLE:
      return {
        label: 'AVAILABLE',
        labelVi: 'Sẵn sàng',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeColor: 'bg-emerald-500',
        dot: 'bg-emerald-500',
        textColor: 'text-emerald-700',
        iconName: 'CheckCircle2',
      };
    case AssetStatus.IN_USE:
      return {
        label: 'IN USE',
        labelVi: 'Đang sử dụng',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        badgeColor: 'bg-amber-500',
        dot: 'bg-amber-500',
        textColor: 'text-amber-800',
        iconName: 'UserCheck',
      };
    case AssetStatus.MAINTENANCE:
      return {
        label: 'MAINTENANCE',
        labelVi: 'Bảo trì',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        badgeColor: 'bg-blue-500',
        dot: 'bg-blue-500',
        textColor: 'text-blue-700',
        iconName: 'Wrench',
      };
    case AssetStatus.LOST:
      return {
        label: 'LOST',
        labelVi: 'Thất lạc',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        badgeColor: 'bg-rose-500',
        dot: 'bg-rose-500 animate-ping',
        textColor: 'text-rose-700',
        iconName: 'AlertTriangle',
      };
    case AssetStatus.DAMAGED:
      return {
        label: 'DAMAGED',
        labelVi: 'Hư hỏng',
        bg: 'bg-red-50 text-red-800 border-red-200',
        badgeColor: 'bg-red-500',
        dot: 'bg-red-500',
        textColor: 'text-red-800',
        iconName: 'AlertOctagon',
      };
    case AssetStatus.INACTIVE:
      return {
        label: 'INACTIVE',
        labelVi: 'Không hoạt động',
        bg: 'bg-stone-100 text-stone-600 border-stone-200',
        badgeColor: 'bg-stone-400',
        dot: 'bg-stone-400',
        textColor: 'text-stone-600',
        iconName: 'XCircle',
      };
    default:
      return {
        label: status,
        labelVi: status,
        bg: 'bg-stone-100 text-stone-700 border-stone-200',
        badgeColor: 'bg-stone-400',
        dot: 'bg-stone-400',
        textColor: 'text-stone-700',
        iconName: 'HelpCircle',
      };
  }
}

export function getLocationName(locations: Location[], locationId?: string | null): string {
  if (!locationId) return MESSAGES.UNKNOWN_LOCATION;
  const loc = locations.find((l) => l.location_id === locationId);
  return loc ? loc.location_name : locationId;
}

export function getUserName(users: User[], userId?: string | null): string {
  if (!userId) return MESSAGES.NO_ASSIGNEE;
  const u = users.find((user) => user.user_id === userId);
  return u ? u.name : userId;
}

export function getCategoryName(categories: AssetCategory[], categoryId?: string | null): string {
  if (!categoryId) return MESSAGES.OTHER_CATEGORY;
  const cat = categories.find((c) => c.category_id === categoryId);
  return cat ? cat.category_name : categoryId;
}
