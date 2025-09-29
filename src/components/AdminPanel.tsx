import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, Download, Eye, RefreshCw, ChevronLeft, ChevronRight, Clock, User, Hash, MapPin } from 'lucide-react';
import { apiService } from '../services/api';
import { Table, MenuItem } from '../types/database';

interface OrderSearchResult {
  id: string;
  unique_code: string;
  status: string;
  created_at: string;
  table_number: string;
  order_items: Array<{
    quantity: number;
    name: string;
    price: number;
    category: string;
  }>;
  mobile_numbers: string[];
  total: number;
  item_count: number;
  formatted_date: string;
  time_ago: string;
}

interface SearchFilters {
  tableNumber: string;
  mobileNumber: string;
  orderCode: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  current_page: number;
}

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'tables' | 'menu'>('search');
  const [searchResults, setSearchResults] = useState<OrderSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 20,
    offset: 0,
    pages: 0,
    current_page: 1
  });
  
  const [filters, setFilters] = useState<SearchFilters>({
    tableNumber: '',
    mobileNumber: '',
    orderCode: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderSearchResult | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    loadTables();
    loadMenuItems();
    // Load initial search results
    handleSearch();
  }, []);

  const loadTables = async () => {
    try {
      const tablesData = await apiService.getAllTables();
      setTables(tablesData);
    } catch (error) {
      console.error('Failed to load tables:', error);
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

  const handleSearch = async (newOffset: number = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.tableNumber) params.append('tableNumber', filters.tableNumber);
      if (filters.mobileNumber) params.append('mobileNumber', filters.mobileNumber);
      if (filters.orderCode) params.append('orderCode', filters.orderCode);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      params.append('limit', pagination.limit.toString());
      params.append('offset', newOffset.toString());

      const response = await fetch(`http://localhost:3001/api/orders/search?${params.toString()}`);
      const data = await response.json();
      
      setSearchResults(data.orders || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      tableNumber: '',
      mobileNumber: '',
      orderCode: '',
      status: '',
      startDate: '',
      endDate: ''
    });
  };

  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * pagination.limit;
    handleSearch(newOffset);
  };

  const exportResults = () => {
    const csvContent = [
      ['Order Code', 'Table', 'Status', 'Date', 'Items', 'Total', 'Mobile Numbers'].join(','),
      ...searchResults.map(order => [
        order.unique_code,
        order.table_number,
        order.status,
        order.formatted_date,
        order.item_count,
        `$${order.total.toFixed(2)}`,
        order.mobile_numbers.join('; ')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-search-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Served':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderSearchTab = () => (
    <div className="space-y-6">
      {/* Search Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Search Orders</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Table Number
            </label>
            <input
              type="text"
              value={filters.tableNumber}
              onChange={(e) => handleFilterChange('tableNumber', e.target.value)}
              placeholder="e.g., T01, T02..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Mobile Number
            </label>
            <input
              type="text"
              value={filters.mobileNumber}
              onChange={(e) => handleFilterChange('mobileNumber', e.target.value)}
              placeholder="e.g., 123456..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Hash className="w-4 h-4 inline mr-1" />
              Order Code
            </label>
            <input
              type="text"
              value={filters.orderCode}
              onChange={(e) => handleFilterChange('orderCode', e.target.value)}
              placeholder="e.g., ABC123..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="w-4 h-4 inline mr-1" />
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              <option value="Served">Served</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => handleSearch(0)}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
          
          <button
            onClick={clearFilters}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
          
          {searchResults.length > 0 && (
            <button
              onClick={exportResults}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
              <p className="text-sm text-gray-500">
                {pagination.total} orders found
                {Object.values(filters).some(v => v) && ' (filtered)'}
              </p>
            </div>
            <button
              onClick={() => handleSearch(pagination.offset)}
              disabled={loading}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Searching orders...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">Try adjusting your search filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items & Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchResults.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.unique_code}
                          </div>
                          <div className="text-sm text-gray-500">
                            Table {order.table_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.mobile_numbers.length > 0 ? (
                            order.mobile_numbers.map((mobile, idx) => (
                              <div key={idx} className="text-xs text-gray-600">
                                {mobile}
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400">No mobile data</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.item_count} items
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          ${order.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.time_ago}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="text-sm text-gray-700">
                    Page {pagination.current_page} of {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderTablesTab = () => (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Tables</h3>
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
              <h4 className="font-medium text-gray-900">
                Table {table.table_number}
              </h4>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  table.locked
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {table.locked ? 'Occupied' : 'Available'}
              </span>
            </div>
            {table.unique_code && (
              <p className="text-sm text-gray-600">
                Code: {table.unique_code}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderMenuTab = () => (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Menu Items</h3>
      <div className="space-y-4">
        {['Starters', 'Mains', 'Drinks', 'Desserts'].map((category) => (
          <div key={category}>
            <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {menuItems
                .filter((item) => item.category === category)
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h5 className="font-medium text-gray-900 text-sm">
                        {item.name}
                      </h5>
                      <span className="text-sm font-semibold text-green-600">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-600 mb-2">
                        {item.description}
                      </p>
                    )}
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        item.is_available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 pt-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'search', label: 'Order Search', icon: Search },
                { id: 'tables', label: 'Tables', icon: MapPin },
                { id: 'menu', label: 'Menu', icon: Filter }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'tables' && renderTablesTab()}
        {activeTab === 'menu' && renderMenuTab()}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Order Details</h3>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order Code</label>
                    <p className="text-lg font-semibold">{selectedOrder.unique_code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Table</label>
                    <p className="text-lg font-semibold">{selectedOrder.table_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date</label>
                    <p className="text-sm">{selectedOrder.formatted_date}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.time_ago}</p>
                  </div>
                </div>
                
                {selectedOrder.mobile_numbers.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Mobile Numbers</label>
                    <div className="mt-1">
                      {selectedOrder.mobile_numbers.map((mobile, idx) => (
                        <span key={idx} className="inline-block bg-gray-100 px-2 py-1 rounded text-sm mr-2 mb-1">
                          {mobile}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Order Items</label>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">×{item.quantity}</p>
                          <p className="text-sm text-gray-600">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-xl font-bold text-green-600">
                      ${selectedOrder.total.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedOrder.item_count} items total
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t">
              <button
                onClick={() => setShowOrderDetails(false)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};