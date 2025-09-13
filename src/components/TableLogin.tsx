import React, { useState } from 'react';
import { QrCode, Hash, Phone } from 'lucide-react';
import { QRScanner } from './QRScanner';

interface TableLoginProps {
  onLogin: (tableNumber: string, mobileNumber: string) => void;
  loading?: boolean;
}

export const TableLogin: React.FC<TableLoginProps> = ({ onLogin, loading }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tableNumber.trim() && mobileNumber.trim()) {
      onLogin(tableNumber.trim().toUpperCase(), mobileNumber.trim());
    }
  };

  const handleQRResult = (result: string) => {
    try {
      const url = new URL(result);
      const table = url.searchParams.get('table');
      if (table) {
        setTableNumber(table);
        setShowScanner(false);
      }
    } catch (error) {
      console.error('Invalid QR code:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to OrderEase
          </h1>
          <p className="text-gray-600">
            Scan your table's QR code or enter details manually
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 mr-2" />
              Table Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g., T01"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 mr-2" />
              Mobile Number
            </label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="Enter your mobile number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !tableNumber.trim() || !mobileNumber.trim()}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Connecting...' : 'Start Ordering'}
          </button>
        </form>

        {showScanner && (
          <QRScanner
            onResult={handleQRResult}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    </div>
  );
};