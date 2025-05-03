
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Package, ShoppingBag, Home, BarChart2, Settings, Users, LogOut, ChevronRight 
} from 'lucide-react';

interface VendorLayoutProps {
  children: React.ReactNode;
}

const VendorLayout: React.FC<VendorLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  const navigationItems = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/vendor/dashboard' },
    { icon: <Package size={20} />, label: 'Produtos', path: '/vendor/products/list' },
    { icon: <ShoppingBag size={20} />, label: 'Pedidos', path: '/vendor/orders' },
    { icon: <BarChart2 size={20} />, label: 'Relatórios', path: '/vendor/reports' },
    { icon: <Users size={20} />, label: 'Clientes', path: '/vendor/customers' },
    { icon: <Settings size={20} />, label: 'Configurações', path: '/vendor/settings' },
  ];
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg text-construPro-blue">Painel do Vendedor</h2>
        </div>
        <nav className="flex-1 pt-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm ${
                    isActive(item.path)
                      ? 'bg-construPro-blue text-white font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                  {isActive(item.path) && <ChevronRight size={16} className="ml-auto" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t">
          <Link
            to="/logout"
            className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
          >
            <LogOut size={18} className="mr-3" />
            Sair
          </Link>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default VendorLayout;
