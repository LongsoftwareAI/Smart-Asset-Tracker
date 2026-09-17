import React, { useState, useMemo } from 'react';
import { MapPin, Plus, FolderTree, Building, Layers, DoorOpen, Boxes, X, Briefcase, ChevronRight, Warehouse, ExternalLink, Filter } from 'lucide-react';
import { Asset, Location, Project, User, UserRole } from '../types';
import { api } from '../services/api';

interface LocationsViewProps {
  locations: Location[];
  assets: Asset[];
  projects: Project[];
  users?: User[];
  selectedProject?: string;
  onProjectChange?: (projectId: string) => void;
  currentRole: UserRole;
  onRefresh: () => void;
  onSelectLocationFilter: (locationId: string, projectId?: string) => void;
}

export const LocationsView: React.FC<LocationsViewProps> = ({
  locations,
  assets,
  projects,
  users = [],
  selectedProject = 'ALL',
  onProjectChange,
  currentRole,
  onRefresh,
  onSelectLocationFilter,
}) => {
  const [activeProjectFilter, setActiveProjectFilter] = useState<string>(selectedProject || 'ALL');
  
  // Location Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState<'SITE' | 'ZONE' | 'FLOOR' | 'ROOM' | 'AREA'>('ZONE');
  const [modalProjectId, setModalProjectId] = useState<string>(
    selectedProject && selectedProject !== 'ALL' ? selectedProject : (projects[0]?.project_id || 'PROJ-CENTRAL')
  );
  const [parentId, setParentId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Project Modal State (SRS Multi-Project)
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [projName, setProjName] = useState('');
  const [projCode, setProjCode] = useState('');
  const [projAddress, setProjAddress] = useState('');
  const [projManagerId, setProjManagerId] = useState('USER-004');
  const [projDescription, setProjDescription] = useState('');
  const [projLoading, setProjLoading] = useState(false);
  const [projErrorMsg, setProjErrorMsg] = useState<string | null>(null);

  // Sync active project if prop changes
  const currentProjFilter = activeProjectFilter;

  const handleSelectProjectTab = (projId: string) => {
    setActiveProjectFilter(projId);
    if (onProjectChange) {
      onProjectChange(projId);
    }
  };

  // Filter projects to display
  const displayedProjects = useMemo(() => {
    if (currentProjFilter === 'ALL') {
      return projects;
    }
    return projects.filter((p) => p.project_id === currentProjFilter);
  }, [projects, currentProjFilter]);

  // Helper to get locations for a specific project
  const getLocationsForProject = (projectId: string) => {
    return locations.filter((loc) => {
      if (loc.project_id === projectId) return true;
      // If legacy location without project_id, associate with first project
      if (!loc.project_id && projectId === 'PROJ-CENTRAL') return true;
      return false;
    });
  };

  const getChildren = (parentId: string, projLocs: Location[]) => {
    return projLocs.filter((l) => l.parent_location_id === parentId);
  };

  const getAssetCount = (locId: string) => {
    return assets.filter((a) => a.current_location_id === locId).length;
  };

  const getProjectAssetCount = (projId: string) => {
    return assets.filter((a) => a.project_id === projId).length;
  };

  // Locations available for modal parent selection
  const modalEligibleParents = useMemo(() => {
    const projLocs = locations.filter((l) => l.project_id === modalProjectId || (!l.project_id && modalProjectId === 'PROJ-CENTRAL'));
    if (locType === 'ZONE') {
      return projLocs.filter((l) => l.location_type === 'SITE');
    }
    if (locType === 'FLOOR') {
      return projLocs.filter((l) => l.location_type === 'ZONE' || l.location_type === 'SITE');
    }
    if (locType === 'ROOM') {
      return projLocs.filter((l) => l.location_type === 'SITE' || l.location_type === 'ZONE' || l.location_type === 'FLOOR');
    }
    return projLocs;
  }, [locations, modalProjectId, locType]);

  const handleOpenAddModal = (presetProjectId?: string, presetParentId?: string) => {
    const targetProj = presetProjectId || (currentProjFilter !== 'ALL' ? currentProjFilter : projects[0]?.project_id || 'PROJ-CENTRAL');
    setModalProjectId(targetProj);
    setLocType('ZONE');
    setLocName('');
    setDescription('');
    setErrorMsg(null);

    if (presetParentId) {
      setParentId(presetParentId);
    } else {
      const siteLoc = locations.find((l) => (l.project_id === targetProj || (!l.project_id && targetProj === 'PROJ-CENTRAL')) && l.location_type === 'SITE');
      setParentId(siteLoc?.location_id || '');
    }
    setShowAddModal(true);
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.createLocation({
        location_name: locName.trim(),
        location_type: locType,
        parent_location_id: parentId || null,
        project_id: modalProjectId || null,
        description: description.trim(),
      });
      setShowAddModal(false);
      setLocName('');
      setDescription('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi thêm vị trí');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddProjectModal = () => {
    setProjName('');
    setProjCode('');
    setProjAddress('');
    setProjManagerId(users[0]?.user_id || 'USER-004');
    setProjDescription('');
    setProjErrorMsg(null);
    setShowAddProjectModal(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !projCode.trim()) {
      setProjErrorMsg('Vui lòng nhập tên và mã dự án');
      return;
    }
    setProjLoading(true);
    setProjErrorMsg(null);
    try {
      const createdProj = await api.createProject({
        project_name: projName.trim(),
        project_code: projCode.trim().toUpperCase(),
        address: projAddress.trim(),
        manager_user_id: projManagerId,
        description: projDescription.trim(),
        status: 'ACTIVE',
      });
      setShowAddProjectModal(false);
      onRefresh();
      // Auto-switch to view the new project
      if (createdProj?.project_id) {
        handleSelectProjectTab(createdProj.project_id);
      }
    } catch (err: any) {
      setProjErrorMsg(err.message || 'Lỗi khi tạo dự án mới');
    } finally {
      setProjLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SITE':
        return <Building className="w-4 h-4 text-blue-600" />;
      case 'ZONE':
        return <Layers className="w-4 h-4 text-emerald-600" />;
      case 'FLOOR':
        return <FolderTree className="w-4 h-4 text-amber-600" />;
      case 'ROOM':
        return <Warehouse className="w-4 h-4 text-purple-600" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SITE':
        return <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">SITE (Công trường)</span>;
      case 'ZONE':
        return <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">ZONE (Phân khu)</span>;
      case 'FLOOR':
        return <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">FLOOR (Tầng)</span>;
      case 'ROOM':
        return <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">WAREHOUSE / KHO</span>;
      default:
        return <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <span>Quản lý Vị trí & Kho lưu trữ theo Dự án (SRS Mục 7)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Mỗi dự án / công trường sở hữu sơ đồ phân cấp riêng biệt gồm Site &rarr; Zone &rarr; Floor &rarr; Kho thiết bị (Warehouse) phục vụ định vị và bàn giao tài sản chuẩn xác.
          </p>
        </div>

        {currentRole === 'ADMIN' && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => handleOpenAddProjectModal()}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 shrink-0 min-h-[44px]"
              title="Tạo dự án / công trường mới cho doanh nghiệp"
            >
              <Briefcase className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>+ Thêm Dự án mới</span>
            </button>
            <button
              onClick={() => handleOpenAddModal()}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-2 shrink-0 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Khu vực / Kho</span>
            </button>
          </div>
        )}
      </div>

      {/* Project Selector Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Lọc xem theo Dự án / Công trường:</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Tổng cộng {projects.length} dự án &bull; {locations.length} vị trí / kho
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => handleSelectProjectTab('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 min-h-[40px] ${
              currentProjFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Tất cả dự án ({projects.length})</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${currentProjFilter === 'ALL' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
              {assets.length} TB
            </span>
          </button>

          {projects.map((proj) => {
            const isSelected = currentProjFilter === proj.project_id;
            const projAssets = getProjectAssetCount(proj.project_id);
            const projLocs = getLocationsForProject(proj.project_id);

            return (
              <button
                key={proj.project_id}
                onClick={() => handleSelectProjectTab(proj.project_id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 min-h-[40px] ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{proj.project_name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                  {projLocs.length} KV &bull; {projAssets} TB
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Project Location Trees */}
      <div className="space-y-6">
        {displayedProjects.map((project) => {
          const projLocations = getLocationsForProject(project.project_id);
          const rootLocs = projLocations.filter((l) => !l.parent_location_id);
          const orphanLocs = projLocations.filter(
            (l) => l.parent_location_id && !projLocations.some((parent) => parent.location_id === l.parent_location_id)
          );
          const totalAssetsInProject = getProjectAssetCount(project.project_id);

              return (
                <div
                  key={project.project_id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 transition-colors"
                >
                  {/* Project Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-start sm:items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">{project.project_name}</h3>
                          <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {project.project_code}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            {project.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {project.address || 'Chưa cập nhật địa chỉ'} &bull; {project.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                        <Boxes className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>{totalAssetsInProject} tài sản thuộc dự án</span>
                      </span>
                      {currentRole === 'ADMIN' && (
                        <button
                          onClick={() => handleOpenAddModal(project.project_id)}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm KV vào dự án này</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hierarchy Tree for this project */}
                  {projLocations.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Chưa có phân khu hoặc kho lưu trữ nào cho dự án này</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Bấm "Thêm KV vào dự án này" để tạo Site, Zone hoặc Kho lưu trữ thiết bị</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rootLocs.map((site) => {
                        const zones = getChildren(site.location_id, projLocations);
                        const siteAssetCount = getAssetCount(site.location_id);

                        return (
                          <div key={site.location_id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                            {/* Site Level */}
                            <div className="bg-slate-50/90 dark:bg-slate-800/90 p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0">
                                  {getTypeIcon(site.location_type)}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{site.location_name}</span>
                                    {getTypeBadge(site.location_type)}
                                  </div>
                                  {site.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{site.description}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => onSelectLocationFilter(site.location_id, project.project_id)}
                                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                                >
                                  <Boxes className="w-3.5 h-3.5" />
                                  <span>{siteAssetCount} tài sản</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </button>
                              </div>
                            </div>

                            {/* Zones & Warehouses under Site */}
                            <div className="p-4 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                              {zones.length === 0 ? (
                                <div className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
                                  Chưa có phân khu con. Bấm thêm khu vực để tạo Zone, Floor hoặc Kho.
                                </div>
                              ) : (
                                zones.map((zone) => {
                                  const floors = getChildren(zone.location_id, projLocations);
                                  const zoneAssetCount = getAssetCount(zone.location_id);
                                  const isWarehouse = zone.location_type === 'ROOM';

                                  return (
                                    <div key={zone.location_id} className="py-3 first:pt-0 last:pb-0">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2.5">
                                          <span className="text-slate-300 dark:text-slate-600 font-mono text-xs">├──</span>
                                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isWarehouse ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300' : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'}`}>
                                            {getTypeIcon(zone.location_type)}
                                          </div>
                                          <div>
                                            <div className="flex items-center space-x-2 flex-wrap">
                                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{zone.location_name}</span>
                                              {getTypeBadge(zone.location_type)}
                                            </div>
                                            {zone.description && (
                                              <p className="text-[11px] text-slate-400 dark:text-slate-500">{zone.description}</p>
                                            )}
                                          </div>
                                        </div>

                                        <button
                                          onClick={() => onSelectLocationFilter(zone.location_id, project.project_id)}
                                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
                                            isWarehouse
                                              ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800'
                                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300'
                                          }`}
                                        >
                                          <span>{zoneAssetCount} tài sản đang tại đây</span>
                                          <ChevronRight className="w-3 h-3" />
                                        </button>
                                      </div>

                                      {/* Floors / Sub-rooms under Zone */}
                                      {floors.length > 0 && (
                                        <div className="pl-6 sm:pl-8 space-y-1.5 mt-2">
                                          {floors.map((floor) => {
                                            const floorAssetCount = getAssetCount(floor.location_id);
                                            return (
                                              <div
                                                key={floor.location_id}
                                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800"
                                              >
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-slate-300 dark:text-slate-600 font-mono text-xs">└──</span>
                                                  <div className="w-5 h-5 rounded bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                                                    {getTypeIcon(floor.location_type)}
                                                  </div>
                                                  <div>
                                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                      {floor.location_name}
                                                    </span>
                                                    {floor.description && (
                                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2 hidden sm:inline">
                                                        ({floor.description})
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>

                                                <button
                                                  onClick={() => onSelectLocationFilter(floor.location_id, project.project_id)}
                                                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer flex items-center space-x-1"
                                                >
                                                  <span>{floorAssetCount} tài sản</span>
                                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Any orphan locations */}
                      {orphanLocs.length > 0 && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
                          <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Khu vực độc lập (Chưa gắn Site cha):</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {orphanLocs.map((orph) => (
                              <div key={orph.location_id} className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-amber-100 dark:border-amber-900/60 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {getTypeIcon(orph.location_type)}
                                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{orph.location_name}</span>
                                </div>
                                <button
                                  onClick={() => onSelectLocationFilter(orph.location_id, project.project_id)}
                                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {getAssetCount(orph.location_id)} TB
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
        })}
      </div>

      {/* Add Location / Warehouse Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[92dvh] sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2">
                <Warehouse className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-bold">Thêm mới Khu vực / Kho lưu trữ Dự án</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Đóng"
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLocation} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto overflow-x-hidden flex-1">
                {errorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs">
                    {errorMsg}
                  </div>
                )}

                {/* Select Project */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Thuộc Dự án / Công trường *
                  </label>
                  <select
                    value={modalProjectId}
                    onChange={(e) => {
                      const newProj = e.target.value;
                      setModalProjectId(newProj);
                      const firstSite = locations.find((l) => (l.project_id === newProj || (!l.project_id && newProj === 'PROJ-CENTRAL')) && l.location_type === 'SITE');
                      setParentId(firstSite?.location_id || '');
                    }}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  >
                    {projects.map((p) => (
                      <option key={p.project_id} value={p.project_id}>
                        {p.project_name} ({p.project_code})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Khu vực hoặc kho mới sẽ được phân bổ vào sơ đồ riêng của dự án này.
                  </p>
                </div>

                {/* Location Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên Vị trí / Tên Kho lưu trữ *
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Kho tổng cơ điện, Zone Ga Bến Thành, Tầng 3..."
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phân loại (Location Type) *
                    </label>
                    <select
                      value={locType}
                      onChange={(e) => setLocType(e.target.value as any)}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      <option value="SITE">SITE (Công trường / Dự án)</option>
                      <option value="ZONE">ZONE (Phân khu thi công)</option>
                      <option value="FLOOR">FLOOR (Tầng / Sàn)</option>
                      <option value="ROOM">WAREHOUSE / KHO THIẾT BỊ</option>
                      <option value="AREA">AREA (Khu vực mở rộng)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Khu vực cha (Parent)
                    </label>
                    <select
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">(Là gốc / Site cấp cao nhất)</option>
                      {modalEligibleParents.map((l) => (
                        <option key={l.location_id} value={l.location_id}>
                          [{l.location_type}] {l.location_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ghi chú / Đặc điểm kho hoặc vị trí
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Mô tả phạm vi thi công, thủ kho quản lý hoặc chỉ dẫn định vị..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="shrink-0 bg-slate-50/95 dark:bg-slate-800/95 border-t border-slate-200 dark:border-slate-700 px-5 py-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  {loading ? 'Đang lưu...' : 'Thêm vị trí / Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Project / Construction Site Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="shrink-0 bg-slate-900 dark:bg-slate-950 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">Thêm Dự án / Công trường mới</h3>
                  <p className="text-[11px] text-slate-400">Tự động khởi tạo Site gốc và Kho thiết bị tập trung</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddProjectModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {projErrorMsg && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium">
                    {projErrorMsg}
                  </div>
                )}

                {/* Project Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên Dự án / Tên Công trường *
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Dự án Cầu Thủ Thiêm 4, Nhà máy Lego Bình Dương..."
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    required
                  />
                </div>

                {/* Project Code & Manager */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mã dự án (Project Code) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: TT-04, LEGO-BD..."
                      value={projCode}
                      onChange={(e) => setProjCode(e.target.value.toUpperCase())}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Chỉ huy trưởng / Quản lý dự án
                    </label>
                    <select
                      value={projManagerId}
                      onChange={(e) => setProjManagerId(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    >
                      {users && users.length > 0 ? (
                        users.map((u) => (
                          <option key={u.user_id} value={u.user_id}>
                            {u.name} ({u.role})
                          </option>
                        ))
                      ) : (
                        <option value="USER-004">Phạm Văn Quản Lý (MANAGER)</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Địa chỉ / Vị trí địa lý công trường
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Quận 7 & TP. Thủ Đức, TP. Hồ Chí Minh"
                    value={projAddress}
                    onChange={(e) => setProjAddress(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mô tả quy mô / Ghi chú công trường
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Quy mô dự án, thời gian dự kiến thi công, yêu cầu thiết bị..."
                    value={projDescription}
                    onChange={(e) => setProjDescription(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800/80 text-[11px] text-amber-900 dark:text-amber-300 flex items-start space-x-2">
                  <span className="text-sm leading-none mt-0.5">💡</span>
                  <span>
                    Hệ thống sẽ <strong>tự động tạo ngay</strong> một sơ đồ công trường gốc và <strong>Kho thiết bị & vật tư</strong> riêng cho dự án này để sẵn sàng tiếp nhận tài sản và điều chuyển thiết bị.
                  </span>
                </div>
              </div>

              <div className="shrink-0 bg-slate-50/95 dark:bg-slate-800/95 border-t border-slate-200 dark:border-slate-700 px-5 py-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={projLoading}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  {projLoading ? 'Đang khởi tạo...' : 'Tạo Dự án & Khởi tạo Sơ đồ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
