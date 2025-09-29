import React from 'react';
import { Utensils, QrCode, Settings, LogOut, Hop as Home } from 'lucide-react';

interface AdminNavigationProps {
  currentPage: 'kitchen' | 'qr-generator' | 'admin' | 'tables';
  onNavigate: (page: 'kitchen' | 'qr-generator' | 'admin' | 'tables') => void;
  onLogout: () => void;
  onHome: () => void;
}

export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  currentPage,
  onNavigate,
  onLogout,
  onHome
}) => {
  const menuItems = [
    {
      id: 'kitchen' as const,
      title: 'Kitchen Dashboard',
      icon: <Utensils className="w-5 h-5" />,
      description: 'Manage orders'
    },
    {
      id: 'qr-generator' as const,
      title: 'QR Generator',
      icon: <QrCode className="w-5 h-5" />,
      description: 'Generate table QR codes'
    },
    {
      id: 'admin' as const,
      title: 'Admin Panel',
      icon: <Settings className="w-5 h-5" />,
      description: 'Manage tables & menu'
    },
    {
      id: 'tables' as const,
      title: 'Tables',
      icon: <Settings className="w-5 h-5" />,
      description: 'Manage restaurant tables'
    }
  ];

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">OrderEase Admin</h1>
              <p className="text-xs text-gray-500">Restaurant Management System</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex items-center gap-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={item.description}
              >
                {item.icon}
                <span className="hidden md:inline">{item.title}</span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onHome}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go to Home"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};