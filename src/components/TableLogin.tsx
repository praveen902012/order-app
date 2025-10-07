import React, { useState } from 'react';
import { QrCode, Hash, Phone, ArrowLeft } from 'lucide-react';
import { QRScanner } from './QRScanner';

interface TableLoginProps {
  onLogin: (tableNumber: string, mobileNumber: string) => void;
  loading?: boolean;
}

export const TableLogin: React.FC<TableLoginProps> = ({ onLogin, loading }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [step, setStep] = useState<'table' | 'phone'>('table');
  const [fromQR, setFromQR] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 10;
  };

  const handlePhoneChange = (value: string) => {
    // Only allow digits and limit to 10 characters
    const cleanValue = value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(cleanValue);
    
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'table' && tableNumber.trim()) {
      setStep('phone');
    } else if (step === 'phone' && mobileNumber.trim()) {
      if (!validatePhoneNumber(mobileNumber)) {
        setPhoneError('Mobile number must be exactly 10 digits');
        return;
      }
      onLogin(tableNumber.trim().toUpperCase(), mobileNumber.trim());
    }
  };

  const handleQRResult = (result: string) => {
    try {
      const url = new URL(result);
      const table = url.searchParams.get('table');
      if (table) {
        setTableNumber(table);
        setFromQR(true);
        setShowScanner(false);
        setStep('phone');
      }
    } catch (error) {
      console.error('Invalid QR code:', error);
    }
  };

  const handleBackToTable = () => {
    setStep('table');
    setMobileNumber('');
    setPhoneError('');
    if (fromQR) {
      setTableNumber('');
      setFromQR(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {step === 'table' ? (
              <QrCode className="w-10 h-10 text-orange-600" />
            ) : (
              <Phone className="w-10 h-10 text-orange-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {step === 'table' ? 'Welcome to OrderEase' : 'Enter Your Details'}
          </h1>
          <p className="text-gray-600">
            {step === 'table' 
              ? 'Scan your table\'s QR code or enter table number'
              : `Please enter your mobile number for Table ${tableNumber}`
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 'table' && (
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
                  title="Scan QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 'phone' && (
            <>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    Table: {tableNumber}
                  </span>
                  {fromQR && (
                    <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                      From QR Code
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 mr-2" />
                  Mobile Number (10 digits)
                </label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                    phoneError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                  autoFocus
                />
                {phoneError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span className="w-4 h-4 text-red-500">⚠️</span>
                    {phoneError}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex gap-3">
            {step === 'phone' && (
              <button
                type="button"
                onClick={handleBackToTable}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading || (step === 'table' && !tableNumber.trim()) || (step === 'phone' && (!mobileNumber.trim() || mobileNumber.length !== 10))}
              className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Connecting...' : step === 'table' ? 'Continue' : 'Start Ordering'}
            </button>
          </div>
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