import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { TableLogin } from './components/TableLogin';
import { CodeEntry } from './components/CodeEntry';
import { AdminLogin } from './components/AdminLogin';
import { AdminNavigation } from './components/AdminNavigation';
import { Menu } from './components/Menu';
import { KitchenDashboard } from './components/KitchenDashboard';
import { QRGenerator } from './components/QRGenerator';
import { AdminPanel } from './components/AdminPanel';
import { TableManagement } from './components/TableManagement';
import { Order } from './types/database';
import { apiService } from './services/api';

type AppMode = 'home' | 'customer' | 'kitchen' | 'qr-generator' | 'admin' | 'tables' | 'menu' | 'admin-login';
type CustomerState = 'login' | 'code-entry' | 'menu';

function App() {
  const [mode, setMode] = useState<AppMode>('home');
  const [customerState, setCustomerState] = useState<CustomerState>('login');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [uniqueCode, setUniqueCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string>('');
  const [pendingAdminMode, setPendingAdminMode] = useState<'kitchen' | 'qr-generator' | 'admin' | null>(null);

  // Demo admin credentials
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
  };

  useEffect(() => {
    // Check URL parameters for initial routing
    const params = new URLSearchParams(window.location.search);
    const kitchen = params.get('kitchen');
    const qrgen = params.get('qr');
    const tableParam = params.get('table');

    if (kitchen === 'true') {
      setMode('kitchen');
    } else if (qrgen === 'true') {
      setMode('qr-generator');
    } else if (tableParam) {
      // Auto-fill table number if coming from QR code
      setMode('customer');
      setCustomerState('login');
    }
  }, []);

  const handleModeSelect = (selectedMode: 'customer' | 'kitchen' | 'qr-generator' | 'join-order' | 'admin-login') => {
    if (selectedMode === 'join-order') {
      setMode('customer');
      setCustomerState('code-entry');
    } else if (selectedMode === 'admin-login') {
      // Determine which admin mode was requested based on URL or default to admin panel
      const params = new URLSearchParams(window.location.search);
      const kitchen = params.get('kitchen');
      const qrgen = params.get('qr');
      
      if (kitchen === 'true') {
        setPendingAdminMode('kitchen');
      } else if (qrgen === 'true') {
        setPendingAdminMode('qr-generator');
      } else {
        setPendingAdminMode('admin');
      }
      
      if (isAdminAuthenticated) {
        setMode(pendingAdminMode || 'admin');
      } else {
        setMode('admin-login');
      }
    } else {
      setMode(selectedMode);
      if (selectedMode === 'customer') {
        setCustomerState('login');
      }
    }
  };

  const handleAdminLogin = async (username: string, password: string) => {
    setLoading(true);
    setAdminLoginError('');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setIsAdminAuthenticated(true);
      setMode(pendingAdminMode || 'admin');
      setPendingAdminMode(null);
    } else {
      setAdminLoginError('Invalid username or password');
    }
    
    setLoading(false);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setMode('home');
    setPendingAdminMode(null);
    setAdminLoginError('');
  };

  const handleAdminNavigate = (page: 'kitchen' | 'qr-generator' | 'admin' | 'tables' | 'menu') => {
    setMode(page);
  };

  const handleAdminHome = () => {
    setMode('home');
  };

  const handleTableLogin = async (tableNumber: string, mobileNumber: string) => {
    setLoading(true);
    try {
      const result = await apiService.initializeOrder(tableNumber, mobileNumber);
      setCurrentOrder(result.order);
      setUniqueCode(result.uniqueCode);
      setCustomerState('menu');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Failed to connect to table. Please check the table number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeEntry = async (code: string) => {
    setLoading(true);
    try {
      const order = await apiService.getOrderByCode(code);
      if (order) {
        setCurrentOrder(order);
        setUniqueCode(code);
        setCustomerState('menu');
      } else {
        alert('Invalid order code. Please check and try again.');
      }
    } catch (error) {
      console.error('Code entry failed:', error);
      alert('Failed to join order. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Home screen
  if (mode === 'home') {
    return <HomeScreen onModeSelect={handleModeSelect} />;
  }

  // Admin login screen
  if (mode === 'admin-login') {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setMode('home')}
            className="bg-white border rounded-lg px-3 py-2 text-sm shadow hover:bg-gray-50 transition-colors"
          >
            ← Home
          </button>
        </div>
        <AdminLogin 
          onLogin={handleAdminLogin} 
          loading={loading}
          error={adminLoginError}
        />
      </div>
    );
  }

  // Customer login screen
  if (mode === 'customer' && customerState === 'login') {
    return (
      <div>
        <TableLogin onLogin={handleTableLogin} loading={loading} />
        
        <div className="fixed bottom-4 left-4">
          <button
            onClick={() => setCustomerState('code-entry')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            Join Existing Order
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'customer' && customerState === 'code-entry') {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setMode('home')}
            className="bg-white border rounded-lg px-3 py-2 text-sm shadow hover:bg-gray-50 transition-colors"
          >
            ← Home
          </button>
        </div>
        <CodeEntry
          onSubmit={handleCodeEntry}
          onBack={() => setCustomerState('login')}
          loading={loading}
        />
      </div>
    );
  }

  if (mode === 'customer' && customerState === 'menu' && currentOrder) {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => {
              setMode('home');
              setCurrentOrder(null);
              setUniqueCode('');
              setCustomerState('login');
            }}
            className="bg-white border rounded-lg px-3 py-2 text-sm shadow hover:bg-gray-50 transition-colors"
          >
            ← Home
          </button>
        </div>
        <Menu order={currentOrder} uniqueCode={uniqueCode} />
      </div>
    );
  }

  if (mode === 'kitchen') {
    return (
      <div>
        <AdminNavigation
          currentPage="kitchen"
          onNavigate={handleAdminNavigate}
          onLogout={handleAdminLogout}
          onHome={handleAdminHome}
        />
        <KitchenDashboard />
      </div>
    );
  }

  if (mode === 'qr-generator') {
    return (
      <div>
        <AdminNavigation
          currentPage="qr-generator"
          onNavigate={handleAdminNavigate}
          onLogout={handleAdminLogout}
          onHome={handleAdminHome}
        />
        <QRGenerator />
      </div>
    );
  }

  if (mode === 'admin') {
    return (
      <div>
        <AdminNavigation
          currentPage="admin"
          onNavigate={handleAdminNavigate}
          onLogout={handleAdminLogout}
          onHome={handleAdminHome}
        />
        <AdminPanel />
      </div>
    );
  }

  if (mode === 'menu') {
    return (
      <div>
        <AdminNavigation
          currentPage="menu"
          onNavigate={handleAdminNavigate}
          onLogout={handleAdminLogout}
          onHome={handleAdminHome}
        />
        <AdminPanel />
      </div>
    );
  }

  if (mode === 'tables') {
    return (
      <div>
        <AdminNavigation
          currentPage="tables"
          onNavigate={handleAdminNavigate}
          onLogout={handleAdminLogout}
          onHome={handleAdminHome}
        />
        <TableManagement />
      </div>
    );
  }

  return <HomeScreen onModeSelect={handleModeSelect} />;
}

export default App;