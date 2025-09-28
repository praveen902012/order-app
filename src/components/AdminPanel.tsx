import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Save, X, Settings, Table, Menu as MenuIcon, Wifi, WifiOff, Clock, CreditCard, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { Table as DBTable, MenuItem } from '../types/database';
import { apiService } from '../services/api';

interface AdminPanelProps {}

export const AdminPanel: React.FC<AdminPanelProps> = () => {
  const [activeTab, setActiveTab] = useState<'tables' | 'menu' | 'unavailable' | 'orders'>('tables');
  const [tables, setTables] = useState<DBTable[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [salesAnalytics, setSalesAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editingTable, setEditingTable] = useState<DBTable | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [showAddTable, setShowAddTable] = useState(false);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected' | 'testing'>('unknown');

  // Order history filters
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [filterType, setFilterType] = useState<'date' | 'month' | 'year'>('month');

  // Get unavailable items
  const unavailableItems = menuItems.filter(item => !item.is_available);

  // Form states
  const [tableForm, setTableForm] = useState({ table_number: '' });
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'Starters',
    price: '',
    description: '',
    image_url: '',
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
    if (activeTab === 'orders') {
      loadOrderHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrderHistory();
    }
  }, [dateFilter, filterType]);

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

  const loadOrderHistory = async () => {
    setOrdersLoading(true);
    try {
      let startDate, endDate;
      
      if (filterType === 'date') {
        startDate = dateFilter.startDate;
        endDate = dateFilter.endDate;
      } else if (filterType === 'month') {
        startDate = new Date(dateFilter.year, dateFilter.month - 1, 1).toISOString().split('T')[0];
        endDate = new Date(dateFilter.year, dateFilter.month, 0).toISOString().split('T')[0];
      } else if (filterType === 'year') {
        startDate = new Date(dateFilter.year, 0, 1).toISOString().split('T')[0];
        endDate = new Date(dateFilter.year, 11, 31).toISOString().split('T')[0];
      }
      
      const response = await fetch(`http://localhost:3001/api/orders/history?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      
      setOrderHistory(data.orders || []);
      setSalesAnalytics(data.analytics || {});
    } catch (error) {
      console.error('Failed to load order history:', error);
      setOrderHistory([]);
      setSalesAnalytics({});
    } finally {
      setOrdersLoading(false);
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
        image_url: menuForm.image_url || null,
        is_available: menuForm.is_available
      });
      
      setMenuForm({
        name: '',
        category: 'Starters',
        price: '',
        description: '',
        image_url: '',
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
        image_url: item.image_url,
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
      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6 pt-8">
        {/* Header */}
        <div className="mb-6">
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
            <button
              onClick={() => setActiveTab('unavailable')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'unavailable'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <WifiOff className="w-5 h-5" />
              Unavailable Items ({unavailableItems.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="w-5 h-5" />
              Order History
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
                                <input
                                  type="url"
                                 value={editingMenuItem?.image_url || ''}
                                  onChange={(e) => setEditingMenuItem({
                                    ...editingMenuItem,
                                   image_url: e.target.value.trim() || null
                                  })}
                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="Image URL (optional)"
                                />
                                {editingMenuItem?.image_url && (
                                  <div className="mt-2">
                                    <img
                                     src={editingMenuItem?.image_url}
                                      alt="Preview"
                                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                       target.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
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
                                    description: e.target.value || null
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
                             <div className="flex-shrink-0 mr-4">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                   className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                     target.style.display = 'none';
                                      // Show placeholder by replacing with a div
                                      const placeholder = document.createElement('div');
                                      placeholder.className = 'w-20 h-20 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center';
                                      placeholder.innerHTML = '<span class="text-gray-400 text-xs text-center">Image Error</span>';
                                      target.parentElement?.replaceChild(placeholder, target);
                                    }}
                                  />
                                ) : (
                                 <div className="w-20 h-20 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                                    <span className="text-gray-400 text-xs text-center">No Image</span>
                                  </div>
                                )}
                              </div>
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

        {/* Unavailable Items Tab */}
        {activeTab === 'unavailable' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Unavailable Menu Items</h2>
              <div className="text-sm text-gray-500">
                {unavailableItems.length} items currently unavailable
              </div>
            </div>

            {unavailableItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wifi className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">All Items Available</h3>
                <p className="text-gray-500">
                  Great! All menu items are currently available for ordering.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <div className="grid gap-4">
                    {unavailableItems.map(item => (
                      <div key={item.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex justify-between items-start">
                          <div className="w-20 h-20 mr-4 flex-shrink-0">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-lg border-2 border-red-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRkVGMkYyIiBzdHJva2U9IiNGQ0E1QTUiIHN0cm9rZS13aWR0aD0iMiIgcng9IjgiLz4KPHRleHQgeD0iNDAiIHk9IjQ1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRjg3MTcxIiBmb250LXNpemU9IjEwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+SW1hZ2UgRXJyb3I8L3RleHQ+Cjwvc3ZnPgo=';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-red-100 rounded-lg border-2 border-red-200 flex items-center justify-center">
                                <span className="text-red-400 text-xs text-center">No Image</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 border border-red-200">
                                {item.category}
                              </span>
                              <span className="px-2 py-1 text-xs rounded-full bg-red-200 text-red-900 font-medium">
                                Unavailable
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                            <p className="text-lg font-semibold text-purple-600">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => toggleMenuItemAvailability(item)}
                              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 font-medium"
                            >
                              <Wifi className="w-4 h-4" />
                              Make Available
                            </button>
                            <button
                              onClick={() => setEditingMenuItem(item)}
                              className="p-2 text-gray-500 hover:text-blue-600 transition-colors border border-gray-300 rounded-lg hover:border-blue-300"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMenuItem(item.id)}
                              className="p-2 text-gray-500 hover:text-red-600 transition-colors border border-gray-300 rounded-lg hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bulk Actions */}
                {unavailableItems.length > 1 && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Bulk actions for {unavailableItems.length} unavailable items
                      </p>
                      <button
                        onClick={async () => {
                          if (confirm(`Make all ${unavailableItems.length} unavailable items available?`)) {
                            try {
                              for (const item of unavailableItems) {
                                await apiService.updateMenuItem(item.id, { is_available: true });
                              }
                              await loadMenuItems();
                            } catch (error) {
                              console.error('Failed to update items:', error);
                              alert('Failed to update some items. Please try again.');
                            }
                          }
                        }}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 font-medium"
                      >
                        <Wifi className="w-4 h-4" />
                        Make All Available
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Edit Modal for Unavailable Items */}
            {editingMenuItem && !editingMenuItem.is_available && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
                  <h3 className="text-lg font-semibold mb-4">Edit Unavailable Item</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Item Name
                        </label>
                        <input
                          type="text"
                          value={editingMenuItem.name}
                          onChange={(e) => setEditingMenuItem({
                            ...editingMenuItem,
                            name: e.target.value
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={editingMenuItem.image_url || ''}
                          onChange={(e) => setEditingMenuItem({
                            ...editingMenuItem,
                            image_url: e.target.value || null
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="https://example.com/image.jpg"
                        />
                        {editingMenuItem.image_url && (
                          <div className="mt-2">
                            <img
                              src={editingMenuItem.image_url}
                              alt="Preview"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                // Show error message
                                const errorDiv = document.createElement('div');
                                target.parentElement?.replaceChild(errorDiv, target);
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={editingMenuItem.category}
                          onChange={(e) => setEditingMenuItem({
                            ...editingMenuItem,
                            category: e.target.value
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
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
                        value={editingMenuItem.price}
                        onChange={(e) => setEditingMenuItem({
                          ...editingMenuItem,
                          price: parseFloat(e.target.value) || 0
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={editingMenuItem.description || ''}
                        onChange={(e) => setEditingMenuItem({
                          ...editingMenuItem,
                          description: e.target.value
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        rows={3}
                      />
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <WifiOff className="w-5 h-5 text-yellow-600" />
                        <h4 className="font-medium text-yellow-800">Availability Status</h4>
                      </div>
                      <p className="text-sm text-yellow-700 mb-3">
                        This item is currently unavailable to customers. You can make it available after editing.
                      </p>
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
                        <span className="text-sm font-medium text-yellow-800">Make available for ordering</span>
                      </label>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditingMenuItem(null)}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateMenuItem(editingMenuItem)}
                        className="flex-1 bg-purple-500 text-white py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
                      >
                        Update Item
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order History Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order History & Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as 'date' | 'month' | 'year')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="date">Date Range</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </div>

                {filterType === 'date' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={dateFilter.startDate}
                        onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </>
                )}

                {filterType === 'month' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                      <select
                        value={dateFilter.month}
                        onChange={(e) => setDateFilter({...dateFilter, month: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {Array.from({length: 12}, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                      <select
                        value={dateFilter.year}
                        onChange={(e) => setDateFilter({...dateFilter, year: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {Array.from({length: 5}, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return <option key={year} value={year}>{year}</option>;
                        })}
                      </select>
                    </div>
                  </>
                )}

                {filterType === 'year' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <select
                      value={dateFilter.year}
                      onChange={(e) => setDateFilter({...dateFilter, year: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {Array.from({length: 5}, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Sales Analytics */}
            {!ordersLoading && salesAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Sales</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${(salesAnalytics.totalSales || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {salesAnalytics.totalOrders || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Order</p>
                      <p className="text-2xl font-bold text-purple-600">
                        ${(salesAnalytics.averageOrder || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Items Sold</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {salesAnalytics.totalItems || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order History Table */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Order History
                  {!ordersLoading && orderHistory.length > 0 && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({orderHistory.length} orders)
                    </span>
                  )}
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                {ordersLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading order history...</p>
                  </div>
                ) : orderHistory.length === 0 ? (
                  <div className="p-12 text-center">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                    <p className="text-gray-500">No orders found for the selected time period.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Table
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderHistory.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                #{order.id.substring(0, 8)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Code: {order.unique_code}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {order.table_number}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {order.order_items?.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between">
                                  <span>{item.name}</span>
                                  <span>×{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'Served' ? 'bg-green-100 text-green-800' :
                              order.status === 'Ready' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'Preparing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${order.total?.toFixed(2) || '0.00'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleTimeString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
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
                  Image URL
                </label>
                <input
                  type="url"
                  value={menuForm.image_url}
                  onChange={(e) => setMenuForm({ ...menuForm, image_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="https://example.com/image.jpg (optional)"
                />
                {menuForm.image_url && (
                  <div className="mt-2">
                    <img
                      src={menuForm.image_url}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-lg border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
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