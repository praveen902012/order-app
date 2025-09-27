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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showOrderCode, setShowOrderCode] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    // Convert existing order items to cart format (for existing orders)
    if (order.order_items) {
      const cartItems = order.order_items.map(item => ({
        ...item.menu!,
        quantity: item.quantity
      }));
      setCart(cartItems);
    }
  }, [order]);

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
      alert('Order placed successfully!');
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
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
            </div>
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
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <span className="font-medium">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  ${getTotalPrice().toFixed(2)}
                </p>
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
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:bg-orange-300 transition-colors font-medium"
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
                    ${getTotalPrice().toFixed(2)}
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
                    className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:bg-orange-300 transition-colors font-medium"
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