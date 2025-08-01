import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import FileUpload from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Save, Send } from "lucide-react";

const applicationSchema = z.object({
  applicationType: z.enum(["new_application", "renewal_application"], {
    required_error: "Please select an application type",
  }),
  numberOfWorkers: z.string().min(1, "Number of workers is required"),
  numberOfCertifiedWorkers: z.string().min(1, "Number of certified workers is required"),
  ownerContactInfo: z.string().min(1, "Owner contact information is required"),
  asbestosServicesDescription: z.string().min(1, "Description of asbestos services is required"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function ApplicationForm() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
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

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      numberOfWorkers: "",
      numberOfCertifiedWorkers: "",
      ownerContactInfo: "",
      asbestosServicesDescription: "",
      agreeToTerms: false,
    },
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (data: Omit<ApplicationFormData, "agreeToTerms">) => {
      const response = await apiRequest("POST", "/api/applications", data);
      return response.json();
    },
    onSuccess: async (application) => {
      // Upload documents if any
      if (uploadedFiles.length > 0) {
        const formData = new FormData();
        uploadedFiles.forEach((file) => {
          formData.append("documents", file);
        });
        formData.append("documentType", "supporting");

        await apiRequest("POST", `/api/applications/${application.id}/documents`, formData);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Application Submitted",
        description: `Your application has been submitted for review. Reference Number: ${application.applicationRefNumber}`,
      });
      setLocation("/dashboard");
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
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: Omit<ApplicationFormData, "agreeToTerms">) => {
      const response = await apiRequest("POST", "/api/applications", { 
        ...data, 
        status: "draft" 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Draft Saved",
        description: "Your application has been saved as a draft.",
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
        description: "Failed to save draft. Please try again.",
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

  const onSubmit = (data: ApplicationFormData) => {
    const { agreeToTerms, ...applicationData } = data;
    createApplicationMutation.mutate(applicationData);
  };

  const onSaveDraft = () => {
    const data = form.getValues();
    const { agreeToTerms, ...applicationData } = data;
    saveDraftMutation.mutate(applicationData);
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
              Back to Dashboard
            </Button>
            <h2 className="text-xl font-semibold text-gray-900">New Asbestos License Application</h2>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Form Header */}
            <Card>
              <CardContent className="p-6">
                <nav className="flex mb-2" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-4">
                    <li><a href="/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</a></li>
                    <li><span className="text-gray-400">/</span></li>
                    <li className="text-gray-900">New Application</li>
                  </ol>
                </nav>
                <h2 className="text-2xl font-bold text-gray-900">Asbestos License Application</h2>
                <p className="text-gray-600 mt-1">Complete all required fields to submit your application for review.</p>
              </CardContent>
            </Card>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Application Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Application Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="applicationType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Select Application Type *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="new_application" id="new_application" />
                                <label htmlFor="new_application" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  New Application
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="renewal_application" id="renewal_application" />
                                <label htmlFor="renewal_application" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  Renewal Application
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Workforce Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Workforce Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="numberOfWorkers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Workers at the Firm *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Enter number of workers" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="numberOfCertifiedWorkers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Workers with Asbestos Abatement Certificates *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Enter number of certified workers" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Owner Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="ownerContactInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Contact Information *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Include name, phone number, email address, and mailing address" 
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Services Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Services Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="asbestosServicesDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description of Asbestos Services Provided *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide a detailed description of the asbestos-related services your firm provides (e.g., inspection, abatement, removal, etc.)" 
                              rows={6}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Document Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle>Supporting Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload any supporting documents such as insurance certificates, training records, or other relevant documentation.
                    </p>
                    <FileUpload
                      onFilesChange={setUploadedFiles}
                      accept=".pdf,.doc,.docx"
                      maxSize={10 * 1024 * 1024}
                    />
                  </CardContent>
                </Card>

                {/* Terms and Conditions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Terms and Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="agreeToTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the terms and conditions *
                            </FormLabel>
                            <p className="text-sm text-gray-600">
                              By checking this box, I certify that all information provided is true and accurate to the best of my knowledge. 
                              I understand that providing false information may result in the denial of this application.
                            </p>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onSaveDraft}
                        disabled={saveDraftMutation.isPending}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save as Draft
                      </Button>
                      <Button
                        type="submit"
                        disabled={createApplicationMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Submit Application
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