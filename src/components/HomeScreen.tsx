import React from 'react';
import { QrCode, Utensils, Settings, Users, Smartphone } from 'lucide-react';

interface HomeScreenProps {
  onModeSelect: (mode: 'customer' | 'kitchen' | 'qr-generator' | 'join-order' | 'admin-login') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onModeSelect }) => {
  const menuItems = [
    {
      id: 'customer',
      title: 'Start New Order',
      description: 'Scan QR code or enter table details to begin ordering',
      icon: <Smartphone className="w-8 h-8" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      textColor: 'text-white'
    },
    {
      id: 'join-order',
      title: 'Join Existing Order',
      description: 'Enter a 6-digit code to join your tablemates order',
      icon: <Users className="w-8 h-8" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-white'
    },
    {
      id: 'kitchen-dashboard',
      title: 'Kitchen Dashboard',
      description: 'Real-time order management for kitchen staff (Admin Only)',
      icon: <Utensils className="w-8 h-8" />,
      color: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-white'
    },
    {
      id: 'qr-generator',
      title: 'QR Code Generator',
      description: 'Generate QR codes for restaurant tables (Admin Only)',
      icon: <QrCode className="w-8 h-8" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      textColor: 'text-white'
    },
    {
      id: 'admin-panel',
      title: 'Admin Panel',
      description: 'Manage tables and menu items (Admin Only)',
      icon: <Settings className="w-8 h-8" />,
      color: 'bg-slate-500 hover:bg-slate-600',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              OrderEase Restaurant System
            </h1>
            <p className="text-gray-600 text-lg">
              Complete restaurant ordering and management solution
            </p>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'kitchen-dashboard' || item.id === 'qr-generator' || item.id === 'admin-panel') {
                  onModeSelect('admin-login');
                } else {
                  onModeSelect(item.id as any);
                }
              }}
              className={`${item.color} ${item.textColor} p-8 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 text-left group`}
            >
              <div className="flex items-start gap-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl group-hover:bg-opacity-30 transition-all">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            System Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">QR Code Integration</h3>
              <p className="text-sm text-gray-600">
                Seamless table identification and order initiation
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Collaborative Ordering</h3>
              <p className="text-sm text-gray-600">
                Multiple guests can contribute to the same order
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-time Updates</h3>
              <p className="text-sm text-gray-600">
                Live order tracking and kitchen management
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            Built with React, TypeScript, Tailwind CSS, and Supabase
          </p>
        </div>
      </div>
    </div>
  );
};