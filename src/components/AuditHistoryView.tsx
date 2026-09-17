import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, Search, Filter, Clock, MapPin, User as UserIcon } from 'lucide-react';
import { AuditLog } from '../types';
import { api } from '../services/api';
import { formatDateTime } from '../utils/formatters';

export const AuditHistoryView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = actionFilter === 'ALL' || log.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Audit Log & Transaction History (Mục 16, 23 — Who, What, When, Where)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Nhật ký kiểm toán bất biến tuân thủ BR-006 & BR-007 (Không thể xóa lịch sử giao dịch)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {logs.length} bản ghi
          </span>
        </div>
      </div>

      {/* Controls: Search & Action Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Lọc theo người thực hiện, Asset ID, vị trí, ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả hành động</option>
            <option value="CHECKED OUT">CHECKED OUT</option>
            <option value="CHECKED IN">CHECKED IN</option>
            <option value="MOVED">MOVED</option>
            <option value="STATUS">STATUS CHANGED</option>
            <option value="CREATED">CREATED ASSET</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">Đang tải nhật ký kiểm toán...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Không tìm thấy bản ghi nào khớp với điều kiện lọc.</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards (< sm) */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => {
                const isCheckout = log.action.includes('CHECKED OUT');
                const isCheckin = log.action.includes('CHECKED IN');
                const isMove = log.action.includes('MOVED');

                return (
                  <div key={log.id} className="p-4 space-y-2.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 block">
                          {log.asset_id}
                        </span>
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                          {log.asset_name}
                        </span>
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          isCheckout
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : isCheckin
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : isMove
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center space-x-1.5 truncate">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{log.user_name}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{log.location_name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>{formatDateTime(log.timestamp)}</span>
                      </div>
                      {log.details && (
                        <span className="text-slate-500 dark:text-slate-400 italic truncate max-w-[160px]">
                          {log.details}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tablet & Desktop View: Table (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">When (Thời gian)</th>
                    <th className="py-3 px-3">Who (Người thực hiện)</th>
                    <th className="py-3 px-3">What (Hành động)</th>
                    <th className="py-3 px-3">Asset ID & Tên</th>
                    <th className="py-3 px-3">Where (Vị trí)</th>
                    <th className="py-3 px-4">Details / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.map((log) => {
                    const isCheckout = log.action.includes('CHECKED OUT');
                    const isCheckin = log.action.includes('CHECKED IN');
                    const isMove = log.action.includes('MOVED');

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        {/* When */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            <span>{formatDateTime(log.timestamp)}</span>
                          </div>
                        </td>

                        {/* Who */}
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                            <UserIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>{log.user_name}</span>
                          </span>
                        </td>

                        {/* What */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              isCheckout
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : isCheckin
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : isMove
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Asset */}
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">
                            {log.asset_id}
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 block truncate max-w-[180px]">
                            {log.asset_name}
                          </span>
                        </td>

                        {/* Where */}
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="font-medium">{log.location_name}</span>
                          </div>
                        </td>

                        {/* Details */}
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                          {log.details || '—'}
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
  );
};
