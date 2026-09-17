import React, { useState, useMemo } from 'react';
import {
  Boxes,
  CheckCircle2,
  UserCheck,
  Wrench,
  AlertTriangle,
  AlertOctagon,
  MapPin,
  Clock,
  ArrowRight,
  ShieldAlert,
  QrCode,
  ScanLine,
  Building2,
  Search,
  ChevronDown,
  Warehouse,
} from 'lucide-react';
import { Asset, DashboardStats, Project } from '../types';
import { formatTime } from '../utils/formatters';

interface DashboardViewProps {
  stats: DashboardStats | null;
  onSelectAsset: (assetId: string) => void;
  onCheckout: (asset: Asset) => void;
  onCheckin: (asset: Asset) => void;
  onMove: (asset: Asset) => void;
  onNavigateToAssetsWithFilter: (filter: { status?: string; location?: string; project?: string }) => void;
  assets: Asset[];
  projects?: Project[];
  selectedProject?: string;
  onProjectChange?: (projectId: string) => void;
  onOpenScanner?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  onSelectAsset,
  onCheckin,
  onMove,
  onNavigateToAssetsWithFilter,
  assets,
  projects = [],
  selectedProject = 'ALL',
  onProjectChange,
  onOpenScanner,
}) => {
  if (!stats) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p>Đang tải dữ liệu báo cáo...</p>
      </div>
    );
  }

  // Find current project object if filtered
  const activeProj = projects.find((p) => p.project_id === selectedProject);

  // Calculate project-aware stats if filtered
  const relevantAssets = selectedProject === 'ALL'
    ? assets
    : assets.filter((a) => a.project_id === selectedProject);

  const displayStats = selectedProject === 'ALL'
    ? stats
    : {
        total_assets: relevantAssets.length,
        available: relevantAssets.filter((a) => a.status === 'AVAILABLE').length,
        in_use: relevantAssets.filter((a) => a.status === 'IN_USE').length,
        maintenance: relevantAssets.filter((a) => a.status === 'MAINTENANCE').length,
        lost: relevantAssets.filter((a) => a.status === 'LOST').length,
        disposed: relevantAssets.filter((a) => a.status === 'DISPOSED').length,
        total_locations: stats.total_locations,
        total_users: stats.total_users,
        by_category: stats.by_category,
        by_location: stats.by_location,
        overdue_count: relevantAssets.filter((a) => a.due_date && new Date(a.due_date) < new Date()).length,
      };

  // Find lost assets for alert
  const lostAssets = relevantAssets.filter((a) => a.status === 'LOST');
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [showAllLocations, setShowAllLocations] = useState(false);

  // Filtered Locations List
  const filteredLocationStats = useMemo(() => {
    const list = stats.assets_by_location || [];
    if (!locationSearchQuery.trim()) return list;
    return list.filter((item) =>
      item.location_name.toLowerCase().includes(locationSearchQuery.toLowerCase().trim())
    );
  }, [stats.assets_by_location, locationSearchQuery]);

  const displayedLocations = showAllLocations
    ? filteredLocationStats
    : filteredLocationStats.slice(0, 8);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Project Selector Bar (Multi-site / Multi-worksite filtering) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400 block">
              Quản lý theo Công trường / Dự án
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {activeProj ? `${activeProj.project_code} - ${activeProj.project_name}` : 'Toàn bộ tất cả công trình (Tổng công ty)'}
            </h2>
          </div>
        </div>

        {/* Project Selector Dropdown */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label htmlFor="dashboard-project-select" className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap hidden md:inline">
            Xem theo công trường:
          </label>
          <select
            id="dashboard-project-select"
            value={selectedProject}
            onChange={(e) => onProjectChange && onProjectChange(e.target.value)}
            className="w-full sm:w-auto text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">🏢 Toàn bộ công trường (Tất cả)</option>
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>
                [{p.project_code}] {p.project_name} - {p.status}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Mobile-First Quick Actions Hero (Only on mobile screens) */}
      <div className="sm:hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-200">
              Trạm Tác Vụ Nhanh (Mobile)
            </span>
            <h2 className="text-base font-bold text-white">Quét QR & Quản lý thiết bị</h2>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <ScanLine className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Big Touch-Friendly Camera Button */}
        {onOpenScanner && (
          <button
            onClick={onOpenScanner}
            className="w-full py-3.5 px-4 bg-white text-blue-700 hover:bg-blue-50 active:scale-98 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center space-x-2.5 min-h-[48px] cursor-pointer mb-3"
          >
            <QrCode className="w-5 h-5 text-blue-600" />
            <span>MỞ CAMERA QUÉT MÃ QR</span>
          </button>
        )}

        {/* 2 Quick Tappable Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => onNavigateToAssetsWithFilter({ status: 'AVAILABLE', project: selectedProject !== 'ALL' ? selectedProject : undefined })}
            className="bg-white/15 hover:bg-white/25 backdrop-blur-xs p-2.5 rounded-xl text-left transition-colors cursor-pointer"
          >
            <span className="text-[11px] text-blue-100 block">Sẵn sàng (Kho)</span>
            <span className="text-lg font-bold text-white">{displayStats.available} thiết bị</span>
          </button>

          <button
            onClick={() => onNavigateToAssetsWithFilter({ status: 'IN_USE', project: selectedProject !== 'ALL' ? selectedProject : undefined })}
            className="bg-white/15 hover:bg-white/25 backdrop-blur-xs p-2.5 rounded-xl text-left transition-colors cursor-pointer"
          >
            <span className="text-[11px] text-blue-100 block">Đang thi công</span>
            <span className="text-lg font-bold text-white">{displayStats.in_use} thiết bị</span>
          </button>
        </div>
      </div>

      {/* BA Section 31 Notice: Event-Based Tracking vs Real-Time GPS (Collapsible on mobile) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 text-slate-300 shadow-sm">
        {/* Desktop View */}
        <div className="hidden sm:flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-900/40 text-blue-400 border border-blue-700/40 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Nguyên lý Định vị (SRS Mục 18, 19 & 31)
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                <strong className="text-white">Last Known Location:</strong> Vị trí gần nhất được hệ thống ghi nhận thành công từ sự kiện quét mã QR (Check-out, Check-in, Move). Hệ thống không tự suy đoán vị trí GPS khi không có sự kiện.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
              Phase 1: Event-based QR Active
            </span>
          </div>
        </div>

        {/* Mobile View: Compact row with toggle */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-blue-900/40 text-blue-400 border border-blue-700/40 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Định vị: <strong className="text-blue-400 font-bold">Last Known Location</strong>
              </span>
            </div>
            <button
              onClick={() => setShowLocationInfo(!showLocationInfo)}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded hover:bg-slate-800 shrink-0 cursor-pointer"
            >
              {showLocationInfo ? 'Thu gọn ▲' : 'Chi tiết ▼'}
            </button>
          </div>

          {showLocationInfo && (
            <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-slate-300 space-y-1.5 animate-in fade-in duration-150">
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Vị trí được ghi nhận từ sự kiện quét mã QR thực tế (Check-out, Check-in, Move). Hệ thống không tự suy đoán GPS khi không có sự kiện.
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                Phase 1: Event-based QR Active
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Warnings & Alerts (Section 22) */}
      {(displayStats.overdue_count > 0 || lostAssets.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Overdue Warning */}
          {displayStats.overdue_count > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-amber-900 flex items-center space-x-1.5">
                    <span>⚠ CẢNH BÁO QUÁ HẠN (OVERDUE)</span>
                    <span className="px-1.5 py-0.5 text-xs bg-amber-200 text-amber-900 rounded-full font-bold">
                      {displayStats.overdue_count}
                    </span>
                  </h4>
                  <button
                    onClick={() => onNavigateToAssetsWithFilter({ status: 'IN_USE', project: selectedProject !== 'ALL' ? selectedProject : undefined })}
                    className="text-xs font-medium text-amber-800 hover:text-amber-950 underline cursor-pointer"
                  >
                    Xem chi tiết
                  </button>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Có thiết bị đã quá thời gian dự kiến hoàn trả nhưng chưa được Check-in về kho. Vui lòng liên hệ người sử dụng để thu hồi hoặc gia hạn.
                </p>
              </div>
            </div>
          )}

          {/* Lost Asset Warning */}
          {lostAssets.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-rose-900 flex items-center space-x-1.5">
                    <span>⚠ CẢNH BÁO THẤT LẠC (LOST ASSET)</span>
                    <span className="px-1.5 py-0.5 text-xs bg-rose-200 text-rose-900 rounded-full font-bold">
                      {lostAssets.length}
                    </span>
                  </h4>
                  <button
                    onClick={() => onNavigateToAssetsWithFilter({ status: 'LOST', project: selectedProject !== 'ALL' ? selectedProject : undefined })}
                    className="text-xs font-medium text-rose-800 hover:text-rose-950 underline cursor-pointer"
                  >
                    Xem danh sách
                  </button>
                </div>
                <div className="mt-1 space-y-1">
                  {lostAssets.slice(0, 2).map((la) => (
                    <p key={la.asset_id} className="text-xs text-rose-800">
                      <strong>{la.asset_id}</strong> ({la.asset_name}) — Vị trí cuối ghi nhận:{' '}
                      <span className="font-semibold">{la.current_location_id}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Counters (Section 20 Dashboard) */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Tổng quan Hiện trạng Thiết bị (Asset Status Summary) {activeProj && `— [${activeProj.project_code}]`}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Assets */}
          <div
            onClick={() => onNavigateToAssetsWithFilter({ project: selectedProject !== 'ALL' ? selectedProject : undefined })}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-4 shadow-xs transition-all cursor-pointer hover:shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-medium">Total Assets</span>
              <Boxes className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{displayStats.total_assets}</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Toàn bộ danh mục</div>
          </div>

          {/* Available */}
          <div
            onClick={() => onNavigateToAssetsWithFilter({ status: 'AVAILABLE', project: selectedProject !== 'ALL' ? selectedProject : undefined })}
            className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-800 rounded-xl p-4 shadow-xs transition-all cursor-pointer hover:shadow-sm"
          >
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
              <span className="text-xs font-medium">Available</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{displayStats.available}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-1">Sẵn sàng cấp phát</div>
          </div>

          {/* In Use */}
          <div
            onClick={() => onNavigateToAssetsWithFilter({ status: 'IN_USE', project: selectedProject !== 'ALL' ? selectedProject : undefined })}
            className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-800 rounded-xl p-4 shadow-xs transition-all cursor-pointer hover:shadow-sm"
          >
            <div className="flex items-center justify-between text-amber-800 dark:text-amber-400 mb-1">
              <span className="text-xs font-medium">In Use</span>
              <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-800 dark:text-amber-400">{displayStats.in_use}</div>
            <div className="text-[11px] text-amber-700 dark:text-amber-500 mt-1">Đang thi công</div>
          </div>

          {/* Maintenance */}
          <div
            onClick={() => onNavigateToAssetsWithFilter({ status: 'MAINTENANCE', project: selectedProject !== 'ALL' ? selectedProject : undefined })}
            className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-800 rounded-xl p-4 shadow-xs transition-all cursor-pointer hover:shadow-sm"
          >
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 mb-1">
              <span className="text-xs font-medium">Maintenance</span>
              <Wrench className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{displayStats.maintenance}</div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">Đang bảo trì/sửa</div>
          </div>

          {/* Lost */}
          <div
            onClick={() => onNavigateToAssetsWithFilter({ status: 'LOST', project: selectedProject !== 'ALL' ? selectedProject : undefined })}
            className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-800 rounded-xl p-4 shadow-xs transition-all cursor-pointer hover:shadow-sm"
          >
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-1">
              <span className="text-xs font-medium">Lost</span>
              <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">{displayStats.lost}</div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">Thất lạc / Tìm kiếm</div>
          </div>

          {/* Damaged */}
          <div
            onClick={() => onNavigateToAssetsWithFilter({ status: 'DAMAGED' })}
            className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 hover:border-red-300 dark:hover:border-red-800 rounded-xl p-4 shadow-xs transition-all cursor-pointer hover:shadow-sm"
          >
            <div className="flex items-center justify-between text-red-800 dark:text-red-400 mb-1">
              <span className="text-xs font-medium">Damaged</span>
              <AlertOctagon className="w-4 h-4 text-red-500 dark:text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-800 dark:text-red-400">{stats.damaged}</div>
            <div className="text-[11px] text-red-600 dark:text-red-400 mt-1">Hỏng chờ thay thế</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Assets by Location + Assets Currently In Use */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Asset by Location (Section 20) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Asset by Location</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {filteredLocationStats.length} khu vực
            </span>
          </div>

          {/* Quick Search for locations */}
          {stats.assets_by_location.length > 5 && (
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm nhanh vị trí / kho..."
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {locationSearchQuery && (
                <button
                  onClick={() => setLocationSearchQuery('')}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Scrollable Container with max height (prevents layout stretching) */}
          <div className="space-y-2.5 overflow-y-auto max-h-[420px] pr-1 scrollbar-thin">
            {displayedLocations.length === 0 ? (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                <Warehouse className="w-8 h-8 mx-auto mb-1.5 opacity-40 text-slate-400" />
                <p className="text-xs">Không tìm thấy vị trí khớp với "{locationSearchQuery}"</p>
              </div>
            ) : (
              displayedLocations.map((item) => {
                const percentage = stats.total_assets > 0
                  ? Math.round((item.count / stats.total_assets) * 100)
                  : 0;
                return (
                  <div
                    key={item.location_name}
                    onClick={() => onNavigateToAssetsWithFilter({ location: item.location_name })}
                    className="group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      <span className="truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 font-semibold" title={item.location_name}>
                        {item.location_name}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white ml-2 shrink-0">
                        {item.count}{' '}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Show More / Show Less Toggle if > 8 items */}
          {filteredLocationStats.length > 8 && !locationSearchQuery && (
            <button
              onClick={() => setShowAllLocations(!showAllLocations)}
              className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer w-full flex items-center justify-center space-x-1"
            >
              <span>{showAllLocations ? 'Thu gọn danh sách (Hiện top 8)' : `Xem tất cả ${filteredLocationStats.length} khu vực`}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllLocations ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Right Column: Assets Currently In Use (Section 20) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Assets Currently In Use (Đang được bàn giao)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Các tài sản đang có người giữ, vị trí công tác và thời gian nhận
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-md">
              {stats.assets_currently_in_use.length} thiết bị
            </span>
          </div>

          {stats.assets_currently_in_use.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Boxes className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Hiện không có tài sản nào đang được sử dụng.</p>
            </div>
          ) : (
            <>
              {/* Mobile View: Touch-Friendly Card List (< sm) */}
              <div className="sm:hidden space-y-3">
                {stats.assets_currently_in_use.map((item) => {
                  const fullAsset = assets.find((a) => a.asset_id === item.asset_id);
                  return (
                    <div
                      key={item.asset_id}
                      className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <button
                            onClick={() => onSelectAsset(item.asset_id)}
                            className="font-bold text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-left block"
                          >
                            {item.asset_id}
                          </button>
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                            {item.asset_name}
                          </span>
                        </div>
                        {item.is_overdue && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-full shrink-0">
                            Quá hạn
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                        <div className="flex items-center space-x-1.5 truncate">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{item.user_name}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{item.location_name}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>Xuất: {formatTime(item.checked_out_at)}</span>
                        </span>
                      </div>

                      {/* Mobile Touch Action Buttons */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {fullAsset && (
                          <>
                            <button
                              onClick={() => onCheckin(fullAsset)}
                              className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg font-bold text-xs shadow-xs transition-all text-center min-h-[40px] flex items-center justify-center cursor-pointer"
                            >
                              Trả máy
                            </button>
                            <button
                              onClick={() => onMove(fullAsset)}
                              className="py-2 px-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 text-slate-800 dark:text-slate-100 rounded-lg font-semibold text-xs transition-all text-center min-h-[40px] flex items-center justify-center cursor-pointer"
                            >
                              Di chuyển
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onSelectAsset(item.asset_id)}
                          className={`py-2 px-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 active:scale-95 text-blue-700 dark:text-blue-300 rounded-lg font-semibold text-xs border border-blue-200 dark:border-blue-800/60 transition-all text-center min-h-[40px] flex items-center justify-center cursor-pointer ${
                            !fullAsset ? 'col-span-3' : ''
                          }`}
                        >
                          Chi tiết
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tablet & Desktop View: Table (>= sm) */}
              <div className="hidden sm:block overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <th className="pb-2 font-medium">Asset ID & Tên</th>
                      <th className="pb-2 font-medium">Người sử dụng</th>
                      <th className="pb-2 font-medium">Vị trí ghi nhận</th>
                      <th className="pb-2 font-medium">Thời gian Check-out</th>
                      <th className="pb-2 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stats.assets_currently_in_use.map((item) => {
                      const fullAsset = assets.find((a) => a.asset_id === item.asset_id);
                      return (
                        <tr key={item.asset_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-2.5 pr-2">
                            <button
                              onClick={() => onSelectAsset(item.asset_id)}
                              className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline block text-left"
                            >
                              {item.asset_id}
                            </button>
                            <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate block max-w-[180px]">
                              {item.asset_name}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{item.user_name}</span>
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="inline-flex items-center text-slate-700 dark:text-slate-300">
                              <MapPin className="w-3 h-3 text-slate-400 mr-1 shrink-0" />
                              {item.location_name}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {formatTime(item.checked_out_at)}
                            {item.is_overdue && (
                              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded">
                                Quá hạn
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                            <div className="inline-flex items-center space-x-1.5">
                              {fullAsset && (
                                <>
                                  <button
                                    onClick={() => onCheckin(fullAsset)}
                                    className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded font-medium text-[11px] transition-colors cursor-pointer"
                                    title="Check-in trả thiết bị"
                                  >
                                    Trả máy
                                  </button>
                                  <button
                                    onClick={() => onMove(fullAsset)}
                                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded font-medium text-[11px] transition-colors cursor-pointer"
                                    title="Cập nhật vị trí"
                                  >
                                    Di chuyển
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => onSelectAsset(item.asset_id)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                                title="Xem chi tiết"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
