import { FileText, Shield, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Document Analysis Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Document Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>View a comprehensive summary of your legal document, including key points, obligations, deadlines, and penalties.</p>
            <Button asChild>
              <Link to="/document-summary">View Summary</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Risk Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Examine potential risks in your document, including red flags, risk scores, and suggested actions to mitigate issues.</p>
            <Button asChild>
              <Link to="/risk-analysis">View Analysis</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <span>Export Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Export your analysis in various formats for sharing or record-keeping.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link to="/export">Export Analysis</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;