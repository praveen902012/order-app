import React, { useState, useEffect } from 'react';
import { Download, QrCode } from 'lucide-react';
import { generateQRCode } from '../lib/qr-utils';
import { apiService } from '../services/api';
import { Table } from '../types/database';

export const QRGenerator: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const tables = await apiService.getAllTables();
      setTables(tables);
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  const generateQR = async () => {
    if (!selectedTable) return;
    
    setLoading(true);
    try {
      const qrCodeDataURL = await generateQRCode(selectedTable);
      setQrCode(qrCodeDataURL);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `table-${selectedTable}-qr.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <QrCode className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">
              QR Code Generator
            </h1>
            <p className="text-gray-600">
              Generate QR codes for restaurant tables
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Table
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Choose a table...</option>
                {tables.map(table => (
                  <option key={table.id} value={table.table_number}>
                    Table {table.table_number}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={generateQR}
              disabled={!selectedTable || loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>

            {qrCode && (
              <div className="text-center">
                <div className="bg-gray-50 p-6 rounded-lg mb-4">
                  <img
                    src={qrCode}
                    alt={`QR Code for Table ${selectedTable}`}
                    className="mx-auto"
                  />
                </div>
                <button
                  onClick={downloadQR}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Download className="w-4 h-4" />
                  Download QR Code
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};