import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader, Copy, Trash2, Play } from 'lucide-react';
import { apiService } from '../services/api';

interface TestResult {
  id: string;
  endpoint: string;
  method: string;
  timestamp: string;
  duration: number;
  status: 'success' | 'error';
  request?: any;
  response?: any;
  error?: string;
}

export function ApiTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('menu');

  const addResult = (result: Omit<TestResult, 'id' | 'timestamp'>) => {
    const newResult: TestResult = {
      ...result,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setResults(prev => [newResult, ...prev]);
  };

  const clearResults = () => setResults([]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const runTest = async (
    testName: string,
    endpoint: string,
    method: string,
    testFn: () => Promise<any>,
    requestData?: any
  ) => {
    setLoading(testName);
    const startTime = Date.now();

    try {
      const response = await testFn();
      const duration = Date.now() - startTime;

      addResult({
        endpoint,
        method,
        duration,
        status: 'success',
        request: requestData,
        response,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;

      addResult({
        endpoint,
        method,
        duration,
        status: 'error',
        request: requestData,
        error: error.message || 'Unknown error',
      });
    } finally {
      setLoading(null);
    }
  };

  const MenuTests = () => {
    const [menuForm, setMenuForm] = useState({
      name: 'Test Item',
      category: 'Mains',
      price: 15.99,
      description: 'A test menu item',
      image_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
      is_available: true,
    });

    const [updateMenuForm, setUpdateMenuForm] = useState({
      itemId: '',
      name: '',
      price: '',
    });

    const [deleteMenuId, setDeleteMenuId] = useState('');

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Get Menu Items</h3>
          <div className="flex gap-3">
            <button
              onClick={() =>
                runTest('getMenu', '/api/menu', 'GET', () => apiService.getMenu())
              }
              disabled={loading === 'getMenu'}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === 'getMenu' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Get Available Menu
            </button>
            <button
              onClick={() =>
                runTest('getAllMenu', '/api/menu/all', 'GET', () => apiService.getAllMenuItems())
              }
              disabled={loading === 'getAllMenu'}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === 'getAllMenu' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Get All Menu Items
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Add Menu Item</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Name"
              value={menuForm.name}
              onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Category"
              value={menuForm.category}
              onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Price"
              value={menuForm.price}
              onChange={(e) => setMenuForm({ ...menuForm, price: parseFloat(e.target.value) })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Description"
              value={menuForm.description}
              onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={menuForm.image_url}
              onChange={(e) => setMenuForm({ ...menuForm, image_url: e.target.value })}
              className="border rounded px-3 py-2 col-span-2"
            />
            <label className="flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                checked={menuForm.is_available}
                onChange={(e) => setMenuForm({ ...menuForm, is_available: e.target.checked })}
                className="w-4 h-4"
              />
              <span>Available</span>
            </label>
          </div>
          <button
            onClick={() =>
              runTest('addMenuItem', '/api/menu', 'POST', () => apiService.addMenuItem(menuForm), menuForm)
            }
            disabled={loading === 'addMenuItem'}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading === 'addMenuItem' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Add Menu Item
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Update Menu Item</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Item ID"
              value={updateMenuForm.itemId}
              onChange={(e) => setUpdateMenuForm({ ...updateMenuForm, itemId: e.target.value })}
              className="border rounded px-3 py-2 col-span-2"
            />
            <input
              type="text"
              placeholder="New Name"
              value={updateMenuForm.name}
              onChange={(e) => setUpdateMenuForm({ ...updateMenuForm, name: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="New Price"
              value={updateMenuForm.price}
              onChange={(e) => setUpdateMenuForm({ ...updateMenuForm, price: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <button
            onClick={() => {
              const updates: any = {};
              if (updateMenuForm.name) updates.name = updateMenuForm.name;
              if (updateMenuForm.price) updates.price = parseFloat(updateMenuForm.price);
              runTest(
                'updateMenuItem',
                `/api/menu/${updateMenuForm.itemId}`,
                'PUT',
                () => apiService.updateMenuItem(updateMenuForm.itemId, updates),
                updates
              );
            }}
            disabled={loading === 'updateMenuItem' || !updateMenuForm.itemId}
            className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            {loading === 'updateMenuItem' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Update Menu Item
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Delete Menu Item</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Item ID"
              value={deleteMenuId}
              onChange={(e) => setDeleteMenuId(e.target.value)}
              className="border rounded px-3 py-2 flex-1"
            />
            <button
              onClick={() =>
                runTest('deleteMenuItem', `/api/menu/${deleteMenuId}`, 'DELETE', () =>
                  apiService.deleteMenuItem(deleteMenuId)
                )
              }
              disabled={loading === 'deleteMenuItem' || !deleteMenuId}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading === 'deleteMenuItem' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Delete Menu Item
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TableTests = () => {
    const [tableForm, setTableForm] = useState({
      table_number: 'T99',
      floor: 'First Floor',
      seating_capacity: 6,
    });

    const [updateTableForm, setUpdateTableForm] = useState({
      tableId: '',
      table_number: '',
      floor: '',
    });

    const [deleteTableId, setDeleteTableId] = useState('');

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Get Tables</h3>
          <button
            onClick={() =>
              runTest('getAllTables', '/api/tables', 'GET', () => apiService.getAllTables())
            }
            disabled={loading === 'getAllTables'}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === 'getAllTables' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Get All Tables
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Add Table</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Table Number"
              value={tableForm.table_number}
              onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Floor"
              value={tableForm.floor}
              onChange={(e) => setTableForm({ ...tableForm, floor: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Seating Capacity"
              value={tableForm.seating_capacity}
              onChange={(e) => setTableForm({ ...tableForm, seating_capacity: parseInt(e.target.value) })}
              className="border rounded px-3 py-2"
            />
          </div>
          <button
            onClick={() =>
              runTest('addTable', '/api/tables', 'POST', () => apiService.addTable(tableForm), tableForm)
            }
            disabled={loading === 'addTable'}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading === 'addTable' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Add Table
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Update Table</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Table ID"
              value={updateTableForm.tableId}
              onChange={(e) => setUpdateTableForm({ ...updateTableForm, tableId: e.target.value })}
              className="border rounded px-3 py-2 col-span-3"
            />
            <input
              type="text"
              placeholder="New Table Number"
              value={updateTableForm.table_number}
              onChange={(e) => setUpdateTableForm({ ...updateTableForm, table_number: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="New Floor"
              value={updateTableForm.floor}
              onChange={(e) => setUpdateTableForm({ ...updateTableForm, floor: e.target.value })}
              className="border rounded px-3 py-2 col-span-2"
            />
          </div>
          <button
            onClick={() => {
              const updates: any = {};
              if (updateTableForm.table_number) updates.table_number = updateTableForm.table_number;
              if (updateTableForm.floor) updates.floor = updateTableForm.floor;
              runTest(
                'updateTable',
                `/api/tables/${updateTableForm.tableId}`,
                'PUT',
                () => apiService.updateTable(updateTableForm.tableId, updates),
                updates
              );
            }}
            disabled={loading === 'updateTable' || !updateTableForm.tableId}
            className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            {loading === 'updateTable' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Update Table
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Delete Table</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Table ID"
              value={deleteTableId}
              onChange={(e) => setDeleteTableId(e.target.value)}
              className="border rounded px-3 py-2 flex-1"
            />
            <button
              onClick={() =>
                runTest('deleteTable', `/api/tables/${deleteTableId}`, 'DELETE', () =>
                  apiService.deleteTable(deleteTableId)
                )
              }
              disabled={loading === 'deleteTable' || !deleteTableId}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading === 'deleteTable' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Delete Table
            </button>
          </div>
        </div>
      </div>
    );
  };

  const OrderTests = () => {
    const [initOrderForm, setInitOrderForm] = useState({
      tableNumber: 'T01',
      mobileNumber: '+1234567890',
    });

    const [orderCode, setOrderCode] = useState('');
    const [updateOrderForm, setUpdateOrderForm] = useState({
      orderId: '',
      status: 'Preparing' as 'Pending' | 'Preparing' | 'Ready' | 'Served',
    });

    const [historyForm, setHistoryForm] = useState({
      filterType: 'year' as 'dateRange' | 'month' | 'year',
      startDate: '',
      endDate: '',
      month: '',
      year: '2023',
    });

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Initialize Order</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Table Number"
              value={initOrderForm.tableNumber}
              onChange={(e) => setInitOrderForm({ ...initOrderForm, tableNumber: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Mobile Number"
              value={initOrderForm.mobileNumber}
              onChange={(e) => setInitOrderForm({ ...initOrderForm, mobileNumber: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <button
            onClick={() =>
              runTest(
                'initializeOrder',
                '/api/orders/initialize',
                'POST',
                () => apiService.initializeOrder(initOrderForm.tableNumber, initOrderForm.mobileNumber),
                initOrderForm
              )
            }
            disabled={loading === 'initializeOrder'}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading === 'initializeOrder' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Initialize Order
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Get Order by Code</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Order Code"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              className="border rounded px-3 py-2 flex-1"
            />
            <button
              onClick={() =>
                runTest('getOrderByCode', `/api/orders/code/${orderCode}`, 'GET', () =>
                  apiService.getOrderByCode(orderCode)
                )
              }
              disabled={loading === 'getOrderByCode' || !orderCode}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === 'getOrderByCode' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Get Order
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Get Active Orders</h3>
          <button
            onClick={() =>
              runTest('getActiveOrders', '/api/orders/active', 'GET', () => apiService.getAllActiveOrders())
            }
            disabled={loading === 'getActiveOrders'}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === 'getActiveOrders' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Get Active Orders
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Update Order Status</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Order ID"
              value={updateOrderForm.orderId}
              onChange={(e) => setUpdateOrderForm({ ...updateOrderForm, orderId: e.target.value })}
              className="border rounded px-3 py-2 col-span-2"
            />
            <select
              value={updateOrderForm.status}
              onChange={(e) => setUpdateOrderForm({ ...updateOrderForm, status: e.target.value as any })}
              className="border rounded px-3 py-2 col-span-2"
            >
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              <option value="Served">Served</option>
            </select>
          </div>
          <button
            onClick={() =>
              runTest(
                'updateOrderStatus',
                `/api/orders/${updateOrderForm.orderId}/status`,
                'PUT',
                () => apiService.updateOrderStatus(updateOrderForm.orderId, updateOrderForm.status),
                { status: updateOrderForm.status }
              )
            }
            disabled={loading === 'updateOrderStatus' || !updateOrderForm.orderId}
            className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            {loading === 'updateOrderStatus' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Update Status
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Get Order History</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <select
              value={historyForm.filterType}
              onChange={(e) => setHistoryForm({ ...historyForm, filterType: e.target.value as any })}
              className="border rounded px-3 py-2 col-span-2"
            >
              <option value="dateRange">Date Range</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>

            {historyForm.filterType === 'dateRange' && (
              <>
                <input
                  type="date"
                  value={historyForm.startDate}
                  onChange={(e) => setHistoryForm({ ...historyForm, startDate: e.target.value })}
                  className="border rounded px-3 py-2"
                />
                <input
                  type="date"
                  value={historyForm.endDate}
                  onChange={(e) => setHistoryForm({ ...historyForm, endDate: e.target.value })}
                  className="border rounded px-3 py-2"
                />
              </>
            )}

            {historyForm.filterType === 'month' && (
              <input
                type="month"
                value={historyForm.month}
                onChange={(e) => setHistoryForm({ ...historyForm, month: e.target.value })}
                className="border rounded px-3 py-2 col-span-2"
              />
            )}

            {historyForm.filterType === 'year' && (
              <input
                type="number"
                placeholder="Year"
                value={historyForm.year}
                onChange={(e) => setHistoryForm({ ...historyForm, year: e.target.value })}
                className="border rounded px-3 py-2 col-span-2"
              />
            )}
          </div>
          <button
            onClick={() =>
              runTest(
                'getOrderHistory',
                '/api/orders/history',
                'GET',
                () => apiService.getOrderHistory(historyForm),
                historyForm
              )
            }
            disabled={loading === 'getOrderHistory'}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === 'getOrderHistory' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Get History
          </button>
        </div>
      </div>
    );
  };

  const OrderItemTests = () => {
    const [addItemForm, setAddItemForm] = useState({
      orderId: '',
      menuItemId: '',
      quantity: 1,
      createNewOrder: false,
    });

    const [updateItemForm, setUpdateItemForm] = useState({
      itemId: '',
      quantity: 1,
    });

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Add Order Item</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Order ID"
              value={addItemForm.orderId}
              onChange={(e) => setAddItemForm({ ...addItemForm, orderId: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Menu Item ID"
              value={addItemForm.menuItemId}
              onChange={(e) => setAddItemForm({ ...addItemForm, menuItemId: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={addItemForm.quantity}
              onChange={(e) => setAddItemForm({ ...addItemForm, quantity: parseInt(e.target.value) })}
              className="border rounded px-3 py-2"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={addItemForm.createNewOrder}
                onChange={(e) => setAddItemForm({ ...addItemForm, createNewOrder: e.target.checked })}
                className="w-4 h-4"
              />
              <span>Create New Order</span>
            </label>
          </div>
          <button
            onClick={() =>
              runTest(
                'addOrderItem',
                `/api/orders/${addItemForm.orderId}/items`,
                'POST',
                () =>
                  apiService.addOrderItem(
                    addItemForm.orderId,
                    addItemForm.menuItemId,
                    addItemForm.quantity,
                    addItemForm.createNewOrder
                  ),
                addItemForm
              )
            }
            disabled={loading === 'addOrderItem' || !addItemForm.orderId || !addItemForm.menuItemId}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading === 'addOrderItem' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Add Order Item
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Update Order Item Quantity</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Order Item ID"
              value={updateItemForm.itemId}
              onChange={(e) => setUpdateItemForm({ ...updateItemForm, itemId: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="New Quantity (0 to delete)"
              value={updateItemForm.quantity}
              onChange={(e) => setUpdateItemForm({ ...updateItemForm, quantity: parseInt(e.target.value) })}
              className="border rounded px-3 py-2"
            />
          </div>
          <button
            onClick={() =>
              runTest(
                'updateOrderItemQuantity',
                `/api/order-items/${updateItemForm.itemId}/quantity`,
                'PUT',
                () => apiService.updateOrderItemQuantity(updateItemForm.itemId, updateItemForm.quantity),
                { quantity: updateItemForm.quantity }
              )
            }
            disabled={loading === 'updateOrderItemQuantity' || !updateItemForm.itemId}
            className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            {loading === 'updateOrderItemQuantity' ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Update Quantity
          </button>
        </div>
      </div>
    );
  };

  const UtilityTests = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Health Check</h3>
          <button
            onClick={() =>
              runTest('healthCheck', '/api/health', 'GET', () =>
                fetch('http://localhost:3001/api/health').then((r) => r.json())
              )
            }
            disabled={loading === 'healthCheck'}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === 'healthCheck' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Check Health
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Test Console</h1>
          <p className="text-gray-600">Test all restaurant ordering system API endpoints</p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'menu', label: 'Menu' },
            { id: 'tables', label: 'Tables' },
            { id: 'orders', label: 'Orders' },
            { id: 'items', label: 'Order Items' },
            { id: 'utilities', label: 'Utilities' },
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {activeSection === 'menu' && <MenuTests />}
            {activeSection === 'tables' && <TableTests />}
            {activeSection === 'orders' && <OrderTests />}
            {activeSection === 'items' && <OrderItemTests />}
            {activeSection === 'utilities' && <UtilityTests />}
          </div>

          <div>
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Test Results</h2>
                <button
                  onClick={clearResults}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </div>

              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {results.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No test results yet. Run a test to see results here.</p>
                )}

                {results.map((result) => (
                  <div
                    key={result.id}
                    className={`border rounded-lg p-4 ${
                      result.status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {result.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">
                            {result.method} {result.endpoint}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(result.timestamp).toLocaleTimeString()} • {result.duration}ms
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    {result.request && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Request:</p>
                        <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.request, null, 2)}
                        </pre>
                      </div>
                    )}

                    {result.response && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Response:</p>
                        <pre className="text-xs bg-white p-2 rounded overflow-x-auto max-h-48">
                          {JSON.stringify(result.response, null, 2)}
                        </pre>
                      </div>
                    )}

                    {result.error && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-red-700 mb-1">Error:</p>
                        <p className="text-xs bg-white p-2 rounded">{result.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
