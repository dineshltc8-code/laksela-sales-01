import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, Zap, Volume2, VolumeX, CheckCircle, Smartphone } from 'lucide-react';
import { audioService } from '../utils/audio';
import { ScanTargetField } from '../types/stock';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedText: string, targetField: ScanTargetField) => void;
  targetField: ScanTargetField;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  continuousMode?: boolean;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  targetField,
  soundEnabled,
  vibrateEnabled,
  continuousMode = false,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = 'qr-reader-canvas-3d';

  const targetLabels: Record<ScanTargetField, string> = {
    serialNo: 'Serial Number',
    itemCode: 'Item Code',
    model: 'Model Number',
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setLastScanned(null);
      setCameraError(null);
      return;
    }

    const html5Qrcode = new Html5Qrcode(regionId, {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF,
      ],
    });
    scannerRef.current = html5Qrcode;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const cameraList = devices.map((d, idx) => ({
            id: d.id,
            label: d.label || `Camera ${idx + 1}`,
          }));
          setCameras(cameraList);
          const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
          const selectedId = backCam ? backCam.id : devices[devices.length - 1].id;
          setActiveCameraId(selectedId);
          startCamera(html5Qrcode, selectedId);
        } else {
          setCameraError('No camera found on this device. Enter serial manually.');
        }
      })
      .catch((err) => {
        console.error('Camera access error:', err);
        setCameraError('Camera permission denied or camera unavailable.');
      });

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startCamera = async (scanner: Html5Qrcode, cameraId: string) => {
    setCameraError(null);
    try {
      await scanner.start(
        cameraId,
        {
          fps: 15,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start camera scan', err);
      setCameraError('Failed to start camera. Try switching camera or refresh.');
      setIsScanning(false);
    }
  };

  const handleDecodedText = (text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;

    audioService.playBeep('success', soundEnabled);
    audioService.triggerVibrate(vibrateEnabled, 60);

    setLastScanned(cleaned);
    onScan(cleaned, targetField);

    if (!continuousMode) {
      stopScanner();
      onClose();
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .then(() => setIsScanning(false))
        .catch((e) => console.error('Error stopping scanner', e));
    } else {
      setIsScanning(false);
    }
  };

  const switchCamera = () => {
    if (cameras.length < 2 || !scannerRef.current) return;
    const currentIndex = cameras.findIndex((c) => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    stopScanner();
    setActiveCameraId(nextCamera.id);
    setTimeout(() => {
      if (scannerRef.current) {
        startCamera(scannerRef.current, nextCamera.id);
      }
    }, 300);
  };

  const toggleTorch = async () => {
    if (scannerRef.current && isScanning) {
      try {
        const nextState = !torchOn;
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: nextState } as unknown as MediaTrackConstraintSet],
        });
        setTorchOn(nextState);
      } catch {
        // Torch not supported
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-950 text-white border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm sm:text-base text-cyan-300">
              3D Digital Barcode Scanner
            </h3>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Container */}
        <div className="relative bg-black flex-1 flex flex-col items-center justify-center min-h-[280px]">
          <div id={regionId} className="w-full max-w-xs h-[260px] overflow-hidden rounded-lg"></div>

          {isScanning && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-40 border-2 border-dashed border-cyan-400/80 rounded-xl relative overflow-hidden flex items-center justify-center">
                <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-scanline absolute"></div>
                <div className="absolute top-2 left-2 text-[10px] text-cyan-300 font-mono uppercase bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  Target: {targetLabels[targetField]}
                </div>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/90 text-white p-6 flex flex-col items-center justify-center text-center">
              <Smartphone className="w-12 h-12 text-amber-400 mb-3" />
              <p className="text-sm font-medium text-amber-200 mb-4">{cameraError}</p>
              <button
                onClick={() => {
                  if (scannerRef.current && activeCameraId) {
                    startCamera(scannerRef.current, activeCameraId);
                  }
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-xs font-semibold flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Target Info & Controls */}
        <div className="p-3 bg-slate-950 border-t border-cyan-500/20 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            {cameras.length > 1 && (
              <button
                onClick={switchCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-medium text-slate-200 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Switch
              </button>
            )}
            <button
              onClick={toggleTorch}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium ${
                torchOn ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Torch
            </button>
          </div>

          <span className="text-xs text-cyan-300 font-mono font-medium">
            Scanning into: <strong className="text-white">{targetLabels[targetField]}</strong>
          </span>
        </div>

        {/* Last Scanned Banner */}
        {lastScanned && (
          <div className="p-3 bg-emerald-950/60 border-t border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-emerald-200">
                Scanned: <code className="font-mono bg-emerald-900/80 px-1.5 py-0.5 rounded text-white">{lastScanned}</code>
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
          <p className="text-[11px] text-slate-400">
            Supports Code128, QR, EAN13, Code39 & UPC
          </p>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
