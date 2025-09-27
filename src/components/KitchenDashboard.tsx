import React, { useState, useEffect } from 'react';
import { Clock, CircleCheck as CheckCircle, Utensils, Truck, Printer } from 'lucide-react';
import { Order, OrderStatus } from '../types/database';
import { apiService } from '../services/api';
import { printOrderSummary, showPrintPreview } from '../utils/printer';

export const KitchenDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    
    // Subscribe to real-time updates
    const subscription = apiService.subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadOrders = async () => {
    try {
      const activeOrders = await apiService.getAllActiveOrders();
      setOrders(activeOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
      // Don't throw error, just set empty orders array to prevent crash
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      // If marking as "Preparing", print the order summary
      if (status === 'Preparing') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const printableOrder = {
            id: order.id,
            table_number: order.tables?.table_number || 'Unknown',
            unique_code: order.unique_code,
            created_at: order.created_at,
            order_items: order.order_items || []
          };
          
          // Print the order summary
          printOrderSummary(printableOrder);
        }
      }
      
      await apiService.updateOrderStatus(orderId, status);
      // Orders will be updated through real-time subscription
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handlePrintPreview = (order: Order) => {
    const printableOrder = {
      id: order.id,
      table_number: order.tables?.table_number || 'Unknown',
      unique_code: order.unique_code,
      created_at: order.created_at,
      order_items: order.order_items || []
    };
    
    showPrintPreview(printableOrder);
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'Preparing':
        return <Utensils className="w-5 h-5 text-blue-500" />;
      case 'Ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Served':
        return <Truck className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'Preparing':
        return 'bg-blue-50 border-blue-200';
      case 'Ready':
        return 'bg-green-50 border-green-200';
      case 'Served':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      'Pending': 'Preparing',
      'Preparing': 'Ready',
      'Ready': 'Served',
      'Served': null
    };
    return statusFlow[currentStatus];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOrderTotal = (order: Order) => {
    return order.order_items?.reduce((total, item) => {
      return total + (item.menu?.price || 0) * item.quantity;
    }, 0) || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6 pt-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
              <p className="text-gray-600">Active Orders: {orders.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="font-medium">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Orders</h3>
            <p className="text-gray-500">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map(order => (
              <div
                key={order.id}
                className={`border-2 rounded-xl p-6 ${getStatusColor(order.status)} transition-all hover:shadow-lg`}
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Table {order.tables?.table_number}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Code: {order.unique_code}
                    </p>
                    <p className="text-xs text-gray-400">
                      Order ID: {order.id.substring(0, 8)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className="font-medium capitalize">{order.status}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Items:</h4>
                  <div className="space-y-2">
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="flex-1">{item.menu?.name}</span>
                        <span className="font-medium">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Meta */}
                <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                  <span>Ordered: {formatTime(order.created_at)}</span>
                  <span className="font-semibold text-gray-900">
                    ${getOrderTotal(order).toFixed(2)}
                  </span>
                </div>

                {/* Status Action */}
                {getNextStatus(order.status) && (
                  <div className="space-y-2">
                    <button
                      onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                      className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                    >
                      Mark as {getNextStatus(order.status)}
                      {getNextStatus(order.status) === 'Preparing' && (
                        <span className="ml-2">🖨️</span>
                      )}
                    </button>
                    
                    {/* Print Preview Button */}
                    <button
                      onClick={() => handlePrintPreview(order)}
                      className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Preview Print
                    </button>
                  </div>
                )}

                {order.status === 'Served' && (
                  <div className="w-full bg-gray-200 text-gray-600 py-2 rounded-lg text-center font-medium">
                    Order Completed
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="fixed bottom-4 right-4">
        <div className="bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live Updates</span>
        </div>
      </div>
    </div>
  );
};