import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Document, Page, pdfjs } from 'react-pdf';
// CSS files for react-pdf are included automatically in v10, but if needed:
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
// import 'react-pdf/dist/esm/Page/TextLayer.css';
import UploadRequired from "@/components/UploadRequired";
import { 
  AlertTriangle, 
  ChevronDown,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Loader
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RiskGauge from "@/components/dashboard/RiskGauge";
import { getCachedDocument, getCachedRisks, updateCachedDocument, getCurrentDocId } from "@/lib/documentCache";
import API from "@/lib/api";

// Set up PDF.js worker - use local copy from public folder to avoid CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Component to highlight text on PDF using text layer matching
interface PdfHighlightsProps {
  risks: Array<{
    highlightStart?: number;
    highlightEnd?: number;
    pageText?: string;
    severity?: string;
  }>;
  pageNumber: number;
}

const PdfHighlights = ({ risks, pageNumber }: PdfHighlightsProps) => {
  const [highlights, setHighlights] = useState<Array<{ top: number; left: number; width: number; height: number; severity: string }>>([]);

  useEffect(() => {
    if (risks.length === 0) {
      setHighlights([]);
      return;
    }

    // Wait for text layer to render - try multiple times
    let attempts = 0;
    const maxAttempts = 10;
    
    const findHighlights = () => {
      attempts++;
      
      // Try to find text layer - react-pdf uses this structure
      // Find the page element by searching for the Page component with matching page number
      const allPages = document.querySelectorAll('.react-pdf__Page');
      let pageElement: HTMLElement | null = null;
      
      // Find page by checking canvas or text content for page number match
      // Since react-pdf doesn't always set data-page-number, we find by position
      // We'll use the page that's currently rendered (should be only one visible)
      for (const page of allPages) {
        const canvas = page.querySelector('canvas');
        if (canvas || page.querySelector('.react-pdf__Page__textContent')) {
          pageElement = page as HTMLElement;
          break; // Use first found page (should be the current one)
        }
      }
      
      const textLayer = pageElement?.querySelector('.react-pdf__Page__textContent') as HTMLElement;
      
      if (!textLayer || textLayer.querySelectorAll('span').length === 0) {
        if (attempts < maxAttempts) {
          setTimeout(findHighlights, 200);
        }
        return;
      }

      const textSpans = Array.from(textLayer.querySelectorAll('span'));
      if (textSpans.length === 0) {
        if (attempts < maxAttempts) {
          setTimeout(findHighlights, 200);
        }
        return;
      }

      // Build full page text from text layer for matching
      const fullPageText = textSpans.map(span => span.textContent || '').join('');
      
      // Find highlights for each risk
      const newHighlights: Array<{ top: number; left: number; width: number; height: number; severity: string }> = [];
      
      risks.forEach(risk => {
        if (!risk.pageText || risk.highlightStart === undefined || risk.highlightEnd === undefined) {
          return;
        }

        // Get the text snippet we want to highlight
        const highlightText = risk.pageText.substring(risk.highlightStart, risk.highlightEnd).trim();
        if (!highlightText || highlightText.length < 10) return; // Skip very short highlights

        // Try to find this text in the PDF text layer
        // Use a fuzzy match since text might differ slightly
        const searchText = highlightText.substring(0, Math.min(50, highlightText.length));
        let foundIndex = fullPageText.toLowerCase().indexOf(searchText.toLowerCase());
        
        if (foundIndex === -1) {
          // Try with shorter search text
          const shortText = highlightText.substring(0, Math.min(20, highlightText.length));
          foundIndex = fullPageText.toLowerCase().indexOf(shortText.toLowerCase());
        }

        if (foundIndex === -1) return; // Couldn't find text

        // Find the spans that contain this text
        let currentPos = 0;
        let startSpan: HTMLElement | null = null;
        let endSpan: HTMLElement | null = null;
        const endPos = foundIndex + highlightText.length;

        for (let i = 0; i < textSpans.length; i++) {
          const span = textSpans[i] as HTMLElement;
          const spanText = span.textContent || '';
          const spanStart = currentPos;
          const spanEnd = currentPos + spanText.length;

          // Check if highlight starts in this span
          if (!startSpan && foundIndex >= spanStart && foundIndex < spanEnd) {
            startSpan = span;
          }

          // Check if highlight ends in this span
          if (endPos > spanStart && endPos <= spanEnd) {
            endSpan = span;
            break;
          }

          currentPos += spanText.length;
        }

        // If we found matching spans, create highlight overlay
        if (startSpan && endSpan) {
          const startRect = startSpan.getBoundingClientRect();
          const endRect = endSpan.getBoundingClientRect();
          const containerRect = pageElement.getBoundingClientRect();

          // Find all spans between start and end to calculate proper bounds
          let foundStart = false;
          let minLeft = startRect.left;
          let maxRight = endRect.right;
          let minTop = startRect.top;
          let maxBottom = endRect.bottom;

          for (const span of textSpans) {
            if (span === startSpan) {
              foundStart = true;
            }
            if (foundStart) {
              const spanRect = (span as HTMLElement).getBoundingClientRect();
              minLeft = Math.min(minLeft, spanRect.left);
              maxRight = Math.max(maxRight, spanRect.right);
              minTop = Math.min(minTop, spanRect.top);
              maxBottom = Math.max(maxBottom, spanRect.bottom);
            }
            if (span === endSpan) {
              break;
            }
          }

          const top = minTop - containerRect.top;
          const left = minLeft - containerRect.left;
          const width = maxRight - minLeft;
          const height = maxBottom - minTop;

          newHighlights.push({
            top,
            left,
            width,
            height,
            severity: risk.severity || 'medium'
          });
        }
      });

      setHighlights(newHighlights);
    };

    // Start searching after a short delay
    const timeoutId = setTimeout(findHighlights, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [risks, pageNumber]);

  if (highlights.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {highlights.map((highlight, index) => (
        <div
          key={index}
          className={`absolute ${
            highlight.severity === 'high' 
              ? 'bg-red-300/60' 
              : 'bg-yellow-300/60'
          } rounded-sm transition-opacity`}
          style={{
            top: `${highlight.top}px`,
            left: `${highlight.left}px`,
            width: `${highlight.width}px`,
            height: `${highlight.height}px`,
          }}
        />
      ))}
    </div>
  );
};

const RiskAnalysis = () => {
  const { doc_id: paramDocId } = useParams<{ doc_id?: string }>();
  const navigate = useNavigate();
  // Use doc_id from params or get from cache
  const cachedDocId = getCurrentDocId();
  const doc_id = paramDocId || cachedDocId;
  const [risks, setRisks] = useState<any[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedFlags, setExpandedFlags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    const fetchRisks = async () => {
      if (!doc_id) {
        setLoading(false);
        return;
      }

      // Check cache first
      const cachedRisks = getCachedRisks(doc_id);
      if (cachedRisks && cachedRisks.length > 0) {
        setRisks(cachedRisks);
        calculateRiskScore(cachedRisks);
        // Fetch PDF as blob
        if (doc_id) {
          fetchPdfAsBlob(doc_id);
        }
        setLoading(false);
        return;
      }

      // Fetch from API if not in cache
      try {
        setLoading(true);
        const response = await fetch(API.getDocument(doc_id));
        
        if (response.ok) {
          const documentData = await response.json();
          if (documentData.risks && Array.isArray(documentData.risks)) {
            setRisks(documentData.risks);
            calculateRiskScore(documentData.risks);
            // Cache the risks
            updateCachedDocument(doc_id, {
              risks: documentData.risks,
              risks_generated_at: documentData.risks_generated_at
            });
          }
          
          // Fetch PDF as blob if available
          if (doc_id) {
            fetchPdfAsBlob(doc_id);
          }
        }
      } catch (error) {
        console.error("Error fetching risks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRisks();
  }, [doc_id]);

  const fetchPdfAsBlob = async (docId: string) => {
    try {
      setPdfLoading(true);
      const response = await fetch(API.getDocumentPdf(docId));
      
      if (!response.ok) {
        let errorText = '';
        try {
          const errorData = await response.json();
          errorText = errorData.detail || JSON.stringify(errorData);
        } catch {
          errorText = await response.text();
        }
        console.error("PDF fetch failed:", response.status, errorText);
        
        // Check if it's a doc_id not found error
        if (response.status === 404 && errorText.includes("not found")) {
          console.warn("Document not found in backend. Server may have restarted. Please re-upload the document.");
        }
        
        setPdfLoading(false);
        return;
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlob(blob);
      setPdfUrl(blobUrl);
      setPdfLoading(false);
      console.log("PDF fetched successfully as blob");
    } catch (error) {
      console.error("Error fetching PDF:", error);
      setPdfLoading(false);
    }
  };

  const calculateRiskScore = (riskArray: any[]) => {
    if (!riskArray || riskArray.length === 0) {
      setRiskScore(0);
      return;
    }
    
    const totalScore = riskArray.reduce((sum, risk) => {
      return sum + (risk.severity_score || 0);
    }, 0);
    
    const avgScore = Math.min(100, Math.round(totalScore / riskArray.length));
    setRiskScore(avgScore);
  };

  // Redirect to URL with doc_id if we have cached doc_id but no param
  useEffect(() => {
    if (cachedDocId && !paramDocId) {
      navigate(`/risk-analysis/${cachedDocId}`, { replace: true });
    }
  }, [cachedDocId, paramDocId, navigate]);

  if (!doc_id) {
    return <UploadRequired message="Please upload a document first to view the risk analysis." />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background neural-bg flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-neon-blue animate-spin mx-auto mb-4" />
          <p className="font-rajdhani text-xl text-muted-foreground">Loading risk analysis...</p>
        </div>
      </div>
    );
  }

  // Filter out Low risks - only show Medium and High
  const filteredRisks = risks.filter(risk => {
    const severity = risk.severity_level?.toLowerCase() || 'medium';
    return severity === 'medium' || severity === 'high';
  });

  // Get all unique page numbers from filtered risks
  const allPageNumbers = filteredRisks.length > 0 
    ? [...new Set(filteredRisks.map(r => r.page_number || 1).filter(p => p > 0))]
    : [1];
  const maxPage = allPageNumbers.length > 0 ? Math.max(...allPageNumbers) : 1;

  // Convert risks to redFlags format for display
  const redFlags = filteredRisks.length > 0 ? filteredRisks.map((risk, index) => {
    // Clean up label - use short_risk first, then clean label (remove duplicates)
    let cleanLabel = risk.short_risk || risk.label || `Risk ${index + 1}`;
    if (cleanLabel.includes(' ; ')) {
      // Remove duplicate segments
      const parts = cleanLabel.split(' ; ').filter((part, idx, arr) => arr.indexOf(part) === idx);
      cleanLabel = parts[0]; // Use first unique part as title
    }
    
    // Get recommendations as array - use actual data from backend
    let recommendations: string[] = [];
    if (Array.isArray(risk.recommendations)) {
      recommendations = risk.recommendations.filter(rec => rec && rec.trim());
    } else if (risk.recommendations && typeof risk.recommendations === 'string') {
      recommendations = [risk.recommendations];
    }
    
    // Use actual explanation from backend, or derive from recommendations
    let explanation = '';
    if (risk.explanation && risk.explanation.trim() && 
        risk.explanation !== 'Risk identified in document') {
      explanation = risk.explanation;
    } else if (recommendations.length > 0) {
      // If no explanation but we have recommendations, use first recommendation as context
      explanation = `This clause requires attention: ${recommendations[0]}`;
    } else if (cleanLabel) {
      explanation = `Risk identified: ${cleanLabel}`;
    }
    
    // Use real recommendations, or provide minimal fallback only if absolutely nothing exists
    const whyRisky = recommendations.length > 0 
      ? recommendations 
      : (explanation ? [explanation] : ['This clause requires review']);
    
    // Use first recommendation as suggested action, or explanation if no recommendations
    const suggestedAction = recommendations.length > 0 
      ? recommendations[0] 
      : (explanation || 'Review this clause carefully');
    
    return {
      id: risk.id || `risk-${index}`,
      severity: risk.severity_level?.toLowerCase() || 'medium',
      title: cleanLabel,
      originalText: risk.snippet || risk.original_text || '',
      explanation: explanation,
      whyRisky: whyRisky,
      suggestedAction: suggestedAction,
      pageNumber: risk.page_number || 1,
      pageText: risk.page_text || '',
      highlightStart: risk.highlight_start || 0,
      highlightEnd: risk.highlight_end || 0,
      severityScore: risk.severity_score || 0
    };
  }) : [
    {
      id: "no-risks",
      severity: "low",
      title: "No Risks Identified",
      originalText: "No significant risks were found in the document.",
      explanation: "The document appears to be relatively safe based on the analysis.",
      whyRisky: [],
      suggestedAction: "Continue reviewing the document carefully",
      pageNumber: 1
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
              <RiskGauge score={riskScore} />
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, maxPage))}
                  disabled={currentPage >= maxPage}
                  className="p-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
                >
                  <ChevronRightIcon size={16} />
                </button>
              </div>
              <div className="flex items-center">
                <span className="mr-2">Page {currentPage} of {maxPage}</span>
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
            
            <div className="border rounded-lg p-4 bg-muted/20 relative min-h-[600px] overflow-auto">
              {/* Display actual PDF document */}
              {(() => {
                // Get current page risks
                const currentPageRisks = redFlags.filter(r => r.pageNumber === currentPage);
                
                if (pdfUrl) {
                  return (
                    <div className="flex flex-col items-center">
                      {pdfLoading && (
                        <div className="flex items-center gap-2 py-8">
                          <Loader className="w-6 h-6 animate-spin text-neon-blue" />
                          <span className="text-muted-foreground">Loading PDF...</span>
                        </div>
                      )}
                      <div className="bg-white shadow-md rounded overflow-auto p-4">
                        <Document
                          file={pdfUrl || pdfBlob}
                          options={{
                            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                            cMapPacked: true,
                            httpHeaders: {},
                          }}
                          onLoadSuccess={({ numPages }) => {
                            console.log("PDF loaded successfully, pages:", numPages);
                            setNumPages(numPages);
                            setPdfLoading(false);
                          }}
                          onLoadError={(error) => {
                            console.error("Error loading PDF Document:", error);
                            console.error("Error details:", JSON.stringify(error, null, 2));
                            console.error("PDF URL was:", pdfUrl);
                            console.error("PDF Blob:", pdfBlob);
                            setPdfLoading(false);
                          }}
                          loading={
                            <div className="flex items-center justify-center p-8">
                              <Loader className="w-6 h-6 animate-spin text-neon-blue" />
                            </div>
                          }
                          error={
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                              <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                              <p className="text-red-500 font-semibold">Failed to load PDF</p>
                              <p className="text-sm text-muted-foreground mt-2">Error details: Check console (F12)</p>
                              <p className="text-xs text-muted-foreground mt-2">URL: {pdfUrl?.substring(0, 80)}...</p>
                            </div>
                          }
                        >
                          {numPages !== null && currentPage <= numPages && (
                            <div className="relative" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
                              <Page
                                pageNumber={currentPage}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                className="border border-gray-300"
                                onLoadError={(error) => {
                                  console.error("Error loading PDF page:", error);
                                }}
                              />
                              {/* Overlay highlights on PDF */}
                              <PdfHighlights 
                                risks={currentPageRisks}
                                pageNumber={currentPage}
                              />
                            </div>
                          )}
                        </Document>
                      </div>
                      {currentPageRisks.length > 0 && (
                        <div className="mt-4 text-sm text-muted-foreground">
                          {currentPageRisks.length} risk{currentPageRisks.length !== 1 ? 's' : ''} identified on this page
                        </div>
                      )}
                    </div>
                  );
                } else {
                  const currentPageRisksFallback = redFlags.filter(r => r.pageNumber === currentPage);
                  return (
                    <div className="text-center text-muted-foreground py-12">
                      <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                      <p className="font-semibold text-lg mb-2">PDF document not available</p>
                      <p className="text-sm mb-2">
                        The document may have been cleared after a server restart.
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        The backend stores documents in memory, which clears on server restart.
                      </p>
                      <button
                        onClick={() => navigate('/upload')}
                        className="mt-4 px-4 py-2 bg-neon-blue text-white rounded-md hover:bg-neon-blue/80 transition-colors"
                      >
                        Re-upload Document
                      </button>
                      {currentPageRisksFallback.length > 0 && (
                        <p className="text-sm mt-4">Note: You have {currentPageRisksFallback.length} risk(s) identified on page {currentPage} from cached data.</p>
                      )}
                    </div>
                  );
                }
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiskAnalysis;