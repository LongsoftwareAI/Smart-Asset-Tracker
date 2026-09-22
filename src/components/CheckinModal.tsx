import React, { useState } from 'react';
import { X, LogIn, MapPin, CheckCircle, AlertTriangle, User as UserIcon } from 'lucide-react';
import { Asset, AssetStatus, Location, User } from '../types';
import { api } from '../services/api';
import { getUserName } from '../utils/formatters';
import * as MESSAGES from '../../shared/messages';

interface CheckinModalProps {
  asset: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
  users: User[];
  locations: Location[];
}

export const CheckinModal: React.FC<CheckinModalProps> = ({
  asset,
  onClose,
  onSuccess,
  users,
  locations,
}) => {
  // Default return location is Warehouse
  const defaultWarehouse = locations.find((l) => l.location_id.toLowerCase().includes('warehouse'))?.location_id
    || locations[0]?.location_id
    || '';

  const [returnLocationId, setReturnLocationId] = useState<string>(defaultWarehouse);
  const [returnedByUserId, setReturnedByUserId] = useState<string>(asset?.current_user_id || users[0]?.user_id || '');
  const [conditionStatus, setConditionStatus] = useState<AssetStatus>(AssetStatus.AVAILABLE);
  const [note, setNote] = useState<string>(MESSAGES.CHECKIN_DEFAULT_NOTE);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!asset) return null;

  const currentHolderName = getUserName(users, asset.current_user_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await api.checkinAsset(asset.asset_id, {
        location_id: returnLocationId,
        returned_by_user_id: returnedByUserId,
        condition_status: conditionStatus,
        note,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || MESSAGES.CHECKIN_FAILED);
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
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">{MESSAGES.CHECKIN_TITLE}</h3>
              <p className="text-[11px] text-slate-400">{MESSAGES.CHECKIN_HELP}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={MESSAGES.CLOSE_MODAL}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto overflow-x-hidden flex-1">
          {/* Asset Summary Box */}
          <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded">
                  {asset.asset_id}
                </span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{asset.asset_name}</h4>
                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center space-x-1 mt-1">
                  <UserIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>{MESSAGES.CURRENT_HOLDER} <strong>{currentHolderName}</strong></span>
                </div>
              </div>
              <div className="text-right">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">{MESSAGES.CHECKIN_STATUS_LABEL}</span>
                <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  {conditionStatus}
                </span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Return Location Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{MESSAGES.RETURN_LOCATION_LABEL}</span>
            </label>
            <select
              id="checkin-location-select"
              value={returnLocationId}
              onChange={(e) => setReturnLocationId(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {locations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.location_name} ({loc.location_type})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {MESSAGES.WAREHOUSE_RETURN_HELP}
            </p>
          </div>

          {/* Returned by User */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>{MESSAGES.RETURNED_BY_LABEL}</span>
            </label>
            <select
              id="checkin-user-select"
              value={returnedByUserId}
              onChange={(e) => setReturnedByUserId(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name} — {u.department}
                </option>
              ))}
            </select>
          </div>

          {/* Condition check */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {MESSAGES.DEVICE_CONDITION}
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConditionStatus(AssetStatus.AVAILABLE)}
                className={`p-2 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                  conditionStatus === AssetStatus.AVAILABLE
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {MESSAGES.GOOD_AVAILABLE}
              </button>
              <button
                type="button"
                onClick={() => setConditionStatus(AssetStatus.MAINTENANCE)}
                className={`p-2 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                  conditionStatus === AssetStatus.MAINTENANCE
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-800 dark:text-blue-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {MESSAGES.NEEDS_MAINTENANCE}
              </button>
              <button
                type="button"
                onClick={() => setConditionStatus(AssetStatus.DAMAGED)}
                className={`p-2 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                  conditionStatus === AssetStatus.DAMAGED
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {MESSAGES.DAMAGED_CONDITION}
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{MESSAGES.CHECKIN_NOTE_LABEL}</label>
            <input
              id="checkin-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={MESSAGES.CHECKIN_NOTE_PLACEHOLDER}
              className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            {MESSAGES.CANCEL}
          </button>
          <button
            id="btn-confirm-checkin"
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center space-x-2 min-h-[44px]"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{loading ? MESSAGES.CHECKIN_LOADING : MESSAGES.ACTION_CONFIRM_CHECKIN}</span>
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
