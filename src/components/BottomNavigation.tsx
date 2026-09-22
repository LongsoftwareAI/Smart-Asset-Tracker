import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  MapPin,
  History,
  QrCode,
  ScanLine,
} from 'lucide-react';
import { UserRole } from '../types';
import * as MESSAGES from '../../shared/messages';

interface BottomNavigationProps {
  activeTab: 'dashboard' | 'assets' | 'locations' | 'audit' | 'api';
  onTabChange: (tab: 'dashboard' | 'assets' | 'locations' | 'audit' | 'api') => void;
  onOpenScanner: () => void;
  currentRole: UserRole;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenScanner,
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      aria-label={MESSAGES.MOBILE_NAVIGATION}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl md:hidden px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 transition-colors duration-200"
    >
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        {/* Tab 1: Dashboard */}
        <button
          id="mobile-nav-dashboard"
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 tracking-tight leading-none">{MESSAGES.OVERVIEW_NAV}</span>
          {activeTab === 'dashboard' && (
            <span className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mt-0.5" />
          )}
        </button>

        {/* Tab 2: Assets Inventory */}
        <button
          id="mobile-nav-assets"
          onClick={() => onTabChange('assets')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'assets'
              ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Boxes className={`w-5 h-5 ${activeTab === 'assets' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 tracking-tight leading-none">{MESSAGES.ASSET_NAV}</span>
          {activeTab === 'assets' && (
            <span className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mt-0.5" />
          )}
        </button>

        {/* Center Hero Action: QR SCANNER BUTTON */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            id="mobile-nav-scan-qr"
            onClick={onOpenScanner}
            aria-label={MESSAGES.QR_SCAN_ARIA}
            className="group relative flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/40 border-4 border-slate-100 dark:border-slate-800 active:scale-95 transition-all cursor-pointer hover:shadow-blue-500/60"
          >
            <div className="relative">
              <QrCode className="w-6 h-6 stroke-[2.2] animate-pulse" />
              <ScanLine className="w-3.5 h-3.5 text-amber-300 absolute -bottom-1 -right-1" />
            </div>
            <span className="sr-only">{MESSAGES.QR_SCAN_SHORT}</span>
          </button>
        </div>

        {/* Tab 3: Locations */}
        <button
          id="mobile-nav-locations"
          onClick={() => onTabChange('locations')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'locations'
              ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MapPin className={`w-5 h-5 ${activeTab === 'locations' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 tracking-tight leading-none">{MESSAGES.LOCATIONS_NAV}</span>
          {activeTab === 'locations' && (
            <span className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mt-0.5" />
          )}
        </button>

        {/* Tab 4: Audit & History */}
        <button
          id="mobile-nav-audit"
          onClick={() => onTabChange('audit')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className={`w-5 h-5 ${activeTab === 'audit' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 tracking-tight leading-none">{MESSAGES.AUDIT_NAV}</span>
          {activeTab === 'audit' && (
            <span className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
