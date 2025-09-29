import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X } from 'lucide-react';
import { apiService } from '../services/api';
import { Table } from '../types/database';

export const TableManagement: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [showAddTable, setShowAddTable] = useState(false);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const tablesData = await apiService.getAllTables();
      setTables(tablesData);
    } catch (error) {
      console.error('Failed to load tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    if (!newTableNumber.trim()) return;
    
    try {
      await apiService.addTable(newTableNumber.trim());
      setNewTableNumber('');
      setShowAddTable(false);
      loadTables();
    } catch (error) {
      console.error('Failed to add table:', error);
      alert('Failed to add table. Please try again.');
    }
  };

  const handleUpdateTable = async (tableId: string, tableNumber: string) => {
    try {
      await apiService.updateTable(tableId, tableNumber);
      setEditingTable(null);
      loadTables();
    } catch (error) {
      console.error('Failed to update table:', error);
      alert('Failed to update table. Please try again.');
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    
    try {
      await apiService.deleteTable(tableId);
      loadTables();
    } catch (error) {
      console.error('Failed to delete table:', error);
      alert('Failed to delete table. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 pt-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Tables Management</h2>
            <button
              onClick={() => setShowAddTable(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Table
            </button>
          </div>

          {/* Add Table Form */}
          {showAddTable && (
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Add New Table</h3>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table Number
                  </label>
                  <input
                    type="text"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    placeholder="e.g., T11"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddTable}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTable(false);
                      setNewTableNumber('');
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className={`p-4 rounded-lg border-2 ${
                  table.locked
                    ? 'border-red-200 bg-red-50'
                    : 'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  {editingTable === table.id ? (
                    <input
                      type="text"
                      defaultValue={table.table_number}
                      onBlur={(e) => handleUpdateTable(table.id, e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateTable(table.id, e.currentTarget.value);
                        }
                      }}
                      className="font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                      autoFocus
                    />
                  ) : (
                    <h4 className="font-medium text-gray-900">
                      Table {table.table_number}
                    </h4>
                  )}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingTable(editingTable === table.id ? null : table.id)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      table.locked
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {table.locked ? 'Occupied' : 'Available'}
                  </span>
                  {table.unique_code && (
                    <span className="text-xs text-gray-500 font-mono">
                      {table.unique_code}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};