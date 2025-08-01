import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, CheckCircle, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">ALMS</h1>
                <p className="text-sm text-gray-600">Asbestos License Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/api/login"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Admin Sign In
              </a>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Streamlined Asbestos License Management
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Submit, track, and manage asbestos license applications with our comprehensive digital platform. 
            Designed for employers and regulatory administrators.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <FileText className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Easy Application Submission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Submit license applications with our intuitive form system. Upload required documents 
                and track your application status in real-time.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Efficient Review Process</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Administrators can review applications efficiently with our streamlined workflow, 
                complete with document viewing and status management tools.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Secure, role-based access ensures employers can manage their applications while 
                administrators have oversight of the entire system.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-gray-600 mb-6">
            Sign in to submit your asbestos license application or manage existing applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Employer Sign In
            </Button>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              size="lg"
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Administrator Sign In
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-300">
              © 2024 Asbestos License Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
