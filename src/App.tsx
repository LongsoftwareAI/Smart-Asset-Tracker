import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { DashboardView } from './components/DashboardView';
import { AssetListView } from './components/AssetListView';
import { LocationsView } from './components/LocationsView';
import { AuditHistoryView } from './components/AuditHistoryView';
import { ApiDocsView } from './components/ApiDocsView';
import { AssetDetailModal } from './components/AssetDetailModal';
import { CheckoutModal } from './components/CheckoutModal';
import { CheckinModal } from './components/CheckinModal';
import { MoveModal } from './components/MoveModal';
import { QrCodeModal } from './components/QrCodeModal';
import { QrScannerModal } from './components/QrScannerModal';
import { AssetFormModal } from './components/AssetFormModal';
import { TransferProjectModal } from './components/TransferProjectModal';
import { Asset, AssetCategory, DashboardStats, Location, Project, User, UserRole } from './types';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assets' | 'locations' | 'audit' | 'api'>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');

  useEffect(() => {
    if (user) setCurrentRole(user.role);
  }, [user]);

  // Core Data
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter State for AssetListView & Dashboard
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');

  // Modal States
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [checkoutAsset, setCheckoutAsset] = useState<Asset | null>(null);
  const [checkinAsset, setCheckinAsset] = useState<Asset | null>(null);
  const [moveAsset, setMoveAsset] = useState<Asset | null>(null);
  const [transferAsset, setTransferAsset] = useState<Asset | null>(null);
  const [qrAsset, setQrAsset] = useState<Asset | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch all initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [assetsData, projectsData, catsData, locsData, usersData, statsData] = await Promise.all([
        api.getAssets(),
        api.getProjects(),
        api.getCategories(),
        api.getLocations(),
        api.getUsers(),
        api.getStats(),
      ]);
      setAssets(assetsData);
      setProjects(projectsData);
      setCategories(catsData);
      setLocations(locsData);
      setUsers(usersData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load application data:', err);
      showToast('Lỗi khi tải dữ liệu từ máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered Assets for AssetListView
  const filteredAssets = assets.filter((asset) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      asset.asset_id.toLowerCase().includes(q) ||
      asset.asset_name.toLowerCase().includes(q) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(q)) ||
      (asset.qr_code && asset.qr_code.toLowerCase().includes(q)) ||
      (asset.current_user_id &&
        users
          .find((u) => u.user_id === asset.current_user_id)
          ?.name.toLowerCase()
          .includes(q)) ||
      (asset.current_location_id &&
        locations
          .find((l) => l.location_id === asset.current_location_id)
          ?.location_name.toLowerCase()
          .includes(q));

    const matchesStatus = selectedStatus === 'ALL' || asset.status === selectedStatus;
    const matchesProject = selectedProject === 'ALL' || asset.project_id === selectedProject;
    const matchesCategory = selectedCategory === 'ALL' || asset.category_id === selectedCategory;
    const matchesLocation = selectedLocation === 'ALL' || asset.current_location_id === selectedLocation;
    const matchesUser = selectedUser === 'ALL' || asset.current_user_id === selectedUser;

    return matchesSearch && matchesStatus && matchesProject && matchesCategory && matchesLocation && matchesUser;
  });

  // Action handlers
  const handleOpenCheckout = (asset: Asset) => {
    setCheckoutAsset(asset);
  };

  const handleOpenCheckin = (asset: Asset) => {
    setCheckinAsset(asset);
  };

  const handleOpenMove = (asset: Asset) => {
    setMoveAsset(asset);
  };

  const handleOpenTransferProject = (asset: Asset) => {
    setTransferAsset(asset);
  };

  const handleOpenQr = (asset: Asset) => {
    setQrAsset(asset);
  };

  const handleOpenDetail = (asset: Asset) => {
    setDetailAsset(asset);
  };

  const handleOpenDetailById = (assetId: string) => {
    const found = assets.find((a) => a.asset_id.toLowerCase() === assetId.toLowerCase());
    if (found) {
      setDetailAsset(found);
    } else {
      api
        .getAsset(assetId)
        .then((data) => setDetailAsset(data))
        .catch(() => showToast(`Không tìm thấy thông tin tài sản ${assetId}`, 'error'));
    }
  };

  const handleNavigateToAssetsWithFilter = (filter: { status?: string; location?: string; user?: string; project?: string }) => {
    if (filter.status) {
      setSelectedStatus(filter.status);
    }
    if (filter.project) {
      setSelectedProject(filter.project);
    }
    if (filter.location) {
      const locObj = locations.find(
        (l) =>
          l.location_name.toLowerCase() === filter.location?.toLowerCase() ||
          l.location_id.toLowerCase() === filter.location?.toLowerCase()
      );
      if (locObj) {
        setSelectedLocation(locObj.location_id);
      } else {
        setSelectedLocation(filter.location);
      }
    }
    if (filter.user) {
      setSelectedUser(filter.user);
    }
    setActiveTab('assets');
  };

  const handleResetData = async () => {
    try {
      await api.resetData();
      await fetchData();
      showToast('Đã khôi phục dữ liệu mẫu ban đầu thành công (DRILL-021, METER-015...)');
    } catch (err) {
      console.error('Failed to reset data:', err);
      showToast('Lỗi khi khôi phục dữ liệu mẫu', 'error');
    }
  };

  const handleOpenCreateAsset = () => {
    setAssetToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditAsset = (asset: Asset) => {
    setAssetToEdit(asset);
    setIsFormOpen(true);
  };

  const handleScanFound = (asset: Asset) => {
    // Show toast confirmation while keeping scanner action sheet active
    showToast(`Đã nhận diện thành công: ${asset.asset_id} — ${asset.asset_name}`);
  };

  const handleSuccessAction = (msg: string) => {
    showToast(msg);
    fetchData();
  };

  if (isAuthLoading) {
    return <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-200">Đang kiểm tra phiên đăng nhập…</div>;
  }

  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900/50 dark:selection:text-blue-200 overflow-x-hidden w-full max-w-full transition-colors duration-200">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenCreateAsset={handleOpenCreateAsset}
        onResetData={handleResetData}
        onLogout={() => void logout()}
      />

      {/* Main App Container with mobile bottom nav padding */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-28 md:pb-8 space-y-4 sm:space-y-6">
        {loading && assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-slate-600">
              Đang tải dữ liệu Smart Asset Tracker...
            </p>
          </div>
        ) : (
          <>
            {/* TAB 1: Dashboard View */}
            {activeTab === 'dashboard' && stats && (
              <DashboardView
                stats={stats}
                assets={assets}
                projects={projects}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
                onSelectAsset={handleOpenDetailById}
                onCheckout={handleOpenCheckout}
                onCheckin={handleOpenCheckin}
                onMove={handleOpenMove}
                onNavigateToAssetsWithFilter={handleNavigateToAssetsWithFilter}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            )}

            {/* TAB 2: Asset Inventory & Search List View */}
            {activeTab === 'assets' && (
              <AssetListView
                assets={filteredAssets}
                projects={projects}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
                categories={categories}
                locations={locations}
                users={users}
                currentRole={currentRole}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                selectedUser={selectedUser}
                onUserChange={setSelectedUser}
                onSelectAsset={handleOpenDetail}
                onCheckout={handleOpenCheckout}
                onCheckin={handleOpenCheckin}
                onMove={handleOpenMove}
                onTransferProject={handleOpenTransferProject}
                onShowQr={handleOpenQr}
                onOpenCreateAsset={handleOpenCreateAsset}
              />
            )}

            {/* TAB 3: Locations Hierarchy View */}
            {activeTab === 'locations' && (
              <LocationsView
                locations={locations}
                assets={assets}
                projects={projects}
                users={users}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
                currentRole={currentRole}
                onRefresh={fetchData}
                onSelectLocationFilter={(locId, projId) => {
                  if (projId) {
                    setSelectedProject(projId);
                  }
                  setSelectedLocation(locId);
                  setActiveTab('assets');
                }}
              />
            )}

            {/* TAB 4: Audit & Transaction History View */}
            {activeTab === 'audit' && <AuditHistoryView />}

            {/* TAB 5: REST API & SRS Spec View */}
            {activeTab === 'api' && <ApiDocsView />}
          </>
        )}
      </main>

      {/* Footer Info */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-700">Smart Asset Finder MVP</strong> — Hệ thống quản lý &
            định vị tài sản theo sự kiện (Event-based Last Known Location).
          </div>
          <div className="text-slate-400 text-[11px]">
            Role hiện tại: <span className="font-semibold text-slate-600">{currentRole}</span> •
            Tuân thủ SRS v1.0 (BR-001 đến BR-007)
          </div>
        </div>
      </footer>

      {/* Toast Notification (raised on mobile to avoid bottom nav) */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-[90vw]">
          <div
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold text-white ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 border-slate-800'
                : 'bg-rose-600 border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            )}
            <span className="truncate">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Navigation Bar (Visible only on mobile devices) */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        currentRole={currentRole}
      />

      {/* MODALS */}

      {/* 1. Asset Detail Modal */}
      {detailAsset && (
        <AssetDetailModal
          asset={detailAsset}
          onClose={() => setDetailAsset(null)}
          categories={categories}
          locations={locations}
          projects={projects}
          users={users}
          currentRole={currentRole}
          onCheckout={handleOpenCheckout}
          onCheckin={handleOpenCheckin}
          onMove={handleOpenMove}
          onTransferProject={handleOpenTransferProject}
          onShowQr={handleOpenQr}
          onEditAsset={handleOpenEditAsset}
          onStatusChanged={() => {
            fetchData();
            // Re-fetch detail
            api.getAsset(detailAsset.asset_id).then(setDetailAsset);
          }}
        />
      )}

      {/* 2. Check-out Modal */}
      {checkoutAsset && (
        <CheckoutModal
          asset={checkoutAsset}
          onClose={() => setCheckoutAsset(null)}
          onSuccess={() => handleSuccessAction(`Check-out thành công cho ${checkoutAsset.asset_id}`)}
          users={users}
          locations={locations}
          categories={categories}
        />
      )}

      {/* 3. Check-in Modal */}
      {checkinAsset && (
        <CheckinModal
          asset={checkinAsset}
          onClose={() => setCheckinAsset(null)}
          onSuccess={() => handleSuccessAction(`Check-in hoàn trả thành công cho ${checkinAsset.asset_id}`)}
          users={users}
          locations={locations}
        />
      )}

      {/* 4. Move Modal */}
      {moveAsset && (
        <MoveModal
          asset={moveAsset}
          onClose={() => setMoveAsset(null)}
          onSuccess={() => handleSuccessAction(`Cập nhật vị trí mới thành công cho ${moveAsset.asset_id}`)}
          locations={locations}
          users={users}
        />
      )}

      {/* 5. QR Code & Printable Tag Modal */}
      {qrAsset && (
        <QrCodeModal
          asset={qrAsset}
          onClose={() => setQrAsset(null)}
          categories={categories}
        />
      )}

      {/* 6. QR Scanner Modal */}
      {isScannerOpen && (
        <QrScannerModal
          onClose={() => setIsScannerOpen(false)}
          onAssetFound={handleScanFound}
          allAssets={assets}
          locations={locations}
          users={users}
          onCheckout={(asset) => {
            setIsScannerOpen(false);
            handleOpenCheckout(asset);
          }}
          onCheckin={(asset) => {
            setIsScannerOpen(false);
            handleOpenCheckin(asset);
          }}
          onMove={(asset) => {
            setIsScannerOpen(false);
            handleOpenMove(asset);
          }}
          onViewDetail={(asset) => {
            setIsScannerOpen(false);
            handleOpenDetail(asset);
          }}
        />
      )}

      {/* 7. Asset Create / Edit Form Modal */}
      {isFormOpen && (
        <AssetFormModal
          assetToEdit={assetToEdit}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => handleSuccessAction(assetToEdit ? 'Cập nhật tài sản thành công' : 'Đăng ký tài sản mới thành công')}
          categories={categories}
          locations={locations}
          projects={projects}
        />
      )}

      {/* 8. Transfer Project / Worksite Modal */}
      {transferAsset && (
        <TransferProjectModal
          asset={transferAsset}
          onClose={() => setTransferAsset(null)}
          onSuccess={() => handleSuccessAction(`Điều chuyển thành công thiết bị ${transferAsset.asset_id} sang công trường mới`)}
          projects={projects}
          locations={locations}
          users={users}
        />
      )}
    </div>
  );
}
