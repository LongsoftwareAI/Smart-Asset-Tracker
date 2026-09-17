import React, { useState } from 'react';
import { X, LogOut, AlertCircle, Calendar, MapPin, User as UserIcon, Check } from 'lucide-react';
import { Asset, AssetCategory, AssetStatus, Location, User } from '../types';
import { api } from '../services/api';
import { getCategoryName, getLocationName, getUserName } from '../utils/formatters';

interface CheckoutModalProps {
  asset: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
  users: User[];
  locations: Location[];
  categories: AssetCategory[];
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  asset,
  onClose,
  onSuccess,
  users,
  locations,
  categories,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.user_id || '');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    asset?.current_location_id || locations[0]?.location_id || ''
  );
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>('');
  const [note, setNote] = useState<string>('Mượn thiết bị phục vụ thi công');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!asset) return null;

  // BR-004 & AC-004 Check
  const isBlocked = asset.status !== AssetStatus.AVAILABLE;
  const currentOwner = getUserName(users, asset.current_user_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) {
      setErrorMsg(`Asset is currently in use by ${currentOwner || 'another user'}. (BR-004)`);
      return;
    }

    if (!selectedUserId) {
      setErrorMsg('Vui lòng chọn người sử dụng (Used by)');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await api.checkoutAsset(asset.asset_id, {
        user_id: selectedUserId,
        location_id: selectedLocationId,
        note,
        expected_return_at: expectedReturnDate ? new Date(expectedReturnDate).toISOString() : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Check-out thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">Check-out (Mượn tài sản)</h3>
              <p className="text-[11px] text-slate-400">Gán người chịu trách nhiệm & vị trí</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto overflow-x-hidden flex-1">
          {/* Asset Summary Box (Section 12) */}
          <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded">
                  {asset.asset_id}
                </span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{asset.asset_name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {getCategoryName(categories, asset.category_id)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Status:</span>
                <span
                  className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                    asset.status === AssetStatus.AVAILABLE
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {asset.status}
                </span>
              </div>
            </div>
          </div>

          {/* Validation Warning if not AVAILABLE (AC-004) */}
          {isBlocked && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start space-x-2 text-rose-800 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Không thể Check-out:</strong>
                Asset is currently in use by {currentOwner || 'người khác'}. Trạng thái hiện tại: {asset.status}. (Tuân thủ BR-004 & AC-004).
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Used By Dropdown (Section 12: Used by: [ Nguyen Van A ▼ ]) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Người sử dụng (Used by) *</span>
            </label>
            <select
              id="checkout-user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isBlocked}
              className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              required
            >
              <option value="">-- Chọn nhân viên tiếp nhận --</option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name} — {u.department} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Location Dropdown (Section 12: Location: [ Zone B ▼ ]) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Vị trí mang đến sử dụng (Location) *</span>
            </label>
            <select
              id="checkout-location-select"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              disabled={isBlocked}
              className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              required
            >
              {locations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.location_name} ({loc.location_type})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Hệ thống sẽ cập nhật đây là vị trí ghi nhận mới nhất (Last Known Location).
            </p>
          </div>

          {/* Expected Return Date (Section 22 Cảnh báo Overdue) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Thời gian dự kiến hoàn trả (Expected return)</span>
            </label>
            <input
              id="checkout-expected-return"
              type="datetime-local"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              disabled={isBlocked}
              className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Note Input (Section 12: Note: [______]) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ghi chú (Note)</label>
            <input
              id="checkout-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Mục đích sử dụng, vị trí chi tiết..."
              disabled={isBlocked}
              className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Clean Pinned Footer */}
        <div className="shrink-0 bg-slate-50/95 dark:bg-slate-800/95 border-t border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            Hủy bỏ
          </button>
          <button
            id="btn-confirm-checkout"
            type="submit"
            disabled={isBlocked || loading}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center space-x-2 min-h-[44px]"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Đang xử lý...' : 'XÁC NHẬN CHECK-OUT'}</span>
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
