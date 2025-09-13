import React, { useRef, useEffect, useState } from 'react';
import { Camera, X } from 'lucide-react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onResult: (result: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onResult, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    if (!videoRef.current) return;

    const qrScanner = new QrScanner(
      videoRef.current,
      (result) => {
        onResult(result.data);
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    qrScanner.start().catch((error) => {
      console.error('Failed to start camera:', error);
      setHasCamera(false);
    });

    setScanner(qrScanner);

    return () => {
      qrScanner.destroy();
    };
  }, [onResult]);

  if (!hasCamera) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 mx-4 max-w-sm w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Camera Access</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            Camera access is required to scan QR codes. Please enable camera permissions and try again.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
      <div className="relative w-full max-w-md mx-4">
        <video
          ref={videoRef}
          className="w-full rounded-lg"
          playsInline
          muted
        />
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="bg-white bg-opacity-90 text-gray-800 p-2 rounded-full hover:bg-opacity-100 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="text-white text-center mt-6 px-4">
        <Camera className="w-8 h-8 mx-auto mb-2" />
        <p className="text-lg font-medium">Scan Table QR Code</p>
        <p className="text-gray-300 mt-1">
          Position the QR code within the camera frame
        </p>
      </div>
    </div>
  );
};