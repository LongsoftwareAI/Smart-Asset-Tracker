import React, { useState } from 'react';
import { X, ArrowRightLeft, MapPin, ArrowDown, Check } from 'lucide-react';
import { Asset, Location, User } from '../types';
import { api } from '../services/api';
import { getLocationName } from '../utils/formatters';

interface MoveModalProps {
  asset: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
  locations: Location[];
  users: User[];
}

export const MoveModal: React.FC<MoveModalProps> = ({
  asset,
  onClose,
  onSuccess,
  locations,
  users,
}) => {
  const [newLocationId, setNewLocationId] = useState<string>(
    locations.find((l) => l.location_id !== asset?.current_location_id)?.location_id || ''
  );
  const [userId, setUserId] = useState<string>(asset?.current_user_id || users[0]?.user_id || '');
  const [note, setNote] = useState<string>('Di chuyển thiết bị sang khu vực làm việc mới');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!asset) return null;

  const currentLocationName = getLocationName(locations, asset.current_location_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationId) {
      setErrorMsg('Vui lòng chọn vị trí mới');
      return;
    }
    if (newLocationId === asset.current_location_id) {
      setErrorMsg('Vị trí mới phải khác vị trí hiện tại');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await api.moveAsset(asset.asset_id, {
        location_id: newLocationId,
        user_id: userId,
        note,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Di chuyển thất bại');
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
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">Move (Chuyển vị trí thiết bị)</h3>
              <p className="text-[11px] text-slate-400">Cập nhật vị trí công tác mới</p>
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
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Cập nhật vị trí công tác mới của thiết bị trong ca làm việc mà không cần phải làm thủ tục Check-in/Check-out lại từ đầu.
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Movement Graphic (Section 14 UI) */}
          <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
            {/* Current Location */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Current Location (Vị trí hiện tại):
              </span>
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-800 dark:text-white mt-1">
                <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span>{currentLocationName}</span>
              </div>
            </div>

            {/* Down Arrow */}
            <div className="flex items-center justify-center py-1 text-blue-600 dark:text-blue-400">
              <div className="flex items-center space-x-1 px-3 py-1 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-full text-xs font-semibold">
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                <span>Move Asset</span>
              </div>
            </div>

            {/* New Location Selector */}
            <div>
              <label className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider block mb-1">
                New Location (Vị trí mới đến) *
              </label>
              <select
                id="move-new-location-select"
                value={newLocationId}
                onChange={(e) => setNewLocationId(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                required
              >
                <option value="">-- Chọn vị trí mới --</option>
                {(() => {
                  const sameProjectLocs = locations.filter(
                    (loc) => (loc.project_id === asset.project_id || (!loc.project_id && asset.project_id === 'PROJ-CENTRAL')) && loc.location_id !== asset.current_location_id
                  );
                  const otherLocs = locations.filter(
                    (loc) => loc.project_id !== asset.project_id && (loc.project_id || asset.project_id !== 'PROJ-CENTRAL') && loc.location_id !== asset.current_location_id
                  );

                  return (
                    <>
                      {sameProjectLocs.length > 0 && (
                        <optgroup label="📍 Khu vực trong cùng dự án này">
                          {sameProjectLocs.map((loc) => (
                            <option key={loc.location_id} value={loc.location_id}>
                              [{loc.location_type}] {loc.location_name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {otherLocs.length > 0 && (
                        <optgroup label="🌐 Khu vực dự án khác (Nên dùng tính năng Điều chuyển)">
                          {otherLocs.map((loc) => (
                            <option key={loc.location_id} value={loc.location_id}>
                              [{loc.location_type}] {loc.location_name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  );
                })()}
              </select>
            </div>
          </div>

          {/* User handling */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Người thực hiện di chuyển
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name} — {u.department}
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lý do di chuyển (Ghi chú)</label>
            <input
              id="move-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Đưa lên tầng 2 Zone B khoan giầm thép..."
              className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            Hủy
          </button>
          <button
            id="btn-confirm-move"
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center space-x-2 min-h-[44px]"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Đang cập nhật...' : 'XÁC NHẬN MOVE'}</span>
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
