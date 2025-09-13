import React, { useState } from 'react';
import { Hash, Users } from 'lucide-react';

interface CodeEntryProps {
  onSubmit: (code: string) => void;
  onBack: () => void;
  loading?: boolean;
}

export const CodeEntry: React.FC<CodeEntryProps> = ({ onSubmit, onBack, loading }) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 6) {
      onSubmit(code.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Join Order
          </h1>
          <p className="text-gray-600">
            Enter the 6-digit code shared by your tablemate
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 mr-2" />
              Order Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors tracking-widest"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Joining...' : 'Join Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};