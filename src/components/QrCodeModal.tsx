import React, { useEffect, useState } from 'react';
import { X, Printer, Download, QrCode, Tag, Check } from 'lucide-react';
import { Asset, AssetCategory } from '../types';
import { generateQrDataUrl } from '../utils/qr';
import { getCategoryName } from '../utils/formatters';

interface QrCodeModalProps {
  asset: Asset | null;
  onClose: () => void;
  categories: AssetCategory[];
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ asset, onClose, categories }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!asset) return;
    generateQrDataUrl(asset.qr_code).then((url) => setQrUrl(url));
  }, [asset]);

  if (!asset) return null;

  const catName = getCategoryName(categories, asset.category_id);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(asset.qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-sm w-full max-h-[92dvh] sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <QrCode className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold">QR Asset Identifier (Mục 8)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-5 sm:p-6 text-center space-y-4 overflow-y-auto flex-1">
          <div
            id="printable-qr-card"
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 bg-slate-50/70 dark:bg-slate-800/70 text-center space-y-3"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-1">
              SMART ASSET TAG • MVP
            </div>

            {/* QR Image */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs inline-block">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`QR code for ${asset.asset_id}`}
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                  Đang tạo mã QR...
                </div>
              )}
            </div>

            {/* Label details */}
            <div className="space-y-0.5">
              <div className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                {asset.asset_id}
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={asset.asset_name}>
                {asset.asset_name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{catName}</div>
              {asset.serial_number && (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">SN: {asset.serial_number}</div>
              )}
            </div>

            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono break-all pt-1 border-t border-slate-200 dark:border-slate-700">
              {asset.qr_code}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-2 pt-2">
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 min-h-[36px]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Tag className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Copy mã'}</span>
            </button>

            {qrUrl && (
              <a
                href={qrUrl}
                download={`${asset.asset_id}-QR.png`}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 min-h-[36px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải ảnh PNG</span>
              </a>
            )}

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center space-x-1 min-h-[36px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In nhãn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
