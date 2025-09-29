import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X } from 'lucide-react';
import { apiService } from '../services/api';
import { Table, MenuItem } from '../types/database';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tables' | 'menu'>('tables');
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [editingMenu, setEditingMenu] = useState<string | null>(null);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [showAddTable, setShowAddTable] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    category: 'Starters',
    price: 0,
    description: '',
    image_url: '',
    is_available: true
  });

  useEffect(() => {
    loadTables();
    loadMenuItems();
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

  const loadMenuItems = async () => {
    try {
      const menuData = await apiService.getAllMenuItems();
      setMenuItems(menuData);
    } catch (error) {
      console.error('Failed to load menu items:', error);
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

  const handleAddMenuItem = async () => {
    if (!newMenuItem.name.trim() || newMenuItem.price <= 0) return;
    
    try {
      await apiService.addMenuItem(newMenuItem);
      setNewMenuItem({
        name: '',
        category: 'Starters',
        price: 0,
        description: '',
        image_url: '',
        is_available: true
      });
      setShowAddMenu(false);
      loadMenuItems();
    } catch (error) {
      console.error('Failed to add menu item:', error);
      alert('Failed to add menu item. Please try again.');
    }
  };

  const handleUpdateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    try {
      await apiService.updateMenuItem(itemId, updates);
      setEditingMenu(null);
      loadMenuItems();
    } catch (error) {
      console.error('Failed to update menu item:', error);
      alert('Failed to update menu item. Please try again.');
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    try {
      await apiService.deleteMenuItem(itemId);
      loadMenuItems();
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      alert('Failed to delete menu item. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 pt-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('tables')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tables'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tables Management
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'menu'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Menu Management
              </button>
            </nav>
          </div>
        </div>

        {/* Tables Tab */}
        {activeTab === 'tables' && (
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
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
              <button
                onClick={() => setShowAddMenu(true)}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Menu Item
              </button>
            </div>

            {/* Add Menu Item Form */}
            {showAddMenu && (
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Add New Menu Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newMenuItem.name}
                      onChange={(e) => setNewMenuItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Item name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newMenuItem.category}
                      onChange={(e) => setNewMenuItem(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="Starters">Starters</option>
                      <option value="Mains">Mains</option>
                      <option value="Drinks">Drinks</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newMenuItem.price}
                      onChange={(e) => setNewMenuItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={newMenuItem.image_url}
                      onChange={(e) => setNewMenuItem(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newMenuItem.description}
                      onChange={(e) => setNewMenuItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Item description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newMenuItem.is_available}
                        onChange={(e) => setNewMenuItem(prev => ({ ...prev, is_available: e.target.checked }))}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Available</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddMenuItem}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      setNewMenuItem({
                        name: '',
                        category: 'Starters',
                        price: 0,
                        description: '',
                        image_url: '',
                        is_available: true
                      });
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Menu Items by Category */}
            {['Starters', 'Mains', 'Drinks', 'Desserts'].map((category) => (
              <div key={category} className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingMenu(editingMenu === item.id ? null : item.id)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMenuItem(item.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-lg font-semibold text-green-600">
                            ${item.price.toFixed(2)}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              item.is_available
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};