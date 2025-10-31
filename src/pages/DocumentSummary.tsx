import { DollarSign, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DocumentSummary = () => {
  // Mock data - would come from backend
  const documentSummary = {
    title: "Residential Lease Agreement",
    summary: "This is a standard 12-month residential lease agreement for a two-bedroom apartment located at 123 Oak Street. The lease establishes a monthly rent of $2,400, requires a security deposit of $2,400, and includes standard tenant responsibilities for maintenance and utilities. The agreement contains several important clauses regarding lease termination, pet policies, and property modifications.",
    keyPoints: [
      { type: "obligation", text: "Monthly rent due on 1st of each month", icon: DollarSign },
      { type: "deadline", text: "30-day notice required for lease termination", icon: Clock },
      { type: "penalty", text: "Late fees of $50 after 5-day grace period", icon: AlertTriangle }
    ]
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Document Summary</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>{documentSummary.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Summary</h3>
              <p className="text-muted-foreground">{documentSummary.summary}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Key Points</h3>
              <div className="space-y-2">
                {documentSummary.keyPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                    <div className="mt-0.5">
                      {point.icon && <point.icon className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <p>{point.text}</p>
                      <p className="text-xs text-muted-foreground capitalize">{point.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentSummary;