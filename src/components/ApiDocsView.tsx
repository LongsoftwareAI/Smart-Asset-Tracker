import React, { useState } from 'react';
import {
  Code2,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../services/api';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  path: string;
  description: string;
  brRef: string;
  sampleBody?: any;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/health',
    description: 'Kiểm tra trạng thái máy chủ',
    brRef: 'System',
  },
  {
    method: 'GET',
    path: '/api/dashboard/stats',
    description: 'Lấy các chỉ số KPI tổng quan, cảnh báo quá hạn và phân bổ theo vị trí',
    brRef: 'SRS Mục 20, 22',
  },
  {
    method: 'GET',
    path: '/api/assets',
    description: 'Danh sách tài sản kèm bộ lọc status, category, location, user',
    brRef: 'SRS Mục 9, 21',
  },
  {
    method: 'GET',
    path: '/api/assets/DRILL-021',
    description: 'Tra cứu thông tin chi tiết một tài sản theo Asset ID hoặc QR code',
    brRef: 'SRS Mục 10, QR-001',
  },
  {
    method: 'GET',
    path: '/api/assets/DRILL-021/history',
    description: 'Lấy lịch sử giao dịch và dịch chuyển bất biến của tài sản',
    brRef: 'BR-006, BR-007, SRS Mục 15',
  },
  {
    method: 'POST',
    path: '/api/assets/DRILL-021/checkout',
    description: 'Check-out mượn tài sản thi công (chuyển sang IN_USE, gán người giữ)',
    brRef: 'BR-001, BR-002, BR-004, UC-01',
    sampleBody: {
      user_id: 'USER-001',
      location_id: 'LOC-ZONE-A1',
      note: 'Mượn máy khoan bê tông thi công sàn tầng 3',
      expected_return_at: new Date(Date.now() + 86400000).toISOString(),
    },
  },
  {
    method: 'POST',
    path: '/api/assets/DRILL-021/checkin',
    description: 'Check-in hoàn trả thiết bị về kho (chuyển về AVAILABLE, xóa người giữ)',
    brRef: 'BR-003, BR-005, UC-02',
    sampleBody: {
      location_id: 'LOC-WAREHOUSE',
      returned_by_user_id: 'USER-001',
      condition_status: 'AVAILABLE',
      note: 'Hoàn trả thiết bị về kho trung tâm sau thi công',
    },
  },
  {
    method: 'POST',
    path: '/api/assets/DRILL-021/move',
    description: 'Cập nhật vị trí di chuyển mới (Event-based Last Known Location)',
    brRef: 'BR-006, SRS Mục 14, 18',
    sampleBody: {
      location_id: 'LOC-ZONE-B1',
      user_id: 'USER-001',
      note: 'Di chuyển sang Khu B xưởng kết cấu',
    },
  },
  {
    method: 'GET',
    path: '/api/locations',
    description: 'Danh sách cấu trúc vị trí phân cấp Site > Zone > Floor > Room',
    brRef: 'SRS Mục 7',
  },
  {
    method: 'GET',
    path: '/api/audit-logs',
    description: 'Nhật ký kiểm toán Who, What, When, Where không thể xóa',
    brRef: 'SRS Mục 16, 23',
  },
  {
    method: 'POST',
    path: '/api/reset-data',
    description: 'Khôi phục database về dữ liệu mẫu ban đầu (DRILL-021, METER-015...)',
    brRef: 'SRS Test Data',
  },
];

