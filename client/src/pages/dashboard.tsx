import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import StatsCard from "@/components/stats-card";
import ApplicationTable from "@/components/application-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, List, FileText, Clock, CheckCircle, XCircle } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    retry: false,
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/applications"],
    retry: false,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleCreateNew = () => {
    setLocation("/applications/new");
  };

  const recentApplications = applications?.slice(0, 5) || [];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Employer Dashboard</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.firstName} {user.lastName}
              </span>
              <div 
                className="w-8 h-8 bg-gray-300 rounded-full bg-cover bg-center"
                style={{
                  backgroundImage: user.profileImageUrl ? `url(${user.profileImageUrl})` : undefined
                }}
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Applications"
                value={stats?.total || 0}
                icon={FileText}
                color="blue"
                loading={statsLoading}
              />
              <StatsCard
                title="Pending Review"
                value={stats?.pending || 0}
                icon={Clock}
                color="yellow"
                loading={statsLoading}
              />
              <StatsCard
                title="Approved"
                value={stats?.approved || 0}
                icon={CheckCircle}
                color="green"
                loading={statsLoading}
              />
              <StatsCard
                title="Rejected"
                value={stats?.rejected || 0}
                icon={XCircle}
                color="red"
                loading={statsLoading}
              />
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={handleCreateNew}
                    className="flex items-center justify-center h-16 bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusCircle className="mr-3 h-5 w-5" />
                    Create New Application
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setLocation("/applications")}
                    className="flex items-center justify-center h-16"
                  >
                    <List className="mr-3 h-5 w-5" />
                    View My Applications
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Applications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <ApplicationTable 
                  applications={recentApplications}
                  loading={applicationsLoading}
                  isEmployer={true}
                />
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
}
