import React, { useState } from 'react';
import {
  Search,
  Filter,
  QrCode,
  MapPin,
  User as UserIcon,
  ArrowRightLeft,
  LogIn,
  LogOut,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Eye,
  Plus,
  Clock,
  Building2,
} from 'lucide-react';
import { Asset, AssetCategory, AssetStatus, Location, Project, User, UserRole } from '../types';
import {
  formatDateTime,
  getCategoryName,
  getLocationName,
  getStatusConfig,
  getUserName,
} from '../utils/formatters';

interface AssetListViewProps {
  assets: Asset[];
  categories: AssetCategory[];
  locations: Location[];
  projects?: Project[];
  users: User[];
  currentRole: UserRole;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedLocation: string;
  onLocationChange: (loc: string) => void;
  selectedProject?: string;
  onProjectChange?: (proj: string) => void;
  selectedUser: string;
  onUserChange: (u: string) => void;
  onSelectAsset: (asset: Asset) => void;
  onCheckout: (asset: Asset) => void;
  onCheckin: (asset: Asset) => void;
  onMove: (asset: Asset) => void;
  onTransferProject?: (asset: Asset) => void;
  onShowQr: (asset: Asset) => void;
  onOpenCreateAsset: () => void;
}

export const AssetListView: React.FC<AssetListViewProps> = ({
  assets,
  categories,
  locations,
  projects = [],
  users,
  currentRole,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  selectedLocation,
  onLocationChange,
  selectedProject = 'ALL',
  onProjectChange,
  selectedUser,
  onUserChange,
  onSelectAsset,
  onCheckout,
  onCheckin,
  onMove,
  onTransferProject,
  onShowQr,
  onOpenCreateAsset,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showFilters, setShowFilters] = useState(false);

  const clearAllFilters = () => {
    onSearchChange('');
    onStatusChange('ALL');
    onCategoryChange('ALL');
    onLocationChange('ALL');
    if (onProjectChange) onProjectChange('ALL');
    onUserChange('ALL');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedStatus !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedLocation !== 'ALL' ||
    selectedProject !== 'ALL' ||
    selectedUser !== 'ALL';

  return (
    <div className="space-y-4">
      {/* Search Bar & Primary Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="asset-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm ID (DRILL-021), tên máy, serial, người giữ, vị trí..."
              className="w-full pl-10 pr-12 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition-all min-h-[44px]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Action buttons on right */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              id="toggle-filters-btn"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer min-h-[42px] ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Lọc nâng cao {hasActiveFilters ? '(Bật)' : ''}</span>
            </button>

            {/* View Mode Toggle (Desktop & Tablet) */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Dạng bảng"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Dạng lưới thẻ"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Admin Add Button */}
            {currentRole === 'ADMIN' && (
              <button
                id="btn-create-asset-list"
                onClick={onOpenCreateAsset}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm tài sản</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Horizontal Status Pills for Fast One-Tap Mobile & Desktop Filtering */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0 hidden sm:inline">
            Trạng thái nhanh:
          </span>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: AssetStatus.AVAILABLE, label: 'Sẵn sàng (Kho)' },
            { id: AssetStatus.IN_USE, label: 'Đang mượn' },
            { id: AssetStatus.MAINTENANCE, label: 'Bảo trì' },
            { id: AssetStatus.LOST, label: 'Thất lạc' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => onStatusChange(pill.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer shrink-0 min-h-[36px] flex items-center space-x-1.5 ${
                selectedStatus === pill.id
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{pill.label}</span>
            </button>
          ))}
        </div>

        {/* Filter Bar / Dropdowns */}
        {(showFilters || hasActiveFilters) && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
            {/* Project / Worksite Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Dự án / Công trường</label>
              <select
                id="filter-project-select"
                value={selectedProject}
                onChange={(e) => onProjectChange && onProjectChange(e.target.value)}
                className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">Tất cả dự án</option>
                {projects.map((p) => (
                  <option key={p.project_id} value={p.project_id}>
                    [{p.project_code}] {p.project_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Trạng thái (Status)</label>
              <select
                id="filter-status-select"
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value={AssetStatus.AVAILABLE}>AVAILABLE (Sẵn sàng)</option>
                <option value={AssetStatus.IN_USE}>IN_USE (Đang sử dụng)</option>
                <option value={AssetStatus.MAINTENANCE}>MAINTENANCE (Bảo trì)</option>
                <option value={AssetStatus.LOST}>LOST (Thất lạc)</option>
                <option value={AssetStatus.DAMAGED}>DAMAGED (Hư hỏng)</option>
                <option value={AssetStatus.INACTIVE}>INACTIVE (Ngừng hoạt động)</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Vị trí (Location)</label>
              <select
                id="filter-location-select"
                value={selectedLocation}
                onChange={(e) => onLocationChange(e.target.value)}
                className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả vị trí</option>
                {locations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.location_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Nhóm tài sản (Category)</label>
              <select
                id="filter-category-select"
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Người sử dụng (User)</label>
              <select
                id="filter-user-select"
                value={selectedUser}
                onChange={(e) => onUserChange(e.target.value)}
                className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả nhân viên</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Button */}
            <div className="flex items-end">
              <button
                id="btn-clear-filters"
                onClick={clearAllFilters}
                disabled={!hasActiveFilters}
                className="w-full py-1.5 px-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        )}

        {/* Status Quick Pills */}
        <div className="flex items-center space-x-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none text-xs">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] mr-1 shrink-0">Lọc nhanh:</span>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: AssetStatus.AVAILABLE, label: 'Available' },
            { id: AssetStatus.IN_USE, label: 'In Use' },
            { id: AssetStatus.MAINTENANCE, label: 'Maintenance' },
            { id: AssetStatus.LOST, label: 'Lost' },
            { id: AssetStatus.DAMAGED, label: 'Damaged' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onStatusChange(item.id)}
              className={`px-2 py-0.5 rounded-full font-medium text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                selectedStatus === item.id
                  ? 'bg-slate-900 dark:bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="text-slate-400 dark:text-slate-500 text-[11px] ml-auto shrink-0 font-medium">
            {assets.length} tài sản phù hợp
          </span>
        </div>
      </div>

      {/* Asset List Content */}
      {assets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500 dark:text-slate-400 shadow-xs">
          <Filter className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Không tìm thấy tài sản nào</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Không có tài sản nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại. Thử xóa bộ lọc hoặc đổi từ khóa tìm kiếm.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-4 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <>
          {/* Table View (shown only on sm screens and larger when table mode is selected) */}
          {viewMode === 'table' && (
            <div className="hidden sm:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-slate-800/75 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Asset ID & Tên</th>
                  <th className="py-3 px-3">Danh mục / Serial</th>
                  <th className="py-3 px-3">Dự án / Công trường</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3">Người sử dụng</th>
                  <th className="py-3 px-3">Vị trí ghi nhận gần nhất</th>
                  <th className="py-3 px-3">Cập nhật</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assets.map((asset) => {
                  const statusCfg = getStatusConfig(asset.status);
                  const userName = getUserName(users, asset.current_user_id);
                  const locName = getLocationName(locations, asset.current_location_id);
                  const catName = getCategoryName(categories, asset.category_id);
                  const proj = projects.find((p) => p.project_id === asset.project_id);

                  return (
                    <tr
                      key={asset.asset_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Asset ID & Name */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectAsset(asset)}
                          className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline block text-left"
                        >
                          {asset.asset_id}
                        </button>
                        <span className="font-medium text-slate-900 dark:text-white block mt-0.5 max-w-[200px] truncate" title={asset.asset_name}>
                          {asset.asset_name}
                        </span>
                      </td>

                      {/* Category & Serial */}
                      <td className="py-3 px-3">
                        <span className="text-slate-700 dark:text-slate-300 font-medium block">{catName}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-mono">
                          SN: {asset.serial_number || 'N/A'}
                        </span>
                      </td>

                      {/* Project / Worksite */}
                      <td className="py-3 px-3">
                        {proj ? (
                          <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-medium text-[11px]">
                            <Building2 className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="truncate max-w-[130px]" title={`${proj.project_code} - ${proj.project_name}`}>
                              {proj.project_code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">Kho Tổng</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusCfg.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          <span>{statusCfg.label}</span>
                        </span>
                      </td>

                      {/* Current User */}
                      <td className="py-3 px-3">
                        {asset.status === AssetStatus.IN_USE ? (
                          <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200 font-medium">
                            <UserIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>{userName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 italic">—</span>
                        )}
                      </td>

                      {/* Last Known Location */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate max-w-[180px]" title={locName}>
                            {locName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block ml-4.5">
                          (Event-based record)
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>{formatDateTime(asset.updated_at)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* Check-out button (only if AVAILABLE) */}
                          {asset.status === AssetStatus.AVAILABLE && (
                            <button
                              id={`btn-checkout-${asset.asset_id}`}
                              onClick={() => onCheckout(asset)}
                              className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded font-medium text-xs transition-colors cursor-pointer inline-flex items-center space-x-1"
                              title="Check-out mượn thiết bị"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Check-out</span>
                            </button>
                          )}

                          {/* Check-in button (if IN_USE) */}
                          {asset.status === AssetStatus.IN_USE && (
                            <button
                              id={`btn-checkin-${asset.asset_id}`}
                              onClick={() => onCheckin(asset)}
                              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded font-medium text-xs transition-colors cursor-pointer inline-flex items-center space-x-1"
                              title="Check-in hoàn trả thiết bị"
                            >
                              <LogIn className="w-3 h-3" />
                              <span>Check-in</span>
                            </button>
                          )}

                          {/* Move button */}
                          <button
                            id={`btn-move-${asset.asset_id}`}
                            onClick={() => onMove(asset)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="Di chuyển thiết bị / Cập nhật vị trí"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Transfer Project button */}
                          {onTransferProject && (
                            <button
                              id={`btn-transfer-proj-${asset.asset_id}`}
                              onClick={() => onTransferProject(asset)}
                              className="p-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded transition-colors cursor-pointer"
                              title="Điều chuyển công trường / dự án"
                            >
                              <Building2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* QR Code button */}
                          <button
                            id={`btn-qr-${asset.asset_id}`}
                            onClick={() => onShowQr(asset)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors cursor-pointer"
                            title="Xem mã QR & Nhãn in"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Detail button */}
                          <button
                            id={`btn-detail-${asset.asset_id}`}
                            onClick={() => onSelectAsset(asset)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="Xem chi tiết & Lịch sử"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cards Grid: Always visible on Mobile (sm:hidden when table is selected), or on all screens when viewMode is 'grid' */}
      <div className={`${viewMode === 'table' ? 'sm:hidden' : ''} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5`}>
          {assets.map((asset) => {
            const statusCfg = getStatusConfig(asset.status);
            const userName = getUserName(users, asset.current_user_id);
            const locName = getLocationName(locations, asset.current_location_id);
            const catName = getCategoryName(categories, asset.category_id);
            const proj = projects.find((p) => p.project_id === asset.project_id);

            return (
              <div
                key={asset.asset_id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-4 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: ID & Status Badge */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <button
                        onClick={() => onSelectAsset(asset)}
                        className="font-bold text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline block text-left"
                      >
                        {asset.asset_id}
                      </button>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        SN: {asset.serial_number || 'N/A'}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      <span>{statusCfg.label}</span>
                    </span>
                  </div>

                  {/* Asset Name */}
                  <h4
                    onClick={() => onSelectAsset(asset)}
                    className="font-bold text-sm text-slate-900 dark:text-white mb-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {asset.asset_name}
                  </h4>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-slate-500 dark:text-slate-400">{catName}</span>
                    {proj && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[10px] font-semibold">
                        <Building2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>{proj.project_code}</span>
                      </span>
                    )}
                  </div>

                  {/* Metadata fields */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500 text-[11px] flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>Last Location:</span>
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[150px]">
                        {locName}
                      </span>
                    </div>

                    {asset.status === AssetStatus.IN_USE && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] flex items-center space-x-1">
                          <UserIcon className="w-3 h-3 text-amber-500" />
                          <span>Current User:</span>
                        </span>
                        <span className="font-semibold text-amber-900 dark:text-amber-300 text-right">
                          {userName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 dark:text-slate-500">Cập nhật:</span>
                      <span className="text-slate-500 dark:text-slate-400">{formatDateTime(asset.updated_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Mobile-first with >=42px height touch targets) */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  {/* Primary Status Action Button */}
                  <div className="flex-1">
                    {asset.status === AssetStatus.AVAILABLE && (
                      <button
                        onClick={() => onCheckout(asset)}
                        className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 min-h-[42px]"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Mượn máy (Check-out)</span>
                      </button>
                    )}

                    {asset.status === AssetStatus.IN_USE && (
                      <button
                        onClick={() => onCheckin(asset)}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 min-h-[42px]"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Trả máy (Check-in)</span>
                      </button>
                    )}

                    {asset.status !== AssetStatus.AVAILABLE && asset.status !== AssetStatus.IN_USE && (
                      <button
                        onClick={() => onSelectAsset(asset)}
                        className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-1.5 min-h-[42px]"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Xem hồ sơ</span>
                      </button>
                    )}
                  </div>

                  {/* Secondary Action Buttons */}
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      onClick={() => onMove(asset)}
                      className="flex-1 sm:flex-none py-2 px-3 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center justify-center space-x-1 min-h-[42px]"
                      title="Chuyển vị trí"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span className="sm:hidden text-xs">Chuyển</span>
                    </button>

                    {onTransferProject && (
                      <button
                        onClick={() => onTransferProject(asset)}
                        className="flex-1 sm:flex-none py-2 px-3 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center justify-center space-x-1 min-h-[42px]"
                        title="Chuyển công trường"
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="sm:hidden text-xs">Dự án</span>
                      </button>
                    )}

                    <button
                      onClick={() => onShowQr(asset)}
                      className="flex-1 sm:flex-none py-2 px-3 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center justify-center space-x-1 min-h-[42px]"
                      title="Xem mã QR"
                    >
                      <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="sm:hidden text-xs">QR</span>
                    </button>

                    <button
                      onClick={() => onSelectAsset(asset)}
                      className="hidden sm:flex p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer min-h-[42px] min-w-[42px] items-center justify-center"
                      title="Chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
      )}
    </div>
  );
};
