import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, Share2, Copy } from 'lucide-react';
import { MenuItem, CartItem, Order } from '../types/database';
import { ApiService } from '../services/api';

interface MenuProps {
  order: Order;
  uniqueCode: string;
}

export const Menu: React.FC<MenuProps> = ({ order, uniqueCode }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderCode, setShowOrderCode] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    // Convert order items to cart format
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
      const items = await ApiService.getMenu();
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item: MenuItem) => {
    try {
      await ApiService.addOrderItem(order.id, item.id, 1);
      
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
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  };

  const updateQuantity = async (item: CartItem, newQuantity: number) => {
    try {
      const orderItem = order.order_items?.find(oi => oi.menu_id === item.id);
      if (orderItem) {
        await ApiService.updateOrderItemQuantity(orderItem.id, newQuantity);
      }

      if (newQuantity <= 0) {
        setCart(prev => prev.filter(cartItem => cartItem.id !== item.id));
      } else {
        setCart(prev => prev.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        ));
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
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
                              const currentItem = cart.find(c => c.id === item.id);
                              if (currentItem) {
                                updateQuantity(currentItem, currentItem.quantity - 1);
                              }
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
                              const currentItem = cart.find(c => c.id === item.id);
                              if (currentItem) {
                                updateQuantity(currentItem, currentItem.quantity + 1);
                              }
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
            <div className="flex items-center justify-between">
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
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
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