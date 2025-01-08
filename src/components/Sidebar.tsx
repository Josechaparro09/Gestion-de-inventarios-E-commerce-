// src/components/Sidebar.tsx
import { Package2, List, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

interface SidebarProps {
  onSignOut: () => void;
}

export function Sidebar({ onSignOut }: SidebarProps) {
  const location = useLocation();
  
  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-teal-900 to-teal-800 text-white flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-teal-700">
        <img src="/images/Logo White.png" alt="Netxel" className="h-8" />
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <div className="px-3 py-2 text-sm text-teal-300 uppercase tracking-wider">
            Menu
          </div>
          
          <div className="space-y-1">
            <Link
              to="/products/add"
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                location.pathname === '/products/add'
                  ? 'bg-teal-700 text-white'
                  : 'text-teal-100 hover:bg-teal-800'
              )}
            >
              <Package2 className="w-5 h-5" />
              <span>Agregar producto</span>
            </Link>

            <Link
              to="/products/list"
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                location.pathname === '/products/list'
                  ? 'bg-teal-700 text-white'
                  : 'text-teal-100 hover:bg-teal-800'
              )}
            >
              <List className="w-5 h-5" />
              <span>Lista de productos</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-teal-700">
        <button
          onClick={onSignOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-teal-100 hover:bg-teal-800 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}