import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Download, Check, X, FileText } from "lucide-react";
import { useState } from "react";

export default function ApplicationDetails() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [reviewComments, setReviewComments] = useState("");
  const queryClient = useQueryClient();

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

  const { data: application, isLoading: applicationLoading } = useQuery({
    queryKey: ["/api/applications", id],
    retry: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, comments }: { status: string; comments?: string }) => {
      const response = await apiRequest("PATCH", `/api/applications/${id}/status`, {
        status,
        reviewComments: comments,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Status Updated",
        description: "Application status has been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (applicationLoading) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">Application not found</p>
              <Button
                onClick={() => setLocation("/dashboard")}
                className="mt-4"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "submitted": return "bg-blue-100 text-blue-800";
      case "under_review": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleApprove = () => {
    updateStatusMutation.mutate({
      status: "approved",
      comments: reviewComments,
    });
  };

  const handleReject = () => {
    updateStatusMutation.mutate({
      status: "rejected",
      comments: reviewComments,
    });
  };

  const handleDownloadDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="mr-4"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h2 className="text-xl font-semibold text-gray-900">
              Application Details - {application.id}
            </h2>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Application Status */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.licenseType.replace(/\b\w/g, (l: string) => l.toUpperCase())} License Application
                    </h3>
                    <p className="text-gray-600">Submitted on {new Date(application.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge className={getStatusColor(application.status)}>
                    {formatStatus(application.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Application Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Company:</span>
                    <span className="ml-2 text-gray-900">{application.companyName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Contact:</span>
                    <span className="ml-2 text-gray-900">{application.primaryContactName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-900">{application.email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <span className="ml-2 text-gray-900">{application.contactPhone}</span>
                  </div>
                  {application.businessRegistrationNumber && (
                    <div>
                      <span className="font-medium text-gray-700">Registration #:</span>
                      <span className="ml-2 text-gray-900">{application.businessRegistrationNumber}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Address Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Address:</span>
                    <div className="mt-1 text-gray-900">
                      {application.streetAddress}<br />
                      {application.city}, {application.state} {application.zipCode}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents */}
            {application.documents && application.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {application.documents.map((document: any) => (
                      <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <FileText className="text-red-500 text-2xl mr-3" />
                          <div className="flex-1">
                            <p className="font-medium">{document.originalName}</p>
                            <p className="text-sm text-gray-500">
                              {(parseInt(document.size) / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDownloadDocument(document.id)}
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Previous Experience */}
            {application.previousExperience && (
              <Card>
                <CardHeader>
                  <CardTitle>Previous Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-900">{application.previousExperience}</p>
                </CardContent>
              </Card>
            )}

            {/* Review Comments */}
            {application.reviewComments && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-900">{application.reviewComments}</p>
                  {application.reviewedAt && (
                    <p className="text-sm text-gray-500 mt-2">
                      Reviewed on {new Date(application.reviewedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Admin Review Section */}
            {user?.role === 'administrator' && (application.status === 'submitted' || application.status === 'under_review') && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Application</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Comments
                    </label>
                    <Textarea
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="Add your review comments here..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleReject}
                      variant="destructive"
                      disabled={updateStatusMutation.isPending}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={updateStatusMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
