import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, BarChart3, FileText, PlusCircle, ClipboardCheck, Database, FileBarChart, LogOut } from "lucide-react";

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path || location.startsWith(path);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const employerNavItems = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/applications", label: "My Applications", icon: FileText },
    { path: "/applications/new", label: "New Application", icon: PlusCircle },
  ];

  const adminNavItems = [
    { path: "/dashboard", label: "Admin Dashboard", icon: BarChart3 },
    { path: "/review-queue", label: "Review Queue", icon: ClipboardCheck },
    { path: "/applications", label: "All Applications", icon: Database },
    { path: "/reports", label: "Reports", icon: FileBarChart },
  ];

  const navItems = user?.role === 'administrator' ? adminNavItems : employerNavItems;

  return (
    <div className="w-64 bg-slate-800 text-white flex-shrink-0 hidden lg:block">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center mb-8">
          <Shield className="text-2xl mr-3" />
          <div>
            <h1 className="text-lg font-semibold">ALMS</h1>
            <p className="text-xs text-gray-300">License Management</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* User Profile & Logout */}
      <div className="absolute bottom-0 w-64 p-6 border-t border-gray-600">
        <div className="flex items-center mb-4">
          <div 
            className="w-10 h-10 bg-gray-500 rounded-full mr-3 bg-cover bg-center"
            style={{
              backgroundImage: user?.profileImageUrl ? `url(${user.profileImageUrl})` : undefined
            }}
          />
          <div>
            <p className="font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-300 capitalize">
              {user?.role || 'User'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
