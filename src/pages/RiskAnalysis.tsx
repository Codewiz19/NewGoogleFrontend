import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  ChevronDown,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RiskGauge from "@/components/dashboard/RiskGauge";
// Note: We're using our own simple PDF implementation instead of react-pdf

const RiskAnalysis = () => {
  const [expandedFlags, setExpandedFlags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const riskScore = 65;

  const redFlags = [
    {
      id: "unilateral-termination",
      severity: "high",
      title: "Unilateral Termination Rights",
      originalText: "The Landlord may terminate this lease at any time with thirty (30) days written notice for any reason or no reason whatsoever, regardless of tenant compliance with lease terms.",
      explanation: "This clause gives the landlord excessive power to end your tenancy without cause, providing little security of tenure.",
      whyRisky: [
        "No protection against arbitrary eviction",
        "Landlord doesn't need cause to terminate",
        "Creates housing insecurity for tenant"
      ],
      suggestedAction: "Negotiate for mutual termination rights or require 'just cause' for landlord termination",
      pageNumber: 3
    },
    {
      id: "excessive-fees",
      severity: "medium",
      title: "Excessive Administrative Fees",
      originalText: "Tenant agrees to pay a $200 administrative fee for any lease modifications, $150 for late rent processing, and $100 for any maintenance requests deemed non-essential by Landlord.",
      explanation: "These fees are unusually high and give the landlord discretionary power over what constitutes 'essential' maintenance.",
      whyRisky: [
        "Fees significantly above market standard",
        "Subjective criteria for maintenance fees",
        "Could discourage legitimate maintenance requests"
      ],
      suggestedAction: "Request fee schedule aligned with local standards and clear maintenance criteria",
      pageNumber: 7
    },
    {
      id: "broad-liability",
      severity: "medium",
      title: "Broad Tenant Liability Waiver",
      originalText: "Tenant waives all claims against Landlord for any injuries, damages, or losses occurring on the premises, including but not limited to those caused by Landlord's negligence.",
      explanation: "This waiver attempts to protect the landlord even from their own negligent actions, which may not be legally enforceable.",
      whyRisky: [
        "Attempts to waive landlord's basic legal responsibilities",
        "May not be legally enforceable",
        "Shifts inappropriate risk to tenant"
      ],
      suggestedAction: "Limit waiver to exclude landlord negligence and maintain basic safety obligations",
      pageNumber: 12
    }
  ];

  const toggleFlag = (flagId: string) => {
    setExpandedFlags(prev => 
      prev.includes(flagId) 
        ? prev.filter(id => id !== flagId)
        : [...prev, flagId]
    );
    
    // Set page number to the page where the risk is located
    const flag = redFlags.find(f => f.id === flagId);
    if (flag) {
      setCurrentPage(flag.pageNumber);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'risk-high';
      case 'medium': return 'risk-medium';
      case 'low': return 'risk-low';
      default: return 'muted-foreground';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-risk-high/20';
      case 'medium': return 'bg-risk-medium/20';
      case 'low': return 'bg-risk-low/20';
      default: return 'bg-muted';
    }
  };

  // Get the active flag for the current page
  const getActiveFlag = () => {
    return redFlags.find(flag => 
      expandedFlags.includes(flag.id) && 
      flag.pageNumber === currentPage
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Risk Analysis</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Risk score and red flags */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Score</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <RiskGauge value={riskScore} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-risk-high" />
                <span>Red Flags</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {redFlags.map((flag) => (
                  <div 
                    key={flag.id}
                    className={`border rounded-lg overflow-hidden ${getSeverityBg(flag.severity)}`}
                  >
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer"
                      onClick={() => toggleFlag(flag.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-${getSeverityColor(flag.severity)} font-medium`}>
                          {flag.title}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-background">
                          Page {flag.pageNumber}
                        </span>
                      </div>
                      {expandedFlags.includes(flag.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </div>
                    
                    <AnimatePresence>
                      {expandedFlags.includes(flag.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t bg-background"
                        >
                          <div className="p-3 space-y-3">
                            <div>
                              <h4 className="text-sm font-medium">Explanation:</h4>
                              <p className="text-sm">{flag.explanation}</p>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium">Why This Is Risky:</h4>
                              <ul className="text-sm list-disc pl-5">
                                {flag.whyRisky.map((reason, idx) => (
                                  <li key={idx}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium">Suggested Action:</h4>
                              <p className="text-sm">{flag.suggestedAction}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: PDF Viewer */}
        <Card>
          <CardHeader>
            <CardTitle>Document View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                  className="p-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, 13))}
                  disabled={currentPage >= 13}
                  className="p-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
                >
                  <ChevronRightIcon size={16} />
                </button>
              </div>
              <div className="flex items-center">
                <span className="mr-2">Page {currentPage} of 13</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setZoom(prev => Math.max(prev - 10, 50))}
                    className="p-2 bg-secondary text-secondary-foreground rounded-md"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button 
                    onClick={() => setZoom(prev => Math.min(prev + 10, 200))}
                    className="p-2 bg-secondary text-secondary-foreground rounded-md"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-muted/20 relative min-h-[600px] flex justify-center">
              {/* Mock PDF page with highlighted text */}
              <div 
                className="bg-white shadow-md rounded"
                style={{ 
                  width: `${zoom * 6}px`, 
                  height: `${zoom * 8}px`, 
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Page content */}
                <div className="p-8 text-sm" style={{ fontSize: `${zoom/100 * 0.875}rem` }}>
                  {currentPage === 3 && (
                    <>
                      <p className="mb-4">3. TERMINATION.</p>
                      <p className={expandedFlags.includes("unilateral-termination") ? "bg-red-200 border-2 border-red-500 p-1" : ""}>
                        The Landlord may terminate this lease at any time with thirty (30) days written
                        notice for any reason or no reason whatsoever, regardless of tenant compliance with lease terms.
                      </p>
                      <p className="mt-4">4. DAMAGE DEPOSIT. Upon the due execution of this Agreement, Tenant shall deposit with Landlord
                      the sum of TWO THOUSAND DOLLARS ($2,000.00) receipt of which is hereby acknowledged by
                      Landlord, as security for any damage caused to the Premises during the term hereof. Such deposit
                      shall be returned to Tenant, without interest, and less any set off for damages to the Premises
                      upon the termination of this Agreement.</p>
                    </>
                  )}
                  
                  {currentPage === 7 && (
                    <>
                      <p className="mb-4">13. ADMINISTRATIVE FEES.</p>
                      <p className={expandedFlags.includes("excessive-fees") ? "bg-red-200 border-2 border-red-500 p-1" : ""}>
                        Tenant agrees to pay a $200 administrative fee for any lease
                        modifications, $150 for late rent processing, and $100 for any maintenance requests deemed
                        non-essential by Landlord.
                      </p>
                      <p className="mt-4">14. DAMAGE TO PREMISES. In the event the Premises are destroyed or rendered wholly
                      uninhabitable by fire, storm, earthquake, or other casualty not caused by the negligence of
                      Tenant, this Agreement shall terminate from such time except for the purpose of enforcing rights
                      that may have then accrued hereunder.</p>
                    </>
                  )}
                  
                  {currentPage === 12 && (
                    <>
                      <p className="mb-4">22. LIABILITY WAIVER.</p>
                      <p className={expandedFlags.includes("broad-liability") ? "bg-red-200 border-2 border-red-500 p-1" : ""}>
                        Tenant waives all claims against Landlord for any injuries, damages, or
                        losses occurring on the premises, including but not limited to those caused by Landlord's
                        negligence.
                      </p>
                      <p className="mt-4">23. DEFAULT. If Tenant fails to comply with any of the material provisions of this Agreement,
                      other than the covenant to pay rent, or of any present rules and regulations or any that may be
                      hereafter prescribed by Landlord, or materially fails to comply with any duties imposed on Tenant
                      by statute, within seven (7) days after delivery of written notice by Landlord specifying the
                      non-compliance and indicating the intention of Landlord to terminate the Lease by reason thereof,
                      Landlord may terminate this Agreement.</p>
                    </>
                  )}
                  
                  {![3, 7, 12].includes(currentPage) && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">Page {currentPage} content</p>
                      {getActiveFlag() && (
                        <div className="absolute top-0 left-0 right-0 p-4 bg-yellow-100 border-b border-yellow-300">
                          <p className="text-sm text-yellow-800">
                            No risk flags on this page. Navigate to page {getActiveFlag().pageNumber} to see highlighted text.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiskAnalysis;