import React, { useState, useRef, useEffect } from 'react';
import {
  Boxes,
  QrCode,
  Plus,
  LayoutDashboard,
  MapPin,
  History,
  Code2,
  RotateCcw,
  ShieldCheck,
  User,
  ShieldAlert,
  ChevronDown,
  MoreVertical,
  X,
  FileText,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { UserRole } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentRole: UserRole;
  accountName: string;
  activeTab: 'dashboard' | 'assets' | 'locations' | 'audit' | 'api';
  onTabChange: (tab: 'dashboard' | 'assets' | 'locations' | 'audit' | 'api') => void;
  onOpenScanner: () => void;
  onOpenCreateAsset: () => void;
  onResetData: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  accountName,
  activeTab,
  onTabChange,
  onOpenScanner,
  onOpenCreateAsset,
  onResetData,
  onLogout,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileMenu]);

  return (
    <header id="main-header" className="bg-slate-900 text-slate-100 sticky top-0 z-30 shadow-md w-full">
      {/* Top Banner: Brand + Role Switcher + Primary Actions */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:border-b border-slate-800">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2 shrink-0 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-inner shrink-0">
              <Boxes className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
                  Smart Asset Tracker
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-blue-900/60 text-blue-300 font-semibold border border-blue-700/50 hidden xs:inline">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Event-Based Asset Tracking & QR Identification System
              </p>
            </div>
          </div>

          {/* Actions & Role Switcher */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <div className="hidden md:block text-right leading-tight">
              <p className="max-w-32 truncate text-xs font-semibold text-slate-100">{accountName}</p>
              <p className="text-[10px] text-slate-400">{currentRole}</p>
            </div>
            {/* Desktop Scan QR Button */}
            <button
              id="btn-open-scanner"
              onClick={onOpenScanner}
              className="hidden sm:inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer min-h-[38px]"
            >
              <QrCode className="w-4 h-4" />
              <span>Quét QR</span>
            </button>

            {/* Admin Add Asset (Both Mobile & Desktop) */}
            {currentRole === 'ADMIN' && (
              <button
                id="btn-create-asset-header"
                onClick={onOpenCreateAsset}
                className="inline-flex items-center space-x-1 px-2 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer min-h-[36px] sm:min-h-[38px]"
                title="Tạo mới tài sản"
              >
                <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Tạo mới</span>
              </button>
            )}

            {/* Theme Toggle Button (Dark / Light mode) */}
            <button
              id="btn-toggle-theme"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Chuyển sang chế độ Sáng (Light mode)' : 'Chuyển sang chế độ Tối (Dark mode)'}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center border border-slate-700/60"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300" />
              )}
            </button>

            {/* Desktop Reset Data Button */}
            <button
              id="btn-reset-data"
              onClick={onResetData}
              title="Khôi phục dữ liệu mẫu ban đầu (DRILL-021, METER-015...)"
              className="hidden sm:flex p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-h-[38px] min-w-[38px] items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Desktop API Docs quick button */}
            <button
              id="btn-nav-api-quick"
              onClick={() => onTabChange('api')}
              title="Tài liệu REST API & SRS Specs"
              className={`hidden sm:flex p-1.5 rounded-lg transition-colors cursor-pointer min-h-[38px] min-w-[38px] items-center justify-center ${
                activeTab === 'api'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-4 h-4" />
            </button>

            <button
              id="btn-logout"
              onClick={onLogout}
              title="Đăng xuất"
              className="hidden sm:flex p-1.5 text-slate-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-h-[38px] min-w-[38px] items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* MOBILE ROLE SELECTOR: Compact, clean, never overflows */}
            <div className="sm:hidden relative">
              <select
                id="mobile-role-select"
                value={currentRole}
                disabled
                aria-label={`Vai trò hiện tại: ${currentRole}`}
                className={`text-[11px] font-bold py-1.5 pl-2 pr-5 rounded-lg border appearance-none cursor-not-allowed opacity-90 ${
                  currentRole === 'ADMIN'
                    ? 'bg-purple-950/90 text-purple-200 border-purple-700'
                    : currentRole === 'STAFF'
                    ? 'bg-blue-950/90 text-blue-200 border-blue-700'
                    : 'bg-amber-950/90 text-amber-200 border-amber-700'
                }`}
              >
                <option value="ADMIN">🛡️ Admin</option>
                <option value="STAFF">👷 Staff</option>
                <option value="MANAGER">👔 Quản lý</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* DESKTOP ROLE SWITCHER: Side-by-side tabs */}
            <div className="hidden sm:flex items-center bg-slate-800/90 rounded-lg p-0.5 sm:p-1 border border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 px-1 hidden lg:inline">
                Role:
              </span>
              <button
                id="role-btn-admin"
                disabled
                title="Quyền Quản trị viên"
                className={`px-1.5 sm:px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center space-x-1 ${
                  currentRole === 'ADMIN'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin</span>
              </button>
              <button
                id="role-btn-staff"
                disabled
                title="Quyền Nhân viên kỹ thuật"
                className={`px-1.5 sm:px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center space-x-1 ${
                  currentRole === 'STAFF'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Staff</span>
              </button>
              <button
                id="role-btn-manager"
                disabled
                title="Quyền Trưởng phòng / Quản lý"
                className={`px-1.5 sm:px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center space-x-1 ${
                  currentRole === 'MANAGER'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Manager</span>
              </button>
            </div>

            <button
              id="btn-logout-mobile"
              onClick={onLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
              className="sm:hidden p-1.5 text-slate-300 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* MOBILE MORE MENU (⋮): Tùy chọn & Tiện ích hệ thống */}
            <div className="sm:hidden">
              <button
                id="btn-mobile-more"
                onClick={() => setShowMobileMenu(true)}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 active:scale-95 rounded-lg transition-all cursor-pointer min-h-[38px] min-w-[36px] flex items-center justify-center border border-slate-700/60"
                title="Tùy chọn & Tiện ích hệ thống"
                aria-label="Tùy chọn & Tiện ích hệ thống"
              >
                <MoreVertical className="w-4 h-4 text-slate-300" />
              </button>

              {/* Mobile Action Sheet Backdrop & Modal */}
              {showMobileMenu && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
                  <div
                    ref={menuRef}
                    className="bg-slate-900 text-slate-100 rounded-t-3xl sm:rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom-8 duration-200"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                          <MoreVertical className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Tùy chọn & Tiện ích</h3>
                          <p className="text-[11px] text-slate-400">Smart Asset Tracker v1.0</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMobileMenu(false)}
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                        aria-label="Đóng menu"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Action Items */}
                    <div className="space-y-2.5">
                      {/* Theme Toggle in Mobile Menu */}
                      <button
                        type="button"
                        onClick={() => {
                          toggleTheme();
                          setShowMobileMenu(false);
                        }}
                        className="w-full text-left p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 active:scale-[0.98] border border-slate-700 flex items-center space-x-3 transition-all cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-950 text-amber-400 border border-blue-700/40 flex items-center justify-center shrink-0">
                          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                            <span>Giao diện: {theme === 'dark' ? 'Chế độ Tối (Dark)' : 'Chế độ Sáng (Light)'}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-semibold">
                              Theme
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {theme === 'dark' ? 'Nhấn để chuyển sang chế độ Sáng' : 'Nhấn để chuyển sang chế độ Tối'}
                          </div>
                        </div>
                      </button>

                      {/* Option 1: API Docs & SRS */}
                      <button
                        type="button"
                        onClick={() => {
                          onTabChange('api');
                          setShowMobileMenu(false);
                        }}
                        className="w-full text-left p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 active:scale-[0.98] border border-slate-700 flex items-center space-x-3 transition-all cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-700/40 flex items-center justify-center shrink-0">
                          <Code2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                            <span>Tài liệu REST API & Đặc tả SRS</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-semibold">
                              Specs
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Tra cứu mã API endpoints, payload & tiêu chuẩn nghiệm thu
                          </div>
                        </div>
                      </button>

                      {/* Option 2: Reset Demo Data */}
                      <button
                        type="button"
                        onClick={() => {
                          onResetData();
                          setShowMobileMenu(false);
                        }}
                        className="w-full text-left p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 active:scale-[0.98] border border-slate-700 flex items-center space-x-3 transition-all cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-950 text-amber-400 border border-amber-700/40 flex items-center justify-center shrink-0">
                          <RotateCcw className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-amber-300">
                            Khôi phục dữ liệu mẫu ban đầu
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Đặt lại thiết bị, vị trí kho & lịch sử audit về mặc định
                          </div>
                        </div>
                      </button>

                      {/* Role Info Box */}
                      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Vai trò hiện tại:</span>
                        <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {currentRole === 'ADMIN'
                            ? '🛡️ Quản trị viên (Admin)'
                            : currentRole === 'STAFF'
                            ? '👷 Kỹ thuật / Công nhân (Staff)'
                            : '👔 Trưởng ban / Quản lý (Manager)'}
                        </span>
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      type="button"
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer min-h-[40px]"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation (Visible on Tablet & Desktop; Mobile uses sticky BottomNavigation) */}
        <div className="hidden md:flex space-x-1 py-2 overflow-x-auto text-sm scrollbar-none">
          <button
            id="nav-tab-dashboard"
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-blue-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & Báo cáo</span>
          </button>

          <button
            id="nav-tab-assets"
            onClick={() => onTabChange('assets')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'assets'
                ? 'bg-slate-800 text-blue-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Danh mục Tài sản & Tìm kiếm</span>
          </button>

          <button
            id="nav-tab-locations"
            onClick={() => onTabChange('locations')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'locations'
                ? 'bg-slate-800 text-blue-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Khu vực (Locations)</span>
          </button>

          <button
            id="nav-tab-audit"
            onClick={() => onTabChange('audit')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-slate-800 text-blue-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử & Audit Log</span>
          </button>

          <button
            id="nav-tab-api"
            onClick={() => onTabChange('api')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'api'
                ? 'bg-slate-800 text-blue-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>REST API & SRS Spec</span>
          </button>
        </div>
      </div>
    </header>
  );
};