export const ApiDocsView: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[1]);
  const [requestBody, setRequestBody] = useState<string>(
    selectedEndpoint.sampleBody ? JSON.stringify(selectedEndpoint.sampleBody, null, 2) : ''
  );
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectEndpoint = (ep: Endpoint) => {
    setSelectedEndpoint(ep);
    setRequestBody(ep.sampleBody ? JSON.stringify(ep.sampleBody, null, 2) : '');
    setResponseData(null);
    setResponseStatus(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setResponseData(null);
    setResponseStatus(null);

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (selectedEndpoint.method !== 'GET' && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint.path, options);
      setResponseStatus(res.status);
      const data = await res.json().catch(() => ({ message: 'No JSON response' }));
      setResponseData(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData(JSON.stringify({ error: err.message || 'Lỗi gửi yêu cầu' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!responseData) return;
    navigator.clipboard.writeText(responseData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & SRS Reference */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Code2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>REST API Console & Business Requirements Specification</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Đặc tả kỹ thuật API và bảng đối chiếu quy tắc nghiệp vụ theo tài liệu SRS v1.0
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active API Server • Port 3000
            </span>
          </div>
        </div>
      </div>

      {/* Business Rules Summary Table (BR-001 to BR-007) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Bảng Quy tắc Nghiệp vụ Cốt lõi (SRS Section 4: BR-001 đến BR-007)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-blue-700 dark:text-blue-300">BR-001 & BR-002</span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 px-1.5 py-0.2 rounded font-bold">
                Check-out
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">1 tài sản tại 1 thời điểm chỉ thuộc về 1 người giữ duy nhất.</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Mỗi giao dịch check-out bắt buộc ghi nhận: User, Timestamp, Location.</p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">BR-003 & BR-005</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.2 rounded font-bold">
                Check-in
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">Khi check-in, tài sản xóa người giữ và chuyển trạng thái về AVAILABLE.</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Người trả không nhất thiết phải là người mượn ban đầu (cho phép thủ kho nhận trả thay).</p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-rose-700 dark:text-rose-300">BR-004</span>
              <span className="text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 px-1.5 py-0.2 rounded font-bold">
                Conflict Lock
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">Không thể check-out nếu tài sản đang IN_USE, MAINTENANCE, LOST.</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Báo lỗi `400: Asset is currently in use by [User]`.</p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300">BR-006</span>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 px-1.5 py-0.2 rounded font-bold">
                Move Event
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">Di chuyển (Move) không thay đổi người giữ hay trạng thái mượn.</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Chỉ cập nhật Last Known Location mới và sinh ra bản ghi Transaction MOVE.</p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-purple-700 dark:text-purple-300">BR-007</span>
              <span className="text-[10px] bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 px-1.5 py-0.2 rounded font-bold">
                Immutable Log
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">Lịch sử giao dịch là bất biến (Append-only).</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Không hỗ trợ API DELETE đối với Transaction & Audit Log nhằm chống gian lận.</p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">QR-001 & QR-004</span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1.5 py-0.2 rounded font-bold">
                QR Scanner
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">QR format: `SMART-ASSET:[Asset_ID]` hoặc tra cứu trực tiếp ID.</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Quét mã không hợp lệ trả về lỗi cảnh báo rõ ràng `Asset not found`.</p>
          </div>
        </div>
      </div>

      {/* Interactive API Tester Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint List (Left 4 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Danh sách REST Endpoints
            </h3>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{ENDPOINTS.length} APIs</span>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-[520px] pr-1">
            {ENDPOINTS.map((ep, idx) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        ep.method === 'GET'
                          ? 'bg-blue-600 dark:bg-blue-700 text-white'
                          : ep.method === 'POST'
                          ? 'bg-emerald-600 dark:bg-emerald-700 text-white'
                          : ep.method === 'PUT'
                          ? 'bg-amber-600 dark:bg-amber-700 text-white'
                          : 'bg-purple-600 dark:bg-purple-700 text-white'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span
                      className={`text-[10px] font-mono ${
                        isSelected ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {ep.brRef}
                    </span>
                  </div>
                  <div className="font-mono text-xs font-semibold truncate">{ep.path}</div>
                  <div
                    className={`text-[11px] truncate mt-0.5 ${
                      isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {ep.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Request & Response Live Runner (Right 7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded text-white ${
                  selectedEndpoint.method === 'GET'
                    ? 'bg-blue-600'
                    : selectedEndpoint.method === 'POST'
                    ? 'bg-emerald-600'
                    : 'bg-amber-600'
                }`}
              >
                {selectedEndpoint.method}
              </span>
              <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                {selectedEndpoint.path}
              </span>
            </div>
            <button
              onClick={handleExecute}
              disabled={loading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang gọi API...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Request</span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400">
            <strong>Mô tả:</strong> {selectedEndpoint.description} • <em>Tuân thủ {selectedEndpoint.brRef}</em>
          </div>

          {/* Request Body (if POST/PUT) */}
          {selectedEndpoint.method !== 'GET' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Request Payload (JSON Body)
                </span>
                <button
                  onClick={() =>
                    setRequestBody(
                      selectedEndpoint.sampleBody
                        ? JSON.stringify(selectedEndpoint.sampleBody, null, 2)
                        : ''
                    )
                  }
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Reset sample
                </button>
              </div>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={5}
                className="w-full font-mono text-xs p-3 bg-slate-900 dark:bg-slate-950 text-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-800"
              />
            </div>
          )}

          {/* Live Response Output */}
          <div className="flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Response Output
                </span>
                {responseStatus !== null && (
                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    Status: {responseStatus}
                  </span>
                )}
              </div>

              {responseData && (
                <button
                  onClick={handleCopyResponse}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã copy' : 'Copy JSON'}</span>
                </button>
              )}
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-lg p-3 font-mono text-xs overflow-x-auto flex-1 max-h-[300px] border border-slate-800">
              {loading ? (
                <div className="flex items-center space-x-2 text-slate-400 py-6 justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Đang thực thi request trên server backend...</span>
                </div>
              ) : responseData ? (
                <pre className="whitespace-pre-wrap">{responseData}</pre>
              ) : (
                <div className="text-slate-500 italic py-8 text-center">
                  Nhấn nút &quot;Gửi Request&quot; ở trên để kiểm tra trực tiếp endpoint này.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
