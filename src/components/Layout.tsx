import React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "./ui/button";

const Layout: React.FC = () => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <img src="/Logo_BMKG.png" alt="BMKG Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">SKPG Tools DIY</h1>
                  <p className="text-sm text-muted-foreground">
                    Identifikasi Anomali Iklim dalam SKPG
                  </p>
                </div>
              </Link>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              
              <div className="relative group">
                <button className={`px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  (location.pathname === '/kabupaten' || location.pathname === '/kecamatan') 
                    ? 'bg-primary text-primary-foreground' 
                    : ''
                }`}>
                  Input Data ▾
                </button>
                <div className="absolute left-0 mt-1 w-40 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <a 
                    href="/kabupaten"
                    className="block px-4 py-2 text-sm hover:bg-accent rounded-t-md"
                  >
                    Kabupaten
                  </a>
                  <a 
                    href="/kecamatan"
                    className="block px-4 py-2 text-sm hover:bg-accent rounded-b-md"
                  >
                    Kecamatan
                  </a>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <Outlet />
    </div>
  );
};

export default Layout;
