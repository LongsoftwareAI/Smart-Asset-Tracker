import React, { useState, useMemo } from 'react';
import { X, Plus, Save, Sparkles, Building2 } from 'lucide-react';
import { Asset, AssetCategory, AssetStatus, Location, Project } from '../types';
import { api, CreateAssetPayload } from '../services/api';
import * as MESSAGES from '../../shared/messages';

interface AssetFormModalProps {
  assetToEdit: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
  categories: AssetCategory[];
  locations: Location[];
  projects?: Project[];
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  assetToEdit,
  onClose,
  onSuccess,
  categories,
  locations,
  projects = [],
}) => {
  const isEditing = !!assetToEdit;

  const [assetId, setAssetId] = useState(assetToEdit?.asset_id || '');
  const [assetName, setAssetName] = useState(assetToEdit?.asset_name || '');
  const [categoryId, setCategoryId] = useState(assetToEdit?.category_id || categories[0]?.category_id || '');
  const [serialNumber, setSerialNumber] = useState(assetToEdit?.serial_number || '');
  const [rfidCode, setRfidCode] = useState(assetToEdit?.rfid_code || '');
  const [projectId, setProjectId] = useState(assetToEdit?.project_id || projects[0]?.project_id || 'PROJ-CENTRAL');
  
  // Filter locations available for the selected project
  const projectLocations = useMemo(() => {
    return locations.filter((loc) => loc.project_id === projectId || (!loc.project_id && projectId === 'PROJ-CENTRAL'));
  }, [locations, projectId]);

  const [locationId, setLocationId] = useState(
    assetToEdit?.current_location_id || projectLocations[0]?.location_id || 'LOC-WAREHOUSE'
  );
  const [description, setDescription] = useState(assetToEdit?.description || '');
  const [status, setStatus] = useState<AssetStatus>(assetToEdit?.status || AssetStatus.AVAILABLE);

  // Handle project change and sync default location
  const handleProjectChange = (newProjId: string) => {
    setProjectId(newProjId);
    const firstLoc = locations.find((l) => l.project_id === newProjId || (!l.project_id && newProjId === 'PROJ-CENTRAL'));
    if (firstLoc) {
      setLocationId(firstLoc.location_id);
    }
  };

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-generate Asset ID suggestion
  const generateSuggestedId = () => {
    const prefix = categoryId.includes('power')
      ? 'DRILL'
      : categoryId.includes('measur')
      ? 'METER'
      : categoryId.includes('safety')
      ? 'SAFE'
      : categoryId.includes('ladder')
      ? 'LADD'
      : categoryId.includes('elect')
      ? 'ELEC'
      : 'ASSET';
    const randNum = Math.floor(100 + Math.random() * 900);
    setAssetId(`${prefix}-${randNum}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) {
      setErrorMsg(MESSAGES.ASSET_NAME_REQUIRED);
      return;
    }
    if (!categoryId) {
      setErrorMsg(MESSAGES.CATEGORY_REQUIRED);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (isEditing) {
        await api.updateAsset(assetToEdit.asset_id, {
          asset_name: assetName.trim(),
          category_id: categoryId,
          project_id: projectId || undefined,
          serial_number: serialNumber.trim() || undefined,
          rfid_code: rfidCode.trim() || undefined,
          description: description.trim() || undefined,
        });
      } else {
        const payload: CreateAssetPayload = {
          asset_id: assetId.trim() || undefined,
          asset_name: assetName.trim(),
          category_id: categoryId,
          project_id: projectId || undefined,
          serial_number: serialNumber.trim() || undefined,
          rfid_code: rfidCode.trim() || undefined,
          current_location_id: locationId,
          description: description.trim() || undefined,
          status,
        };
        await api.createAsset(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || MESSAGES.SAVE_FAILED);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[92dvh] sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
        {/* Header - Fixed & prominent */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isEditing ? MESSAGES.EDIT_ASSET_TITLE(assetToEdit.asset_id) : MESSAGES.CREATE_ASSET_TITLE}
              </h3>
              <p className="text-[11px] text-slate-400">{MESSAGES.ADMIN_ONLY_HELP}</p>
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

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Asset ID field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {MESSAGES.ASSET_ID_LABEL}
              </label>
              {!isEditing && (
                <button
                  type="button"
                  onClick={generateSuggestedId}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center space-x-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{MESSAGES.AUTO_GENERATE_CODE}</span>
                </button>
              )}
            </div>
            <input
              id="asset-id-input"
              type="text"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              placeholder={MESSAGES.ASSET_ID_PLACEHOLDER}
              disabled={isEditing}
              className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-50"
              required={!isEditing}
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {MESSAGES.QR_LINK_HELP} <code>SMART-ASSET:{assetId || '[ID]'}</code>
            </p>
          </div>

          {/* Asset Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {MESSAGES.ASSET_NAME_LABEL}
            </label>
            <input
              id="asset-name-input"
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder={MESSAGES.ASSET_NAME_PLACEHOLDER}
              className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Category Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {MESSAGES.CATEGORY_LABEL}
              </label>
              <select
                id="asset-category-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project / Worksite Assignment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>{MESSAGES.PROJECT_LABEL}</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">{MESSAGES.ALLOCATION_LABEL}</span>
              </label>
              <select
                id="asset-project-select"
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              >
                {projects.map((p) => (
                  <option key={p.project_id} value={p.project_id}>
                    [{p.project_code}] {p.project_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Initial Location (only when creating) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {MESSAGES.INITIAL_LOCATION_LABEL}
              </label>
              <select
                id="asset-location-select"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projectLocations.length === 0 ? (
                  <option value="LOC-WAREHOUSE">{MESSAGES.DEFAULT_WAREHOUSE}</option>
                ) : (
                  projectLocations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      [{loc.location_type}] {loc.location_name}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Serial Number & RFID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {MESSAGES.SERIAL_NUMBER_LABEL}
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder={MESSAGES.SERIAL_PLACEHOLDER}
                className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {MESSAGES.RFID_LABEL}
              </label>
              <input
                type="text"
                value={rfidCode}
                onChange={(e) => setRfidCode(e.target.value)}
                placeholder={MESSAGES.RFID_PLACEHOLDER}
                className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{MESSAGES.DESCRIPTION_LABEL}</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={MESSAGES.DESCRIPTION_PLACEHOLDER}
              className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Clean Pinned Footer - NEVER causes horizontal overflow */}
        <div className="shrink-0 bg-slate-50/95 dark:bg-slate-800/95 border-t border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer min-h-[44px]"
          >
            {MESSAGES.CANCEL}
          </button>
          <button
            id="btn-save-asset"
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-1.5 min-h-[44px]"
          >
            <Save className="w-4 h-4" />
              <span>{loading ? MESSAGES.SAVING : isEditing ? MESSAGES.UPDATE_ASSET_ACTION : MESSAGES.CREATE_ASSET_ACTION}</span>
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
