import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Save, X, Settings, Table, Menu as MenuIcon, Wifi, WifiOff } from 'lucide-react';
import { Table as DBTable, MenuItem } from '../types/database';
import { apiService } from '../services/api';

interface AdminPanelProps {}

export const AdminPanel: React.FC<AdminPanelProps> = () => {
  const [activeTab, setActiveTab] = useState<'tables' | 'menu'>('tables');
  const [tables, setTables] = useState<DBTable[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTable, setEditingTable] = useState<DBTable | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [showAddTable, setShowAddTable] = useState(false);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected' | 'testing'>('unknown');

  // Form states
  const [tableForm, setTableForm] = useState({ table_number: '' });
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'Starters',
    price: '',
    description: '',
    is_available: true
  });

  const categories = ['Starters', 'Mains', 'Drinks', 'Desserts'];

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      // Test basic connection by trying to fetch tables
      await apiService.getAllTables();
      setConnectionStatus('connected');
      alert('Database connection successful!');
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('disconnected');
      alert(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadTables(), loadMenuItems()]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      const tables = await apiService.getAllTables();
      setTables(tables);
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  const loadMenuItems = async () => {
    try {
      const menuItems = await apiService.getAllMenuItems();
      setMenuItems(menuItems);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  // Table operations
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableForm.table_number.trim()) {
      alert('Please enter a table number.');
      return;
    }

    // Check if table already exists
    const existingTable = tables.find(t => t.table_number === tableForm.table_number.toUpperCase());
    if (existingTable) {
      alert('A table with this number already exists.');
      return;
    }

    try {
      await apiService.addTable(tableForm.table_number.toUpperCase());
      
      setTableForm({ table_number: '' });
      setShowAddTable(false);
      await loadTables();
    } catch (error) {
      console.error('Failed to add table:', error);
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        alert('A table with this number already exists.');
      } else {
        alert('An unexpected error occurred while adding the table.');
      }
    }
  };

  const handleUpdateTable = async (table: DBTable) => {
    try {
      await apiService.updateTable(table.id, table.table_number);
      
      setEditingTable(null);
      await loadTables();
    } catch (error) {
      console.error('Failed to update table:', error);
      alert('Failed to update table.');
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table? This will also delete all associated orders.')) {
      return;
    }

    try {
      await apiService.deleteTable(tableId);
      await loadTables();
    } catch (error) {
      console.error('Failed to delete table:', error);
      alert('Failed to delete table.');
    }
  };

  // Menu operations
  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.addMenuItem({
        name: menuForm.name,
        category: menuForm.category,
        price: parseFloat(menuForm.price),
        description: menuForm.description || null,
        is_available: menuForm.is_available
      });
      
      setMenuForm({
        name: '',
        category: 'Starters',
        price: '',
        description: '',
        is_available: true
      });
      setShowAddMenuItem(false);
      await loadMenuItems();
    } catch (error) {
      console.error('Failed to add menu item:', error);
      alert('Failed to add menu item.');
    }
  };

  const handleUpdateMenuItem = async (item: MenuItem) => {
    try {
      await apiService.updateMenuItem(item.id, {
        name: item.name,
        category: item.category,
        price: item.price,
        description: item.description,
        is_available: item.is_available
      });
      
      setEditingMenuItem(null);
      await loadMenuItems();
    } catch (error) {
      console.error('Failed to update menu item:', error);
      alert('Failed to update menu item.');
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await apiService.deleteMenuItem(itemId);
      await loadMenuItems();
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      alert('Failed to delete menu item.');
    }
  };

  const toggleMenuItemAvailability = async (item: MenuItem) => {
    try {
      await apiService.updateMenuItem(item.id, { is_available: !item.is_available });
      await loadMenuItems();
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-gray-600">Manage tables and menu items</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={testConnection}
                disabled={connectionStatus === 'testing'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  connectionStatus === 'connected'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : connectionStatus === 'disconnected'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {connectionStatus === 'testing' ? (
                  <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                ) : connectionStatus === 'connected' ? (
                  <Wifi className="w-4 h-4" />
                ) : connectionStatus === 'disconnected' ? (
                  <WifiOff className="w-4 h-4" />
                ) : (
                  <Wifi className="w-4 h-4" />
                )}
                {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>
              {connectionStatus !== 'unknown' && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  connectionStatus === 'connected'
                    ? 'bg-green-100 text-green-800'
                    : connectionStatus === 'disconnected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('tables')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'tables'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Table className="w-5 h-5" />
              Tables ({tables.length})
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'menu'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MenuIcon className="w-5 h-5" />
              Menu Items ({menuItems.length})
            </button>
          </div>
        </div>

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div className="space-y-6">
            {/* Add Table Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Restaurant Tables</h2>
              <button
                onClick={() => setShowAddTable(true)}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Table
              </button>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tables.map(table => (
                <div key={table.id} className="bg-white rounded-lg p-4 shadow-sm border">
                  {editingTable?.id === table.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingTable.table_number}
                        onChange={(e) => setEditingTable({
                          ...editingTable,
                          table_number: e.target.value.toUpperCase()
                        })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateTable(editingTable)}
                          className="flex-1 bg-green-500 text-white py-1 rounded text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingTable(null)}
                          className="flex-1 bg-gray-500 text-white py-1 rounded text-sm hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">Table {table.table_number}</h3>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingTable(table)}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>Status: {table.locked ? 
                          <span className="text-red-600 font-medium">Locked</span> : 
                          <span className="text-green-600 font-medium">Available</span>
                        }</p>
                        {table.unique_code && (
                          <p>Code: <span className="font-mono">{table.unique_code}</span></p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Add Menu Item Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Menu Items</h2>
              <button
                onClick={() => setShowAddMenuItem(true)}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Menu Item
              </button>
            </div>

            {/* Menu Items by Category */}
            {categories.map(category => {
              const categoryItems = menuItems.filter(item => item.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="bg-white rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category} ({categoryItems.length})
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid gap-4">
                      {categoryItems.map(item => (
                        <div key={item.id} className="border rounded-lg p-4">
                          {editingMenuItem?.id === item.id ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editingMenuItem.name}
                                  onChange={(e) => setEditingMenuItem({
                                    ...editingMenuItem,
                                    name: e.target.value
                                  })}
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="Item name"
                                />
                                <select
                                  value={editingMenuItem.category}
                                  onChange={(e) => setEditingMenuItem({
                                    ...editingMenuItem,
                                    category: e.target.value
                                  })}
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                  {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingMenuItem.price}
                                  onChange={(e) => setEditingMenuItem({
                                    ...editingMenuItem,
                                    price: parseFloat(e.target.value) || 0
                                  })}
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="Price"
                                />
                              </div>
                              <div className="space-y-3">
                                <textarea
                                  value={editingMenuItem.description || ''}
                                  onChange={(e) => setEditingMenuItem({
                                    ...editingMenuItem,
                                    description: e.target.value
                                  })}
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="Description"
                                  rows={3}
                                />
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={editingMenuItem.is_available}
                                    onChange={(e) => setEditingMenuItem({
                                      ...editingMenuItem,
                                      is_available: e.target.checked
                                    })}
                                    className="rounded"
                                  />
                                  <span className="text-sm">Available</span>
                                </label>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateMenuItem(editingMenuItem)}
                                    className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Save className="w-4 h-4" />
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingMenuItem(null)}
                                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <X className="w-4 h-4" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    item.is_available 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {item.is_available ? 'Available' : 'Unavailable'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                <p className="text-lg font-semibold text-purple-600">
                                  ${item.price.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex gap-1 ml-4">
                                <button
                                  onClick={() => toggleMenuItemAvailability(item)}
                                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                    item.is_available
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  {item.is_available ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                  onClick={() => setEditingMenuItem(item)}
                                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMenuItem(item.id)}
                                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Table Modal */}
      {showAddTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Table</h3>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Number
                </label>
                <input
                  type="text"
                  value={tableForm.table_number}
                  onChange={(e) => setTableForm({ table_number: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., T11"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTable(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-500 text-white py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
                >
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Menu Item Modal */}
      {showAddMenuItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Add New Menu Item</h3>
            <form onSubmit={handleAddMenuItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Grilled Chicken"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={menuForm.price}
                  onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Describe the item..."
                  rows={3}
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={menuForm.is_available}
                    onChange={(e) => setMenuForm({ ...menuForm, is_available: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Available for ordering</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMenuItem(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-500 text-white py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};