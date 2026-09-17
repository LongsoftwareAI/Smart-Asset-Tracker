import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  QrCode,
  Camera,
  Search,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ScanLine,
  Zap,
  ZapOff,
  SwitchCamera,
  Upload,
  ArrowRightLeft,
  LogIn,
  LogOut,
  MapPin,
  User as UserIcon,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Asset, AssetStatus, Location, User } from '../types';
import { api } from '../services/api';
import { getStatusConfig } from '../utils/formatters';

interface QrScannerModalProps {
  onClose: () => void;
  onAssetFound: (asset: Asset) => void;
  allAssets: Asset[];
  locations?: Location[];
  users?: User[];
  onCheckout?: (asset: Asset) => void;
  onCheckin?: (asset: Asset) => void;
  onMove?: (asset: Asset) => void;
  onViewDetail?: (asset: Asset) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  onClose,
  onAssetFound,
  allAssets,
  locations = [],
  users = [],
  onCheckout,
  onCheckin,
  onMove,
  onViewDetail,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(null);
  const [scanSuccessAnim, setScanSuccessAnim] = useState(false);
  const [showManualSection, setShowManualSection] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(true);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  }, []);

  // Process code extracted from QR
  const processScanCode = useCallback(
    async (rawCode: string) => {
      const cleanCode = rawCode.trim();
      if (!cleanCode) return;

      setSearching(true);
      setErrorMsg(null);

      // Extract asset ID if QR format is "SMART-ASSET:DRILL-021" or "https://.../a/DRILL-021"
      let targetId = cleanCode;
      if (cleanCode.startsWith('SMART-ASSET:')) {
        targetId = cleanCode.replace('SMART-ASSET:', '');
      } else if (cleanCode.includes('/a/')) {
        targetId = cleanCode.split('/a/')[1];
      }

      try {
        const asset = await api.getAsset(targetId);

        // Haptic feedback for mobile phone
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([60, 40, 60]);
        }

        // Trigger visual success blink
        setScanSuccessAnim(true);
        setTimeout(() => setScanSuccessAnim(false), 800);

        setScannedAsset(asset);
        onAssetFound(asset);
      } catch {
        // QR-004 Requirement: If QR not found in system, display "Asset not found"
        setErrorMsg(`Asset not found (${targetId})`);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(200);
        }
      } finally {
        setSearching(false);
      }
    },
    [onAssetFound]
  );

  // Continuous barcode detection loop using native browser BarcodeDetector API
  const startDetectionLoop = useCallback(() => {
    isScanningRef.current = true;

    if (!('BarcodeDetector' in window)) {
      // BarcodeDetector not supported in this browser engine; manual & test buttons remain ready
      return;
    }

    try {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'data_matrix', 'ean_13'],
      });

      let lastDetectTime = 0;

      const detectFrame = async (timestamp: number) => {
        if (!isScanningRef.current) return;

        // Throttle to every 250ms to preserve mobile battery & GPU
        if (
          timestamp - lastDetectTime > 250 &&
          videoRef.current &&
          videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
          !scannedAsset
        ) {
          lastDetectTime = timestamp;
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              const detectedValue = barcodes[0].rawValue;
              isScanningRef.current = false;
              await processScanCode(detectedValue);
              return;
            }
          } catch {
            // detection frame skipped
          }
        }

        animationFrameRef.current = requestAnimationFrame(detectFrame);
      };

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    } catch (err) {
      console.warn('Native BarcodeDetector initialization warning:', err);
    }
  }, [processScanCode, scannedAsset]);

  // Start camera with specified facing mode
  const startCamera = useCallback(
    async (mode: 'environment' | 'user' = facingMode) => {
      stopCamera();
      setCameraError(null);
      setErrorMsg(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ WebRTC Camera trực tiếp.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;

        // Check torch capability
        const track = stream.getVideoTracks()[0];
        if (track && track.getCapabilities) {
          const caps = (track.getCapabilities() as any) || {};
          setTorchSupported(!!caps.torch);
        } else {
          setTorchSupported(false);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraActive(true);
        startDetectionLoop();
      } catch (err: any) {
        console.warn('Camera start error:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Quyền truy cập camera bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt hoặc dùng tính năng tải ảnh/nhập mã.'
            : 'Không thể mở Camera thiết bị. Vui lòng sử dụng tính năng chụp ảnh hoặc nhập mã.'
        );
        setCameraActive(false);
      }
    },
    [facingMode, startDetectionLoop, stopCamera]
  );

  // Auto-start camera when modal opens
  useEffect(() => {
    startCamera('environment');
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Toggle Torch/Flashlight
  const handleToggleTorch = async () => {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (track) {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      }
    } catch (e) {
      console.warn('Cannot toggle torch:', e);
    }
  };

  // Flip Camera between back and front
  const handleFlipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Handle Photo upload / Native camera photo capture
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSearching(true);
    setErrorMsg(null);

    try {
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'data_matrix'],
        });
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const barcodes = await barcodeDetector.detect(img);
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          await processScanCode(barcodes[0].rawValue);
          return;
        }
      }

      // If native detector not available or didn't find, prompt user
      setErrorMsg('Không tìm thấy mã QR trong ảnh vừa chọn. Vui lòng thử chụp lại cận cảnh hơn.');
    } catch {
      setErrorMsg('Không thể giải mã ảnh. Vui lòng kiểm tra lại hình ảnh.');
    } finally {
      setSearching(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processScanCode(manualCode);
  };

  const handleResetForNextScan = () => {
    setScannedAsset(null);
    setErrorMsg(null);
    setManualCode('');
    isScanningRef.current = true;
    startDetectionLoop();
  };

  return (
    <div
      id="qr-scanner-fullscreen-modal"
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col md:items-center md:justify-center md:p-4 md:bg-slate-900/80 md:backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Mobile Card Container (Full screen on mobile, elevated modal on desktop) */}
      <div className="flex-1 w-full md:max-w-lg md:h-auto md:max-h-[92vh] bg-slate-900 md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border-0 md:border border-slate-800 relative">
        {/* Top Floating App Bar */}
        <div className="bg-slate-950/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-800/80 z-20 text-white shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center space-x-1.5">
                <span>Quét mã QR Di động</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  LIVE
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Đưa camera tới tem QR của thiết bị</p>
            </div>
          </div>

          {/* Top Quick Controls */}
          <div className="flex items-center space-x-1">
            {/* Torch Toggle if supported */}
            {cameraActive && torchSupported && (
              <button
                type="button"
                onClick={handleToggleTorch}
                title={torchOn ? 'Tắt đèn Flash' : 'Bật đèn Flash'}
                className={`p-2 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  torchOn ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
              </button>
            )}

            {/* Camera Switcher */}
            {cameraActive && (
              <button
                type="button"
                onClick={handleFlipCamera}
                title="Đổi camera trước / sau"
                className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            )}

            {/* Close Button */}
            <button
              id="btn-close-qr-scanner"
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              aria-label="Đóng máy quét"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Viewfinder Main Viewport */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[280px]">
          {/* Video Stream */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Camera Viewfinder Reticle & Guides */}
          {cameraActive && !scannedAsset && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              <div
                className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between p-3 ${
                  scanSuccessAnim
                    ? 'border-emerald-400 bg-emerald-500/10 scale-105'
                    : 'border-blue-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]'
                }`}
              >
                {/* 4 Corner Markers */}
                <div className="flex justify-between">
                  <span className="w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                  <span className="w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                </div>

                {/* Animated Scanning Laser Line */}
                <div className="w-full relative py-1">
                  <div className="h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent w-full shadow-[0_0_12px_#60a5fa] animate-pulse" />
                </div>

                <div className="flex justify-between">
                  <span className="w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                  <span className="w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
                </div>
              </div>

              <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-200 text-xs font-medium flex items-center space-x-2">
                <ScanLine className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span>Căn chỉnh mã QR vào giữa khung ngắm</span>
              </div>
            </div>
          )}

          {/* Fallback View if Camera is not active */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-4 bg-slate-950">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-blue-400 flex items-center justify-center border border-slate-800 shadow-inner">
                <Camera className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="text-sm font-semibold text-white">Camera chưa được kích hoạt</p>
                <p className="text-xs text-slate-400">
                  {cameraError || 'Nhấn nút bên dưới để mở camera hoặc chọn ảnh mã QR từ máy.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center space-x-2 min-h-[44px]"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Kích hoạt lại Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center space-x-2 min-h-[44px]"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Chụp / Tải ảnh QR</span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Input for Native Photo Capture & Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Error Notification Toast / Banner (QR-004) */}
          {errorMsg && (
            <div className="absolute top-4 left-4 right-4 z-30 p-3 bg-rose-950/95 border border-rose-500/80 rounded-2xl shadow-xl flex items-start space-x-2.5 text-rose-100 text-xs backdrop-blur-md animate-in slide-in-from-top-4 duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-bold block text-rose-200">Không tìm thấy tài sản:</strong>
                <span>{errorMsg}. Vui lòng kiểm tra lại mã tem QR.</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-rose-300 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Scanned Result Interactive Mobile Action Sheet Overlay */}
          {scannedAsset && (
            <div className="absolute inset-x-0 bottom-0 z-30 bg-slate-900 border-t-2 border-emerald-500 rounded-t-3xl shadow-2xl p-5 text-white animate-in slide-in-from-bottom-8 duration-200">
              {/* Sheet Drag Indicator */}
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />

              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-bold">
                      {scannedAsset.asset_id}
                    </span>
                    {(() => {
                      const cfg = getStatusConfig(scannedAsset.status);
                      return (
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span>{cfg.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <h3 className="text-base font-bold text-white line-clamp-1">
                    {scannedAsset.asset_name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleResetForNextScan}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                >
                  Quét tiếp
                </button>
              </div>

              {/* Quick Info Grid */}
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-300 mb-4">
                <div className="flex items-center space-x-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">
                    Vị trí:{' '}
                    <strong>
                      {locations.find((l) => l.location_id === scannedAsset.current_location_id)?.location_name ||
                        scannedAsset.current_location_id}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 truncate">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    Người giữ:{' '}
                    <strong>
                      {users.find((u) => u.user_id === scannedAsset.current_user_id)?.name ||
                        (scannedAsset.current_user_id ? scannedAsset.current_user_id : 'Trong kho')}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Mobile Quick Action Buttons (Minimum 48px height touch targets) */}
              <div className="grid grid-cols-2 gap-2.5">
                {scannedAsset.status === AssetStatus.AVAILABLE && onCheckout && (
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      onCheckout(scannedAsset);
                    }}
                    className="col-span-2 py-3 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center space-x-2 min-h-[48px] cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Check-out (Mượn thiết bị này)</span>
                  </button>
                )}

                {scannedAsset.status === AssetStatus.IN_USE && onCheckin && (
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      onCheckin(scannedAsset);
                    }}
                    className="col-span-2 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center space-x-2 min-h-[48px] cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Check-in (Hoàn trả thiết bị này)</span>
                  </button>
                )}

                {onMove && (
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      onMove(scannedAsset);
                    }}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center space-x-1.5 min-h-[44px] cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                    <span>Chuyển vị trí</span>
                  </button>
                )}

                {onViewDetail && (
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      onViewDetail(scannedAsset);
                    }}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center space-x-1.5 min-h-[44px] cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span>Xem chi tiết</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Drawer: Quick Test Barcodes & Manual Search */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3 shrink-0">
          {/* Quick Upload or Photo Button for mobile */}
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1.5 py-1 px-2 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Chụp ảnh / Tải ảnh QR từ máy</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManualSection(!showManualSection)}
              className="text-slate-400 hover:text-slate-200 font-medium py-1 px-2 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              {showManualSection ? 'Ẩn nhập tay' : 'Nhập mã tay / Test'}
            </button>
          </div>

          {/* Expandable Manual Search & Test Chips */}
          {showManualSection && (
            <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in duration-150">
              {/* Manual Input Form */}
              <form onSubmit={handleManualSubmit} className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="scanner-manual-input"
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Nhập ID: DRILL-021..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <button
                  id="btn-scanner-lookup"
                  type="submit"
                  disabled={searching || !manualCode.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 min-h-[40px]"
                >
                  {searching ? 'Tìm...' : 'Tra cứu'}
                </button>
              </form>

              {/* Quick Click-to-Scan Sample Chips */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Mã mẫu kiểm tra nhanh (1 chạm):</span>
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {allAssets.slice(0, 6).map((item) => (
                    <button
                      key={item.asset_id}
                      type="button"
                      onClick={() => processScanCode(item.qr_code)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-mono transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-blue-300">{item.asset_id}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({item.asset_name.slice(0, 10)})</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => processScanCode('DRILL-UNKNOWN-999')}
                    className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-lg text-[11px] font-mono transition-colors cursor-pointer"
                  >
                    Test lỗi QR-004
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
