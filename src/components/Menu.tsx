import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, Share2, Copy, Trash2 } from 'lucide-react';
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
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showOrderCode, setShowOrderCode] = useState(false);
  const [refreshingOrder, setRefreshingOrder] = useState(false);

  useEffect(() => {
    loadMenu();
    loadExistingOrderItems();
  }, []);

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
      }
    } catch (error) {
      console.error('Failed to load existing order items:', error);
    }
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
      // Add all cart items to the order
      for (const item of cart) {
        await apiService.addOrderItem(order.id, item.id, item.quantity);
      }
      
      // Clear the cart after successful order placement
      setCart([]);
      setShowCart(false);
      
      // Refresh existing order items to show the newly placed items
      await loadExistingOrderItems();
      alert('Order placed successfully!');
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const getTotalPrice = () => {
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const existingTotal = existingOrderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    return cartTotal + existingTotal;
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getExistingOrderTotal = () => {
    return existingOrderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
              {existingOrderItems.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  {existingOrderItems.reduce((sum, item) => sum + item.quantity, 0)} items already ordered
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshOrder}
                disabled={refreshingOrder}
                className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                {refreshingOrder ? (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Refresh
              </button>
              <button
                onClick={() => setShowOrderCode(true)}
                className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-200 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
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
      {(cart.length > 0 || existingOrderItems.length > 0) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <span className="font-medium">
                  {cart.reduce((sum, item) => sum + item.quantity, 0) + existingOrderItems.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
                {existingOrderItems.length > 0 && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {existingOrderItems.reduce((sum, item) => sum + item.quantity, 0)} ordered
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  ${getTotalPrice().toFixed(2)}
                </p>
                {existingOrderItems.length > 0 && cart.length > 0 && (
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
                {placingOrder ? 'Placing...' : 'Place Order'}
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
              {cart.length === 0 && existingOrderItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Existing Order Items */}
                  {existingOrderItems.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-blue-700">Already Ordered</h4>
                        <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          ${getExistingOrderTotal().toFixed(2)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {existingOrderItems.map(item => (
                          <div key={`existing-${item.id}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                ×{item.quantity}
                              </span>
                              <span className="text-sm text-blue-600">Ordered</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Cart Items */}
                  {cart.length > 0 && (
                    <div>
                      {existingOrderItems.length > 0 && (
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
            
            {(cart.length > 0 || existingOrderItems.length > 0) && (
              <div className="p-6 border-t">
                <div className="space-y-2 mb-4">
                  {existingOrderItems.length > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-600">Already Ordered:</span>
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
                      className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:bg-orange-300 transition-colors font-medium"
                    >
                      {placingOrder ? 'Placing...' : `Place Order ($${getCartTotal().toFixed(2)})`}
                    </button>
                  </div>
                )}
                {cart.length === 0 && existingOrderItems.length > 0 && (
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
    </div>
  );
};