import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  User as UserIcon,
  Clock,
  QrCode,
  ArrowRightLeft,
  LogIn,
  LogOut,
  Tag,
  AlertTriangle,
  History,
  ShieldCheck,
  Edit2,
  Calendar,
  Building2,
} from 'lucide-react';
import { Asset, AssetCategory, AssetStatus, AssetTransaction, Location, Project, User, UserRole } from '../types';
import { api } from '../services/api';
import {
  formatDateTime,
  getCategoryName,
  getLocationName,
  getStatusConfig,
  getUserName,
} from '../utils/formatters';

interface AssetDetailModalProps {
  asset: Asset | null;
  onClose: () => void;
  categories: AssetCategory[];
  locations: Location[];
  projects?: Project[];
  users: User[];
  currentRole: UserRole;
  onCheckout: (asset: Asset) => void;
  onCheckin: (asset: Asset) => void;
  onMove: (asset: Asset) => void;
  onTransferProject?: (asset: Asset) => void;
  onShowQr: (asset: Asset) => void;
  onEditAsset: (asset: Asset) => void;
  onStatusChanged: () => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  categories,
  locations,
  projects = [],
  users,
  currentRole,
  onCheckout,
  onCheckin,
  onMove,
  onTransferProject,
  onShowQr,
  onEditAsset,
  onStatusChanged,
}) => {
  const [history, setHistory] = useState<(AssetTransaction & { user_name: string; location_name: string })[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [selectedNewStatus, setSelectedNewStatus] = useState<AssetStatus | ''>('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (!asset) return;
    setLoadingHistory(true);
    api.getAssetHistory(asset.asset_id)
      .then((data) => setHistory(data))
      .catch((err) => console.error('Failed to load history:', err))
      .finally(() => setLoadingHistory(false));
  }, [asset]);

  if (!asset) return null;

  const statusCfg = getStatusConfig(asset.status);
  const userName = getUserName(users, asset.current_user_id);
  const locName = getLocationName(locations, asset.current_location_id);
  const catName = getCategoryName(categories, asset.category_id);
  const proj = projects.find((p) => p.project_id === asset.project_id);

  const handleUpdateStatus = async () => {
    if (!selectedNewStatus) return;
    setStatusUpdating(true);
    setStatusError(null);
    try {
      await api.updateAssetStatus(
        asset.asset_id,
        selectedNewStatus,
        statusNote || `Chuyển trạng thái sang ${selectedNewStatus}`,
        'USER-005'
      );
      setShowStatusPicker(false);
      onStatusChanged();
    } catch (err: any) {
      setStatusError(err.message || 'Lỗi cập nhật trạng thái');
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[92dvh] sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150 transition-colors">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-600 text-white font-bold">
                {asset.asset_id}
              </span>
              <span className="text-xs text-slate-400 font-medium">{catName}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-1">{asset.asset_name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1">
          {statusError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs">
              {statusError}
            </div>
          )}

          {/* Status & Last Location Callout (Section 10 BA layout) */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Status
              </span>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.bg}`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                  <span>{statusCfg.label}</span>
                </span>
                {currentRole === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setSelectedNewStatus(asset.status);
                      setShowStatusPicker(!showStatusPicker);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium cursor-pointer"
                  >
                    Đổi trạng thái
                  </button>
                )}
              </div>
            </div>

            {/* Current User */}
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Current User
              </span>
              {asset.status === AssetStatus.IN_USE ? (
                <div className="flex items-center space-x-2 font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  <UserIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{userName}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500 italic font-medium">
                  Không có (Sẵn sàng hoặc trong kho)
                </span>
              )}
            </div>

            {/* Location */}
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Location (Vị trí ghi nhận)
              </span>
              <div className="flex items-center space-x-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{locName}</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                (Last known location từ giao dịch gần nhất)
              </span>
            </div>

            {/* Project / Construction Site */}
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Công trường / Dự án
              </span>
              <div className="flex items-center space-x-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">{proj ? `[${proj.project_code}] ${proj.project_name}` : 'Kho Trung Tâm'}</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                {proj?.address || 'Quản lý tập trung'}
              </span>
            </div>

            {/* Timestamps */}
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Last Updated / Recorded
              </span>
              <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>{formatDateTime(asset.updated_at)}</span>
              </div>
              {asset.checked_out_at && (
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  <span>Checked out: {formatDateTime(asset.checked_out_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Change Form (Expandable) */}
          {showStatusPicker && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Cập nhật trạng thái thủ công (Admin override)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(AssetStatus).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedNewStatus(st)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      selectedNewStatus === st
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:border-amber-500 font-bold'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Ghi chú lý do thay đổi trạng thái..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full text-xs p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowStatusPicker(false)}
                  className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-md transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={statusUpdating}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-md transition-colors"
                >
                  {statusUpdating ? 'Đang lưu...' : 'Lưu trạng thái'}
                </button>
              </div>
            </div>
          )}

          {/* Description & Technical Specs */}
          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Thông tin chi tiết:</span>
              <span className="font-mono text-slate-500 dark:text-slate-400">Mã QR: {asset.qr_code}</span>
            </div>
            <p className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 leading-relaxed">
              {asset.description || 'Không có mô tả bổ sung.'}
            </p>
            <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <span>
                <strong>Số Serial:</strong> {asset.serial_number || 'N/A'}
              </span>
              <span>
                <strong>Mã RFID (Phase 2):</strong> {asset.rfid_code || 'Chưa gắn'}
              </span>
              <span>
                <strong>Ngày tạo:</strong> {formatDateTime(asset.created_at)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {asset.status === AssetStatus.AVAILABLE && (
              <button
                id="btn-detail-checkout"
                onClick={() => {
                  onClose();
                  onCheckout(asset);
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center space-x-1.5 min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Check-out (Mượn tài sản)</span>
              </button>
            )}

            {asset.status === AssetStatus.IN_USE && (
              <button
                id="btn-detail-checkin"
                onClick={() => {
                  onClose();
                  onCheckin(asset);
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center space-x-1.5 min-h-[44px]"
              >
                <LogIn className="w-4 h-4" />
                <span>Check-in (Trả tài sản)</span>
              </button>
            )}

            <button
              id="btn-detail-move"
              onClick={() => {
                onClose();
                onMove(asset);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-1.5 min-h-[44px]"
            >
              <ArrowRightLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Cập nhật vị trí (Move)</span>
            </button>

            {onTransferProject && (
              <button
                id="btn-detail-transfer-project"
                onClick={() => {
                  onClose();
                  onTransferProject(asset);
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-1.5 min-h-[44px]"
              >
                <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Chuyển công trường</span>
              </button>
            )}

            <button
              id="btn-detail-qr"
              onClick={() => onShowQr(asset)}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-1.5 min-h-[44px]"
            >
              <QrCode className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Xem / In QR Code</span>
            </button>

            {currentRole === 'ADMIN' && (
              <button
                id="btn-detail-edit"
                onClick={() => {
                  onClose();
                  onEditAsset(asset);
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-1.5 sm:ml-auto min-h-[44px]"
              >
                <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Chỉnh sửa</span>
              </button>
            )}
          </div>

          {/* Asset History (Section 10 & 15 BA Specification) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Asset Movement History (Lịch sử dịch chuyển)</span>
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {history.length} sự kiện đã lưu
              </span>
            </div>

            {loadingHistory ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">Đang tải lịch sử...</div>
            ) : history.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                Chưa có lịch sử giao dịch nào được ghi nhận cho tài sản này.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs min-w-[460px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3">Sự kiện</th>
                      <th className="py-2.5 px-3">Người thực hiện</th>
                      <th className="py-2.5 px-3">Vị trí ghi nhận</th>
                      <th className="py-2.5 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {history.map((tx) => (
                      <tr key={tx.transaction_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {formatDateTime(tx.timestamp)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.transaction_type === 'CHECK_OUT'
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                : tx.transaction_type === 'CHECK_IN'
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                : tx.transaction_type === 'MOVE'
                                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                                : 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                            }`}
                          >
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {tx.user_name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>{tx.location_name}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-[180px] truncate" title={tx.note}>
                          {tx.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
