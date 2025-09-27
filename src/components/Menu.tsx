import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, Share2, Copy, Trash2, RefreshCw, Clock, CircleCheck as CheckCircle, Utensils, Truck } from 'lucide-react';
import { MenuItem, CartItem, Order } from '../types/database';
import { apiService } from '../services/api';

interface MenuProps {
  order: Order;
  uniqueCode: string;
}

export const Menu: React.FC<MenuProps> = ({ order, uniqueCode }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]); // Local cart for new items
  const [existingOrderItems, setExistingOrderItems] = useState<CartItem[]>([]); // Items already ordered
  const [allTableItems, setAllTableItems] = useState<CartItem[]>([]); // All items ever ordered for this table
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showOrderCode, setShowOrderCode] = useState(false);
  const [refreshingOrder, setRefreshingOrder] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [orderStatusPolling, setOrderStatusPolling] = useState<NodeJS.Timeout | null>(null);
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [hasPlacedFirstOrder, setHasPlacedFirstOrder] = useState(false);

  useEffect(() => {
    loadMenu();
    loadExistingOrderItems();
    
    // Start polling for order status updates
    startOrderStatusPolling();
    
    return () => {
      if (orderStatusPolling) {
        clearInterval(orderStatusPolling);
      }
    };
  }, []);

  // Check if user has existing orders after data loads
  useEffect(() => {
    if (existingOrderItems.length > 0 || allTableItems.length > 0) {
      setHasPlacedFirstOrder(true);
    }
  }, [existingOrderItems, allTableItems]);

  const loadMenu = async () => {
    try {
      const items = await apiService.getMenu();
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingOrderItems = async () => {
    try {
      // Get fresh order data to show existing items
      const currentOrder = await apiService.getOrderByCode(uniqueCode);
      if (currentOrder && currentOrder.order_items) {
        const existingItems = currentOrder.order_items.map(item => ({
          ...item.menu!,
          quantity: item.quantity
        }));
        setExistingOrderItems(existingItems);
        
        // Load all table items for order history
        if (currentOrder.all_table_items) {
          const allItems = currentOrder.all_table_items.map(item => ({
            ...item.menu!,
            quantity: item.quantity,
            order_status: item.order_status || 'Pending',
            order_created_at: item.order_created_at || item.created_at
          }));
          setAllTableItems(allItems);
        } else {
          // If no all_table_items, use current order items as fallback
          const fallbackItems = currentOrder.order_items.map(item => ({
            ...item.menu!,
            quantity: item.quantity,
            order_status: currentOrder.status || 'Pending',
            order_created_at: currentOrder.created_at
          }));
          setAllTableItems(fallbackItems);
        }
      } else {
        // Try to get order data directly if code lookup fails
        const activeOrders = await apiService.getAllActiveOrders();
        const tableOrders = activeOrders.filter(o => o.unique_code === uniqueCode);
        
        if (tableOrders.length > 0) {
          const allItems: any[] = [];
          tableOrders.forEach(order => {
            if (order.order_items) {
              order.order_items.forEach(item => {
                allItems.push({
                  ...item.menu!,
                  quantity: item.quantity,
                  order_status: order.status || 'Pending',
                  order_created_at: order.created_at
                });
              });
            }
          });
          setAllTableItems(allItems);
          
          // Set existing items from most recent order
          const mostRecentOrder = tableOrders[0];
          if (mostRecentOrder.order_items) {
            const existingItems = mostRecentOrder.order_items.map(item => ({
              ...item.menu!,
              quantity: item.quantity
            }));
            setExistingOrderItems(existingItems);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load existing order items:', error);
    }
  };

  const startOrderStatusPolling = () => {
    // Poll every 10 seconds for order status updates
    const interval = setInterval(async () => {
      try {
        await loadExistingOrderItems();
      } catch (error) {
        console.error('Failed to poll order status:', error);
      }
    }, 10000);
    
    setOrderStatusPolling(interval);
  };

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(prev => prev.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(cartItem => cartItem.id !== item.id));
    } else {
      setCart(prev => prev.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      ));
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(cartItem => cartItem.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    setPlacingOrder(true);
    try {
      // Create a new sub-order for additional items if there are existing orders
      const createNewOrder = existingOrderItems.length > 0;
      let currentOrderId = order.id;
      
      // Add all cart items to the order
      for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        const result = await apiService.addOrderItem(
          currentOrderId, 
          item.id, 
          item.quantity, 
          createNewOrder && i === 0 // Only create new order for first item
        );
        
        // Update order ID if a new order was created
        if (result.orderId) {
          currentOrderId = result.orderId;
        }
      }
      
      // Clear the cart after successful order placement
      setCart([]);
      setShowCart(false);
      
      // Refresh existing order items to show the newly placed items
      await loadExistingOrderItems();
      
      // Show order status after first order and set session flag
      if (!hasPlacedFirstOrder) {
        setHasPlacedFirstOrder(true);
        setShowOrderStatus(true);
      }
      
      if (createNewOrder) {
        alert('Additional order placed successfully! Kitchen will receive a new ticket.');
      } else {
        alert('Order placed successfully!');
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const getTotalPrice = () => {
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const existingTotal = allTableItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    return cartTotal + existingTotal;
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getExistingOrderTotal = () => {
    return allTableItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getItemQuantity = (itemId: string) => {
    return cart.find(item => item.id === itemId)?.quantity || 0;
  };

  const copyOrderCode = async () => {
    try {
      await navigator.clipboard.writeText(uniqueCode);
      alert('Order code copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const refreshOrder = async () => {
    setRefreshingOrder(true);
    try {
      await loadExistingOrderItems();
    } catch (error) {
      console.error('Failed to refresh order:', error);
    } finally {
      setRefreshingOrder(false);
    }
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Preparing':
        return <Utensils className="w-4 h-4 text-blue-500" />;
      case 'Ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Served':
        return <Truck className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'Preparing':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'Ready':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'Served':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getCurrentOrdersByStatus = () => {
    const ordersByStatus: Record<string, any[]> = {};
    
    allTableItems.forEach(item => {
      const status = item.order_status || 'Unknown';
      if (!ordersByStatus[status]) {
        ordersByStatus[status] = [];
      }
      ordersByStatus[status].push(item);
    });
    
    return ordersByStatus;
  };

  const categorizeItems = () => {
    const categories = ['Starters', 'Mains', 'Drinks', 'Desserts'];
    return categories.map(category => ({
      name: category,
      items: menuItems.filter(item => item.category === category)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Menu</h1>
              <p className="text-sm text-gray-500">Table {order.tables?.table_number}</p>
              {allTableItems.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  {allTableItems.reduce((sum, item) => sum + item.quantity, 0)} items ordered for this table
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {allTableItems.length > 0 && (
                <button
                  onClick={() => setShowOrderHistory(true)}
                  className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                >
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </button>
              )}
              {allTableItems.length > 0 && (
                <button
                  onClick={() => setShowOrderStatus(true)}
                  className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Orders</span>
                </button>
              )}
              {allTableItems.length === 0 && hasPlacedFirstOrder && (
                <button
                  onClick={() => setShowOrderStatus(true)}
                  className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Orders</span>
                </button>
              )}
              <button
                onClick={refreshOrder}
                disabled={refreshingOrder}
                className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 text-sm"
              >
                {refreshingOrder ? (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setShowOrderCode(true)}
                className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-200 transition-colors text-sm"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
          
          {/* Active Order Status Banner */}
          {hasPlacedFirstOrder && allTableItems.length > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-800">
                    Active Orders: {Object.keys(getCurrentOrdersByStatus()).length} tickets
                  </span>
                </div>
                <button
                  onClick={() => setShowOrderStatus(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Status →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Menu Categories */}
        {categorizeItems().map(category => (
          <div key={category.name} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {category.name}
            </h2>
            <div className="grid gap-4">
              {category.items.map(item => (
                <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
                  {item.image_url && (
                    <div className="mb-3">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      <p className="text-lg font-semibold text-orange-600 mt-2">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {getItemQuantity(item.id) > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              updateQuantity({ ...item, quantity: getItemQuantity(item.id) }, getItemQuantity(item.id) - 1);
                            }}
                            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-medium min-w-[20px] text-center">
                            {getItemQuantity(item.id)}
                          </span>
                          <button
                            onClick={() => {
                              updateQuantity({ ...item, quantity: getItemQuantity(item.id) }, getItemQuantity(item.id) + 1);
                            }}
                            className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      {(cart.length > 0 || allTableItems.length > 0) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <span className="font-medium">
                  {cart.reduce((sum, item) => sum + item.quantity, 0) + allTableItems.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
                {allTableItems.length > 0 && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {allTableItems.reduce((sum, item) => sum + item.quantity, 0)} ordered
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  ${getTotalPrice().toFixed(2)}
                </p>
                {allTableItems.length > 0 && cart.length > 0 && (
                  <p className="text-xs text-gray-500">
                    New: ${getCartTotal().toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCart(true)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                View Cart
              </button>
              <button
                onClick={placeOrder}
                disabled={placingOrder}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:bg-orange-300 transition-colors font-medium disabled:cursor-not-allowed"
              >
                {placingOrder ? 'Placing...' : hasPlacedFirstOrder ? 'Add to Order' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Cart</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 && allTableItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Existing Order Items */}
                  {allTableItems.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-blue-700">Table Order History</h4>
                        <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          ${getExistingOrderTotal().toFixed(2)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {allTableItems.map((item, index) => (
                          <div key={`existing-${item.id}-${index}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                              <p className="text-xs text-gray-500">
                                Status: <span className="capitalize">{item.order_status}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                ×{item.quantity}
                              </span>
                              <span className="text-xs text-blue-600 capitalize">{item.order_status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Cart Items */}
                  {cart.length > 0 && (
                    <div>
                      {allTableItems.length > 0 && (
                        <div className="flex items-center justify-between mb-3 mt-6">
                          <h4 className="font-medium text-orange-700">New Items</h4>
                          <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                            ${getCartTotal().toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="space-y-2">
                        {cart.map(item => (
                          <div key={`cart-${item.id}`} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item, item.quantity - 1)}
                                className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors border"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-medium min-w-[20px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item, item.quantity + 1)}
                                className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {(cart.length > 0 || allTableItems.length > 0) && (
              <div className="p-6 border-t">
                <div className="space-y-2 mb-4">
                  {allTableItems.length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-600">Table Total:</span>
                      <span className="font-medium text-blue-600">
                        ${getExistingOrderTotal().toFixed(2)}
                      </span>
                    </div>
                  )}
                  {cart.length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-orange-600">New Items:</span>
                      <span className="font-medium text-orange-600">
                        ${getCartTotal().toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-xl font-bold text-gray-900">
                      ${getTotalPrice().toFixed(2)}
                    </span>
                  </div>
                </div>
                {cart.length > 0 && (
                  <div className="flex gap-3">
                    <button
                      onClick={clearCart}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Clear New Items
                    </button>
                    <button
                      onClick={placeOrder}
                      disabled={placingOrder}
                      className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:bg-orange-300 transition-colors font-medium disabled:cursor-not-allowed"
                    >
                      {placingOrder ? 'Placing...' : 
                        hasPlacedFirstOrder ? 
                          `Add to Order ($${getCartTotal().toFixed(2)})` : 
                          `Place Order ($${getCartTotal().toFixed(2)})`
                      }
                    </button>
                  </div>
                )}
                {cart.length === 0 && allTableItems.length > 0 && (
                  <div className="text-center">
                    <p className="text-gray-600 mb-3">Add new items to place another order</p>
                    <button
                      onClick={() => setShowCart(false)}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Continue Shopping
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Old cart modal content - keeping for backward compatibility but updating */}
      {showCart && false && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Cart</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item, item.quantity - 1)}
                          className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors border"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item, item.quantity + 1)}
                          className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-6 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-orange-600">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={clearCart}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={placeOrder}
                    disabled={placingOrder}
                    className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:bg-orange-300 transition-colors font-medium disabled:cursor-not-allowed"
                  >
                    {placingOrder ? 'Placing...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Order Code Modal */}
      {showOrderCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-center mb-4">
              Share Order Code
            </h3>
            <div className="text-center mb-6">
              <div className="text-3xl font-mono font-bold text-orange-600 bg-orange-50 py-4 px-6 rounded-lg mb-4">
                {uniqueCode}
              </div>
              <p className="text-sm text-gray-600">
                Share this code with your tablemates so they can add items to your order
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyOrderCode}
                className="flex-1 bg-orange-100 text-orange-700 py-2 rounded-lg hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={() => setShowOrderCode(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Status Modal */}
      {showOrderStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Order Status - Table {order.tables?.table_number}</h3>
                <button
                  onClick={() => setShowOrderStatus(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                🔴 Live updates • Last refreshed: {new Date().toLocaleTimeString()}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {allTableItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders placed yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(getCurrentOrdersByStatus()).map(([status, items]) => (
                    <div key={status} className={`border-2 rounded-lg p-4 ${getOrderStatusColor(status)}`}>
                      <div className="flex items-center gap-2 mb-3">
                        {getOrderStatusIcon(status)}
                        <h4 className="font-semibold capitalize">{status}</h4>
                        <span className="text-sm opacity-75">({items.length} items)</span>
                        {status === 'Preparing' && (
                          <div className="ml-auto flex items-center gap-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                            <span className="text-xs">In Kitchen</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <div key={`status-${item.id}-${index}`} className="flex justify-between items-center py-2 border-b border-current border-opacity-20 last:border-b-0">
                            <div className="flex-1">
                              <h5 className="font-medium">{item.name}</h5>
                              <p className="text-sm opacity-75">${item.price.toFixed(2)} each</p>
                            </div>
                            <div className="text-right">
                              <span className="font-medium">×{item.quantity}</span>
                              <p className="text-sm opacity-75">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                        <div className="flex justify-between items-center font-medium">
                          <span>Subtotal:</span>
                          <span>${items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t">
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Order Summary:</span>
                  <span className="font-medium">{allTableItems.reduce((sum, item) => sum + item.quantity, 0)} items total</span>
                </div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total Order Value:</span>
                <span className="text-xl font-bold text-gray-900">
                  ${getExistingOrderTotal().toFixed(2)}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={refreshOrder}
                  disabled={refreshingOrder}
                  className="flex-1 bg-blue-100 text-blue-700 py-3 rounded-lg hover:bg-blue-200 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {refreshingOrder ? (
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh Status
                </button>
                <button
                  onClick={() => setShowOrderStatus(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Continue Ordering
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order History Modal */}
      {showOrderHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Order History - Table {order.tables?.table_number}</h3>
                <button
                  onClick={() => setShowOrderHistory(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {allTableItems.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No order history</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group items by order creation time */}
                  {Object.entries(
                    allTableItems.reduce((groups, item) => {
                      const orderTime = new Date(item.order_created_at).toLocaleString();
                      if (!groups[orderTime]) {
                        groups[orderTime] = [];
                      }
                      groups[orderTime].push(item);
                      return groups;
                    }, {} as Record<string, typeof allTableItems>)
                  ).map(([orderTime, items]) => (
                    <div key={orderTime} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Order placed at {orderTime}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          items[0].order_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          items[0].order_status === 'Preparing' ? 'bg-blue-100 text-blue-800' :
                          items[0].order_status === 'Ready' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {items[0].order_status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <div key={`history-${item.id}-${index}`} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{item.name}</h5>
                              <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                            </div>
                            <div className="text-right">
                              <span className="font-medium">×{item.quantity}</span>
                              <p className="text-sm text-gray-600">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center font-medium">
                          <span>Subtotal:</span>
                          <span>${items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total Spent:</span>
                <span className="text-xl font-bold text-gray-900">
                  ${getExistingOrderTotal().toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => setShowOrderHistory(false)}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};