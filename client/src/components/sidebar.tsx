import { useAuth } from "@/hooks/useAuth";
import { Shield, FileText, BarChart3, Settings, LogOut, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const userRole = (user as any)?.role || 'employer';

  const employerNavItems = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/applications/new", label: "New Application", icon: FileText },
  ];

  const adminNavItems = [
    { path: "/admin", label: "Admin Dashboard", icon: Users },
    { path: "/dashboard", label: "Applications", icon: FileText },
  ];

  const navItems = userRole === 'administrator' ? adminNavItems : employerNavItems;

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">ALMS</h1>
            <p className="text-sm text-gray-600">Asbestos License Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            {(user as any)?.profileImageUrl ? (
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={(user as any).profileImageUrl}
                alt="Profile"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            )}
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {(user as any)?.firstName && (user as any)?.lastName
                ? `${(user as any).firstName} ${(user as any).lastName}`
                : (user as any)?.email || 'User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {(user as any)?.role || 'Employer'}
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => window.location.href = '/api/logout'}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}