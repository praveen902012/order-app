import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X, Users, MapPin } from 'lucide-react';
import { apiService } from '../services/api';
import { Table } from '../types/database';

export const TableManagement: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{
    table_number: string;
    floor: string;
    seating_capacity: number;
  }>({ table_number: '', floor: '', seating_capacity: 4 });
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTable, setNewTable] = useState({
    table_number: '',
    floor: 'Ground Floor',
    seating_capacity: 4
  });

  const floors = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Basement'];

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
    if (!newTable.table_number.trim()) return;
    
    try {
      await apiService.addTable({
        table_number: newTable.table_number.trim(),
        floor: newTable.floor,
        seating_capacity: newTable.seating_capacity
      });
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      setNewTable({ table_number: '', floor: 'Ground Floor', seating_capacity: 4 });
      setShowAddTable(false);
      loadTables();
    } catch (error) {
      console.error('Failed to add table:', error);
      alert(`Failed to add table: ${error.message}`);
    }
  };

  const handleStartEdit = (table: Table) => {
    setEditingTable(table.id);
    setEditingData({
      table_number: table.table_number,
      floor: table.floor || 'Ground Floor',
      seating_capacity: table.seating_capacity || 4
    });
  };

  const handleUpdateTable = async (tableId: string) => {
    try {
      await apiService.updateTable(tableId, {
        table_number: editingData.table_number,
        floor: editingData.floor,
        seating_capacity: editingData.seating_capacity
      });
      setEditingTable(null);
      loadTables();
    } catch (error) {
      console.error('Failed to update table:', error);
      alert('Failed to update table. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingTable(null);
    setEditingData({ table_number: '', floor: '', seating_capacity: 4 });
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

  const groupTablesByFloor = () => {
    const grouped = tables.reduce((acc, table) => {
      const floor = table.floor || 'Ground Floor';
      if (!acc[floor]) {
        acc[floor] = [];
      }
      acc[floor].push(table);
      return acc;
    }, {} as Record<string, Table[]>);

    // Sort floors in logical order
    const floorOrder = ['Basement', 'Ground Floor', 'First Floor', 'Second Floor', 'Third Floor'];
    const sortedFloors = Object.keys(grouped).sort((a, b) => {
      const aIndex = floorOrder.indexOf(a);
      const bIndex = floorOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return sortedFloors.map(floor => ({
      floor,
      tables: grouped[floor].sort((a, b) => a.table_number.localeCompare(b.table_number))
    }));
  };

  const getFloorStats = (tables: Table[]) => {
    const total = tables.length;
    const occupied = tables.filter(t => t.locked).length;
    const available = total - occupied;
    const totalSeating = tables.reduce((sum, t) => sum + (t.seating_capacity || 4), 0);
    
    return { total, occupied, available, totalSeating };
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
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tables Management</h2>
              <p className="text-gray-600">Manage restaurant tables by floor</p>
            </div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table Number
                  </label>
                  <input
                    type="text"
                    value={newTable.table_number}
                    onChange={(e) => setNewTable(prev => ({ ...prev, table_number: e.target.value }))}
                    placeholder="e.g., T11"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floor
                  </label>
                  <select
                    value={newTable.floor}
                    onChange={(e) => setNewTable(prev => ({ ...prev, floor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {floors.map(floor => (
                      <option key={floor} value={floor}>{floor}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newTable.seating_capacity}
                    onChange={(e) => setNewTable(prev => ({ ...prev, seating_capacity: parseInt(e.target.value) || 4 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
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
                    setNewTable({ table_number: '', floor: 'Ground Floor', seating_capacity: 4 });
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Tables by Floor */}
          {groupTablesByFloor().map(({ floor, tables: floorTables }) => {
            const stats = getFloorStats(floorTables);
            return (
              <div key={floor} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{floor}</h3>
                        <p className="text-sm text-gray-600">
                          {stats.total} tables • {stats.totalSeating} total seats
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{stats.available}</div>
                        <div className="text-gray-500">Available</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{stats.occupied}</div>
                        <div className="text-gray-500">Occupied</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {floorTables.map((table) => (
                      <div
                        key={table.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          table.locked
                            ? 'border-red-200 bg-red-50'
                            : 'border-green-200 bg-green-50'
                        }`}
                      >
                        {editingTable === table.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editingData.table_number}
                              onChange={(e) => setEditingData(prev => ({ ...prev, table_number: e.target.value }))}
                              className="w-full font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                              placeholder="Table number"
                            />
                            <select
                              value={editingData.floor}
                              onChange={(e) => setEditingData(prev => ({ ...prev, floor: e.target.value }))}
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                              {floors.map(floor => (
                                <option key={floor} value={floor}>{floor}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={editingData.seating_capacity}
                              onChange={(e) => setEditingData(prev => ({ ...prev, seating_capacity: parseInt(e.target.value) || 4 }))}
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                              placeholder="Seating capacity"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleUpdateTable(table.id)}
                                className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors"
                              >
                                <Save className="w-3 h-3 mx-auto" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="flex-1 bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 transition-colors"
                              >
                                <X className="w-3 h-3 mx-auto" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">
                                Table {table.table_number}
                              </h4>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleStartEdit(table)}
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
                            
                            <div className="space-y-2">
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
                              
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>{table.seating_capacity || 4} seats</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {tables.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tables Found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first table</p>
              <button
                onClick={() => setShowAddTable(true)}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Add First Table
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};