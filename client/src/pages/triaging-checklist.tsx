import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Save, Check } from "lucide-react";

const triagingChecklistSchema = z.object({
  // Section 1 - Decision Fields
  dateOfDecision: z.string().optional(),
  decision: z.string().optional(),
  preparedBy: z.string().optional(),
  jobTitle: z.string().optional(),
  
  // Section 2 - Employer Information
  employerLegalName: z.string().optional(),
  employerTradeName: z.string().optional(),
  employerId: z.string().optional(),
  activeStatus: z.boolean().optional(),
  accountCoverage: z.string().optional(),
  firmType: z.string().optional(),
  employerStartDate: z.string().optional(),
  classificationUnits: z.string().optional(),
  employerCuStartDate: z.string().optional(),
  overdueBalance: z.string().optional(),
  currentAccountBalance: z.string().optional(),
  
  // Section 3 - Review Checklist
  bcCompanySummary: z.boolean().optional(),
  isApplicantInScope: z.boolean().optional(),
  classificationUnitRelated: z.boolean().optional(),
  reviewAmountsOwing: z.boolean().optional(),
  reviewNumberOfWorkers: z.boolean().optional(),
  reviewCertifiedWorkers: z.boolean().optional(),
  latScreenCapture: z.boolean().optional(),
  reviewLatEscalation: z.boolean().optional(),
  reviewInjunctionViolations: z.boolean().optional(),
  reviewReferralsFromPfs: z.boolean().optional(),
  reviewRenewalsConsistency: z.boolean().optional(),
  reviewAssociatedFirms: z.boolean().optional(),
  hasNophInformation: z.boolean().optional(),
  transportAcms: z.boolean().optional(),
});

type TriagingChecklistFormData = z.infer<typeof triagingChecklistSchema>;

export default function TriagingChecklist() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const queryClient = useQueryClient();

  // Redirect if not authenticated or not admin
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
    
    if (!isLoading && user && user.role !== 'administrator') {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: application, isLoading: applicationLoading } = useQuery({
    queryKey: ["/api/applications", id],
    retry: false,
  });

  const { data: existingChecklist } = useQuery({
    queryKey: ["/api/triaging-checklist", id],
    retry: false,
  });

  const form = useForm<TriagingChecklistFormData>({
    resolver: zodResolver(triagingChecklistSchema),
    defaultValues: existingChecklist || {},
  });

  const saveChecklistMutation = useMutation({
    mutationFn: async (data: TriagingChecklistFormData) => {
      const response = await apiRequest("POST", `/api/applications/${id}/triaging-checklist`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/triaging-checklist", id] });
      toast({
        title: "Checklist Saved",
        description: "Triaging checklist has been saved successfully.",
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
        description: "Failed to save checklist. Please try again.",
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

  if (user.role !== 'administrator') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You do not have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = (data: TriagingChecklistFormData) => {
    saveChecklistMutation.mutate(data);
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
              onClick={() => setLocation(`/applications/${id}`)}
              className="mr-4"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Application
            </Button>
            <h2 className="text-xl font-semibold text-gray-900">Application Triaging Checklist</h2>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Application Info */}
            {application && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Application Reference: {application.applicationRefNumber}
                  </h3>
                  <p className="text-gray-600">
                    Application Type: {application.applicationType?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </p>
                </CardContent>
              </Card>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Section 1 - Decision Fields */}
                <Card>
                  <CardHeader>
                    <CardTitle>Section 1 - Decision Fields</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateOfDecision"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Decision</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="decision"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Decision</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter decision" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="preparedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prepared By</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter job title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Section 2 - Employer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Section 2 - Employer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="employerLegalName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employer Legal Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter legal name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="employerTradeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employer Trade Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter trade name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="employerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employer ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter employer ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="activeStatus"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-8">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Active Status</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="accountCoverage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Coverage</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter account coverage" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="firmType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Firm Type</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter firm type" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="employerStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employer Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="employerCuStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employer-CU Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="overdueBalance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Overdue Balance</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter overdue balance" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="currentAccountBalance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Account Balance</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter current balance" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="classificationUnits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Classification Unit(s)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter classification units" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Section 3 - Review Checklist */}
                <Card>
                  <CardHeader>
                    <CardTitle>Section 3 - Review Checklist</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: "bcCompanySummary", label: "BC Company Summary" },
                        { name: "isApplicantInScope", label: "Is applicant in scope?" },
                        { name: "classificationUnitRelated", label: "Classification unit (CU) related to scope of asbestos work" },
                        { name: "reviewAmountsOwing", label: "Review Amounts owing/Overdue balance/Payment plan information/Collection Department legal action" },
                        { name: "reviewNumberOfWorkers", label: "Review number of workers employed" },
                        { name: "reviewCertifiedWorkers", label: "Review certified workers provided/verified" },
                        { name: "latScreenCapture", label: "LAT (screen capture)" },
                        { name: "reviewLatEscalation", label: "Review LAT for possible escalation" },
                        { name: "reviewInjunctionViolations", label: "Review Injunction violation/s" },
                        { name: "reviewReferralsFromPfs", label: "Review Referrals from PFS" },
                        { name: "reviewRenewalsConsistency", label: "Review renewals for consistency with previous application" },
                        { name: "reviewAssociatedFirms", label: "Review associated firms/persons information (if applicable)" },
                        { name: "hasNophInformation", label: "Has NOP-Hazard (NOPH) information" },
                        { name: "transportAcms", label: "Transport ACMS" },
                      ].map((item) => (
                        <FormField
                          key={item.name}
                          control={form.control}
                          name={item.name as keyof TriagingChecklistFormData}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value as boolean}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm leading-5">
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-end">
                      <Button
                        type="submit"
                        disabled={saveChecklistMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Checklist
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </form>
            </Form>

          </div>
        </main>
      </div>
    </div>
  );
}