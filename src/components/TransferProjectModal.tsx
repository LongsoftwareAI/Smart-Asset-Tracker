import React, { useState, useMemo } from 'react';
import { X, ArrowRightLeft, Building2, MapPin, Check, AlertCircle } from 'lucide-react';
import { Asset, Location, Project, User } from '../types';
import { api } from '../services/api';
import { getLocationName } from '../utils/formatters';
import * as MESSAGES from '../../shared/messages';

interface TransferProjectModalProps {
  asset: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
  projects: Project[];
  locations: Location[];
  users: User[];
}

export const TransferProjectModal: React.FC<TransferProjectModalProps> = ({
  asset,
  onClose,
  onSuccess,
  projects,
  locations,
  users,
}) => {
  const currentProjId = asset?.project_id;
  const currentProject = projects.find((p) => p.project_id === currentProjId);
  const otherProjects = projects.filter((p) => p.project_id !== currentProjId);

  const [toProjectId, setToProjectId] = useState<string>(otherProjects[0]?.project_id || '');
  
  // Target project locations
  const targetLocations = useMemo(() => {
    return locations.filter((loc) => loc.project_id === toProjectId || (!loc.project_id && toProjectId === 'PROJ-CENTRAL'));
  }, [locations, toProjectId]);

  const [newLocationId, setNewLocationId] = useState<string>(
    targetLocations[0]?.location_id || 'LOC-WAREHOUSE'
  );
  const [userId, setUserId] = useState<string>(asset?.current_user_id || users[0]?.user_id || '');
  const [note, setNote] = useState<string>(MESSAGES.TRANSFER_DEFAULT_NOTE);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTargetProjectChange = (newTargetProjId: string) => {
    setToProjectId(newTargetProjId);
    const firstTargetLoc = locations.find((l) => l.project_id === newTargetProjId || (!l.project_id && newTargetProjId === 'PROJ-CENTRAL'));
    if (firstTargetLoc) {
      setNewLocationId(firstTargetLoc.location_id);
    }
  };

  if (!asset) return null;

  const targetProject = projects.find((p) => p.project_id === toProjectId);
  const currentLocationName = getLocationName(locations, asset.current_location_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toProjectId) {
      setErrorMsg(MESSAGES.TARGET_PROJECT_REQUIRED);
      return;
    }
    if (toProjectId === asset.project_id) {
      setErrorMsg(MESSAGES.SAME_PROJECT);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await api.transferAssetProject(asset.asset_id, {
        to_project_id: toProjectId,
        location_id: newLocationId || undefined,
        user_id: userId,
        note,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || MESSAGES.TRANSFER_FAILED);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[92dvh] sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">{MESSAGES.TRANSFER_TITLE}</h3>
              <p className="text-[11px] text-slate-400">
                {MESSAGES.TRANSFER_HELP}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={MESSAGES.CLOSE_MODAL}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Asset Summary Badge */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 block">
                  {asset.asset_id}
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white block truncate">
                  {asset.asset_name}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{MESSAGES.TRANSFER_CURRENT_LOCATION}</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block truncate max-w-[140px]">
                  {currentLocationName}
                </span>
              </div>
            </div>

            {/* Transfer Visual Route (With min-w-0 to prevent horizontal overflow on mobile) */}
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 rounded-xl flex items-center justify-between text-xs gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold block mb-0.5">
                  {MESSAGES.CURRENT_PROJECT}
                </span>
                <span
                  className="font-semibold text-slate-900 dark:text-white block truncate"
                  title={currentProject ? `${currentProject.project_code} - ${currentProject.project_name}` : MESSAGES.CENTRAL_WAREHOUSE}
                >
                  {currentProject ? `${currentProject.project_code} - ${currentProject.project_name}` : MESSAGES.CENTRAL_WAREHOUSE}
                </span>
              </div>
              <ArrowRightLeft className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mx-1" />
              <div className="flex-1 min-w-0 text-right">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold block mb-0.5">
                  {MESSAGES.TARGET_PROJECT}
                </span>
                <span
                  className="font-semibold text-emerald-900 dark:text-emerald-300 block truncate"
                  title={targetProject ? `${targetProject.project_code} - ${targetProject.project_name}` : MESSAGES.SELECT_BELOW}
                >
                  {targetProject ? `${targetProject.project_code} - ${targetProject.project_name}` : MESSAGES.SELECT_BELOW}
                </span>
              </div>
            </div>

            {/* Select Target Project */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {MESSAGES.SELECT_TARGET_PROJECT} <span className="text-red-500">*</span>
              </label>
              <select
                id="transfer-target-project-select"
                value={toProjectId}
                onChange={(e) => handleTargetProjectChange(e.target.value)}
                required
                className="w-full max-w-full text-xs sm:text-sm p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
              >
                {otherProjects.map((p) => (
                  <option key={p.project_id} value={p.project_id}>
                    [{p.project_code}] {p.project_name} - {p.address}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Initial Location at Target Site */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>{MESSAGES.TRANSFER_TARGET_LOCATION}</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">{MESSAGES.TARGET_PROJECT_LOCATION_HELP}</span>
              </label>
              <select
                id="transfer-target-location-select"
                value={newLocationId}
                onChange={(e) => setNewLocationId(e.target.value)}
                className="w-full max-w-full text-xs sm:text-sm p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {targetLocations.length === 0 ? (
                  <option value="LOC-WAREHOUSE">{MESSAGES.DEFAULT_WAREHOUSE}</option>
                ) : (
                  targetLocations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      [{loc.location_type}] {loc.location_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Manager / Supervisor Performing */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {MESSAGES.TRANSFER_PERFORMER_LABEL}
              </label>
              <select
                id="transfer-user-select"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full max-w-full text-xs sm:text-sm p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.name} ({u.role}) - {u.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Transfer Note / Dispatch Order */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {MESSAGES.TRANSFER_COMMAND_LABEL}
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={MESSAGES.TRANSFER_NOTE_PLACEHOLDER}
                className="w-full max-w-full text-xs sm:text-sm p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Clean Pinned Footer - NEVER causes horizontal overflow */}
          <div className="shrink-0 bg-slate-50/95 dark:bg-slate-800/95 border-t border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer min-h-[44px]"
            >
              {MESSAGES.CANCEL}
            </button>
            <button
              type="submit"
              disabled={loading || !toProjectId}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5 min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? MESSAGES.UPDATING : MESSAGES.ACTION_CONFIRM_TRANSFER}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
