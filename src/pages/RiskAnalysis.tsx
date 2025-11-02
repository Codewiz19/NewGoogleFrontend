// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import UploadRequired from "@/components/UploadRequired";
// import {
//   AlertTriangle,
//   ChevronDown,
//   ChevronRight,
//   ZoomIn,
//   ZoomOut,
//   ChevronLeft,
//   ChevronRight as ChevronRightIcon,
//   Loader
// } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import RiskGauge from "@/components/dashboard/RiskGauge";
// import { getCachedDocument, getCachedRisks, updateCachedDocument, getCurrentDocId } from "@/lib/documentCache";
// import API from "@/lib/api";

// const RiskAnalysis = () => {
//   const { doc_id: paramDocId } = useParams<{ doc_id?: string }>();
//   const navigate = useNavigate();
//   // Use doc_id from params or get from cache
//   const cachedDocId = getCurrentDocId();
//   const doc_id = paramDocId || cachedDocId;
//   const [risks, setRisks] = useState<any[]>([]);
//   const [riskScore, setRiskScore] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [expandedFlags, setExpandedFlags] = useState<string[]>([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [zoom, setZoom] = useState(100);

//   useEffect(() => {
//     const fetchRisks = async () => {
//       if (!doc_id) {
//         setLoading(false);
//         return;
//       }

//       // Check cache first
//       const cachedRisks = getCachedRisks(doc_id);
//       if (cachedRisks && cachedRisks.length > 0) {
//         setRisks(cachedRisks);
//         calculateRiskScore(cachedRisks);
//         setLoading(false);
//         return;
//       }

//       // Fetch from API if not in cache
//       try {
//         setLoading(true);
//         const response = await fetch(API.getDocument(doc_id));

//         if (response.ok) {
//           const documentData = await response.json();
//           if (documentData.risks && Array.isArray(documentData.risks)) {
//             setRisks(documentData.risks);
//             calculateRiskScore(documentData.risks);
//             // Cache the risks
//             updateCachedDocument(doc_id, {
//               risks: documentData.risks,
//               risks_generated_at: documentData.risks_generated_at
//             });
//           }
//         }
//       } catch (error) {
//         console.error("Error fetching risks:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRisks();
//   }, [doc_id]);

//   const calculateRiskScore = (riskArray: any[]) => {
//     if (!riskArray || riskArray.length === 0) {
//       setRiskScore(0);
//       return;
//     }

//     const totalScore = riskArray.reduce((sum, risk) => {
//       return sum + (risk.severity_score || 0);
//     }, 0);

//     const avgScore = Math.min(100, Math.round(totalScore / riskArray.length));
//     setRiskScore(avgScore);
//   };

//   // Redirect to URL with doc_id if we have cached doc_id but no param
//   useEffect(() => {
//     if (cachedDocId && !paramDocId) {
//       navigate(`/risk-analysis/${cachedDocId}`, { replace: true });
//     }
//   }, [cachedDocId, paramDocId, navigate]);

//   if (!doc_id) {
//     return <UploadRequired message="Please upload a document first to view the risk analysis." />;
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-background neural-bg flex items-center justify-center">
//         <div className="text-center">
//           <Loader className="w-12 h-12 text-neon-blue animate-spin mx-auto mb-4" />
//           <p className="font-rajdhani text-xl text-muted-foreground">Loading risk analysis...</p>
//         </div>
//       </div>
//     );
//   }

//   // Get all unique page numbers from risks
//   const allPageNumbers = risks.length > 0
//     ? [...new Set(risks.map(r => r.page_number || 1).filter(p => p > 0))]
//     : [1];
//   const maxPage = allPageNumbers.length > 0 ? Math.max(...allPageNumbers) : 1;

//   // Convert risks to redFlags format for display
//   const redFlags = risks.length > 0 ? risks.map((risk, index) => {
//     // Clean up label - use short_risk first, then clean label (remove duplicates)
//     let cleanLabel = risk.short_risk || risk.label || `Risk ${index + 1}`;
//     if (cleanLabel.includes(' ; ')) {
//       // Remove duplicate segments
//       const parts = cleanLabel.split(' ; ').filter((part, idx, arr) => arr.indexOf(part) === idx);
//       cleanLabel = parts[0]; // Use first unique part as title
//     }

//     // Get recommendations as array
//     let recommendations: string[] = [];
//     if (Array.isArray(risk.recommendations)) {
//       recommendations = risk.recommendations.filter(rec => rec && rec.trim());
//     } else if (risk.recommendations && typeof risk.recommendations === 'string') {
//       recommendations = [risk.recommendations];
//     }

//     // Generate meaningful explanation if missing
//     const explanation = risk.explanation && risk.explanation.trim() &&
//                        risk.explanation !== 'Risk identified in document'
//                        ? risk.explanation
//                        : (recommendations.length > 0
//                           ? `This clause requires attention. ${recommendations[0]}`
//                           : `Risk identified: ${cleanLabel}`);

//     return {
//       id: risk.id || `risk-${index}`,
//       severity: risk.severity_level?.toLowerCase() || 'medium',
//       title: cleanLabel,
//       originalText: risk.snippet || risk.original_text || '',
//       explanation: explanation,
//       whyRisky: recommendations.length > 0
//         ? recommendations
//         : ['Review this clause with a legal professional to understand full implications'],
//       suggestedAction: recommendations.length > 0
//         ? recommendations[0]
//         : 'Consult with a legal professional about this clause',
//       pageNumber: risk.page_number || 1,
//       pageText: risk.page_text || '',
//       highlightStart: risk.highlight_start || 0,
//       highlightEnd: risk.highlight_end || 0,
//       severityScore: risk.severity_score || 0
//     };
//   }) : [
//     {
//       id: "no-risks",
//       severity: "low",
//       title: "No Risks Identified",
//       originalText: "No significant risks were found in the document.",
//       explanation: "The document appears to be relatively safe based on the analysis.",
//       whyRisky: [],
//       suggestedAction: "Continue reviewing the document carefully",
//       pageNumber: 1
//     }
//   ];

//   const toggleFlag = (flagId: string) => {
//     setExpandedFlags(prev =>
//       prev.includes(flagId)
//         ? prev.filter(id => id !== flagId)
//         : [...prev, flagId]
//     );

//     // Set page number to the page where the risk is located
//     const flag = redFlags.find(f => f.id === flagId);
//     if (flag) {
//       setCurrentPage(flag.pageNumber);
//     }
//   };

//   const getSeverityColor = (severity: string) => {
//     switch (severity) {
//       case 'high': return 'risk-high';
//       case 'medium': return 'risk-medium';
//       case 'low': return 'risk-low';
//       default: return 'muted-foreground';
//     }
//   };

//   const getSeverityBg = (severity: string) => {
//     switch (severity) {
//       case 'high': return 'bg-risk-high/20';
//       case 'medium': return 'bg-risk-medium/20';
//       case 'low': return 'bg-risk-low/20';
//       default: return 'bg-muted';
//     }
//   };

//   // Get the active flag for the current page
//   const getActiveFlag = () => {
//     return redFlags.find(flag =>
//       expandedFlags.includes(flag.id) &&
//       flag.pageNumber === currentPage
//     );
//   };

//   return (
//     <div className="container mx-auto p-4 space-y-6">
//       <h1 className="text-3xl font-bold mb-6">Risk Analysis</h1>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Left column: Risk score and red flags */}
//         <div className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Risk Score</CardTitle>
//             </CardHeader>
//             <CardContent className="flex justify-center">
//               <RiskGauge score={riskScore} />
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <AlertTriangle className="h-5 w-5 text-risk-high" />
//                 <span>Red Flags</span>
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {redFlags.map((flag) => (
//                   <div
//                     key={flag.id}
//                     className={`border rounded-lg overflow-hidden ${getSeverityBg(flag.severity)}`}
//                   >
//                     <div
//                       className="flex items-center justify-between p-3 cursor-pointer"
//                       onClick={() => toggleFlag(flag.id)}
//                     >
//                       <div className="flex items-center gap-2">
//                         <span className={`text-${getSeverityColor(flag.severity)} font-medium`}>
//                           {flag.title}
//                         </span>
//                         <span className="text-xs px-2 py-0.5 rounded-full bg-background">
//                           Page {flag.pageNumber}
//                         </span>
//                       </div>
//                       {expandedFlags.includes(flag.id) ? (
//                         <ChevronDown className="h-5 w-5" />
//                       ) : (
//                         <ChevronRight className="h-5 w-5" />
//                       )}
//                     </div>

//                     <AnimatePresence>
//                       {expandedFlags.includes(flag.id) && (
//                         <motion.div
//                           initial={{ height: 0, opacity: 0 }}
//                           animate={{ height: "auto", opacity: 1 }}
//                           exit={{ height: 0, opacity: 0 }}
//                           transition={{ duration: 0.2 }}
//                           className="border-t bg-background"
//                         >
//                           <div className="p-3 space-y-3">
//                             <div>
//                               <h4 className="text-sm font-medium">Explanation:</h4>
//                               <p className="text-sm">{flag.explanation}</p>
//                             </div>

//                             <div>
//                               <h4 className="text-sm font-medium">Why This Is Risky:</h4>
//                               <ul className="text-sm list-disc pl-5">
//                                 {flag.whyRisky.map((reason, idx) => (
//                                   <li key={idx}>{reason}</li>
//                                 ))}
//                               </ul>
//                             </div>

//                             <div>
//                               <h4 className="text-sm font-medium">Suggested Action:</h4>
//                               <p className="text-sm">{flag.suggestedAction}</p>
//                             </div>
//                           </div>
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Right column: PDF Viewer */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Document View</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex justify-between mb-4">
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                   disabled={currentPage <= 1}
//                   className="p-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
//                 >
//                   <ChevronLeft size={16} />
//                 </button>
//                 <button
//                   onClick={() => setCurrentPage(prev => Math.min(prev + 1, maxPage))}
//                   disabled={currentPage >= maxPage}
//                   className="p-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
//                 >
//                   <ChevronRightIcon size={16} />
//                 </button>
//               </div>
//               <div className="flex items-center">
//                 <span className="mr-2">Page {currentPage} of {maxPage}</span>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => setZoom(prev => Math.max(prev - 10, 50))}
//                     className="p-2 bg-secondary text-secondary-foreground rounded-md"
//                   >
//                     <ZoomOut size={16} />
//                   </button>
//                   <button
//                     onClick={() => setZoom(prev => Math.min(prev + 10, 200))}
//                     className="p-2 bg-secondary text-secondary-foreground rounded-md"
//                   >
//                     <ZoomIn size={16} />
//                   </button>
//                 </div>
//               </div>
//             </div>

//             <div className="border rounded-lg p-4 bg-muted/20 relative min-h-[600px] overflow-auto">
//               {/* Display actual PDF page text with highlighted risks */}
//               <div
//                 className="bg-white shadow-md rounded p-6 prose max-w-none"
//                 style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
//               >
//                 {(() => {
//                   // Get current page text
//                   const currentPageRisks = redFlags.filter(r => r.pageNumber === currentPage);
//                   let pageText = '';

//                   // Try to get page text from first risk on this page
//                   if (currentPageRisks.length > 0 && currentPageRisks[0].pageText) {
//                     pageText = currentPageRisks[0].pageText;
//                   } else {
//                     // Fallback: get page text from any risk (if available)
//                     const anyRiskWithText = redFlags.find(r => r.pageText);
//                     pageText = anyRiskWithText?.pageText || '';
//                   }

//                   if (!pageText) {
//                     return (
//                       <div className="text-center text-muted-foreground py-12">
//                         <p>Page {currentPage} text not available.</p>
//                         <p className="text-sm mt-2">Risks identified: {currentPageRisks.length}</p>
//                       </div>
//                     );
//                   }

//                   // Highlight risks in the text
//                   let displayText = pageText;
//                   const highlights: Array<{ start: number; end: number; severity: string }> = [];

//                   currentPageRisks.forEach(risk => {
//                     if (risk.highlightStart >= 0 && risk.highlightEnd > risk.highlightStart) {
//                       highlights.push({
//                         start: risk.highlightStart,
//                         end: risk.highlightEnd,
//                         severity: risk.severity
//                       });
//                     }
//                   });

//                   // Sort highlights by position (descending) to apply from end to start
//                   highlights.sort((a, b) => b.start - a.start);

//                   // Apply highlights
//                   highlights.forEach(({ start, end, severity }) => {
//                     const before = displayText.substring(0, start);
//                     const highlight = displayText.substring(start, end);
//                     const after = displayText.substring(end);
//                     const bgColor = severity === 'high' ? 'bg-red-200' : severity === 'medium' ? 'bg-yellow-200' : 'bg-orange-200';
//                     displayText = `${before}<mark class="${bgColor} font-semibold">${highlight}</mark>${after}`;
//                   });

//                   return (
//                     <div>
//                       <div className="mb-4 pb-2 border-b">
//                         <h3 className="text-lg font-semibold">Page {currentPage}</h3>
//                         {currentPageRisks.length > 0 && (
//                           <p className="text-sm text-muted-foreground">
//                             {currentPageRisks.length} risk{currentPageRisks.length !== 1 ? 's' : ''} identified on this page
//                           </p>
//                         )}
//                       </div>
//                       <div
//                         className="text-sm whitespace-pre-wrap font-mono"
//                         dangerouslySetInnerHTML={{ __html: displayText }}
//                       />
//                     </div>
//                   );
//                 })()}
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default RiskAnalysis;

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import UploadRequired from "@/components/UploadRequired";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Loader,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RiskGauge from "@/components/dashboard/RiskGauge";
import {
  getCachedDocument,
  getCachedRisks,
  updateCachedDocument,
  getCurrentDocId,
} from "@/lib/documentCache";
import API from "@/lib/api";

// --- TYPE DEFINITIONS ---

// This is the "good" data from the LLM
interface LlmRisk {
  id: string;
  short_risk: string;
  explanation: string;
  recommendations: string[];
  severity_level: "High" | "Medium" | "Low";
  severity_score: number;
}

// This is the "basic" data from the server's regex
interface ServerRisk {
  id: string;
  severity_level: string;
  severity_score: number;
  snippet: string;
  label: string;
  page_number: number;
  page_text: string;
  highlight_start: number;
  highlight_end: number;
  original_text: string;
}

// This is the final, merged data structure
interface RiskData {
  id: string;
  severity_level?: string;
  severity_score?: number;
  short_risk?: string;
  label?: string; // Fallback
  explanation?: string;
  recommendations?: string[];
  page_number?: number;
  page_text?: string;
  original_text?: string;
  snippet?: string;
  highlight_start?: number; // Character position start (relative to page text)
  highlight_end?: number; // Character position end (relative to page text)
}

interface RedFlag {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  explanation: string;
  recommendations: string[];
  pageNumber: number;
  pageText: string;
  highlightText: string; // The text to find and highlight (for reference)
  highlightStart: number; // Character position start (relative to page text)
  highlightEnd: number; // Character position end (relative to page text)
  severityScore: number;
}

// --- NEW HELPER FUNCTIONS ---

/**
 * Escapes special regex characters in a string.
 */
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Renders the page text with specified snippets highlighted using exact character positions.
 */
const HighlightedPage = ({
  pageText,
  risksOnPage,
}: {
  pageText: string;
  risksOnPage: RedFlag[];
}) => {
  // Collect all highlight ranges with their severities
  const highlights: Array<{ start: number; end: number; severity: string }> = [];
  
  risksOnPage.forEach((risk) => {
    // Use exact character positions from backend
    if (risk.highlightStart >= 0 && risk.highlightEnd > risk.highlightStart && risk.highlightEnd <= pageText.length) {
      highlights.push({
        start: risk.highlightStart,
        end: risk.highlightEnd,
        severity: risk.severity,
      });
    }
  });

  // If no valid highlights, return plain text
  if (highlights.length === 0) {
    return (
      <div className="text-sm whitespace-pre-wrap font-mono">{pageText}</div>
    );
  }

  // Sort highlights by start position (ascending)
  highlights.sort((a, b) => a.start - b.start);

  // Build elements by processing highlights from start to end
  const elements: React.ReactNode[] = [];
  let currentPos = 0;

  highlights.forEach((highlight, index) => {
    // Add text before highlight
    if (highlight.start > currentPos) {
      elements.push(
        <span key={`text-before-${index}`}>
          {pageText.substring(currentPos, highlight.start)}
        </span>
      );
    }

    // Add highlighted text (using exact substring from pageText)
    const highlightedText = pageText.substring(highlight.start, highlight.end);
    const bgColor =
      highlight.severity === "high"
        ? "bg-red-200"
        : highlight.severity === "medium"
        ? "bg-yellow-200"
        : "bg-orange-200";

    elements.push(
      <mark
        key={`highlight-${index}`}
        className={`${bgColor} font-semibold rounded px-0.5`}
      >
        {highlightedText}
      </mark>
    );

    currentPos = Math.max(currentPos, highlight.end);
  });

  // Add any remaining text at the end
  if (currentPos < pageText.length) {
    elements.push(
      <span key="text-end">{pageText.substring(currentPos)}</span>
    );
  }

  return (
    <div className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
      {elements}
    </div>
  );
};

/**
 * NEW: Cleans the raw LLM string and parses it.
 */
const parseLlmJsonString = (rawString: string): LlmRisk[] | null => {
  try {
    // 1. Remove markdown fences
    let cleanedString = rawString.trim();
    if (cleanedString.startsWith("```json")) {
      cleanedString = cleanedString.substring(7); // Remove ```json
    }
    if (cleanedString.endsWith("```")) {
      cleanedString = cleanedString.substring(0, cleanedString.length - 3);
    }

    // 2. Parse the cleaned string
    const parsedData = JSON.parse(cleanedString.trim());

    if (Array.isArray(parsedData)) {
      return parsedData as LlmRisk[];
    }
    return null;
  } catch (error) {
    console.error("Failed to parse raw LLM JSON:", error, rawString);
    return null;
  }
};

// --- MAIN COMPONENT ---

const RiskAnalysis = () => {
  const { doc_id: paramDocId } = useParams<{ doc_id?: string }>();
  const navigate = useNavigate();
  const cachedDocId = getCurrentDocId();
  const doc_id = paramDocId || cachedDocId;
  const [risks, setRisks] = useState<RiskData[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedFlags, setExpandedFlags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const fetchRisks = async () => {
      if (!doc_id) {
        setLoading(false);
        return;
      }

      // Check cache first
      const cachedRisks = getCachedRisks(doc_id);
      if (cachedRisks && cachedRisks.length > 0) {
        // Assume cached risks are already merged and good
        setRisks(cachedRisks);
        calculateRiskScore(cachedRisks);
        setLoading(false);
        return;
      }

      // Fetch from API if not in cache
      try {
        setLoading(true);
        const response = await fetch(API.getDocument(doc_id));

        if (!response.ok) {
          throw new Error("Failed to fetch document data");
        }

        const documentData = await response.json();
        let finalRisks: RiskData[] = [];

        // --- NEW MERGE LOGIC ---
        // Check if we are in the fallback state
        if (
          documentData.risks_fallback === true &&
          documentData.risks_raw_llm &&
          Array.isArray(documentData.risks)
        ) {
          console.log("Fallback detected. Attempting to merge...");

          // 1. Parse the "good" data from the raw string
          const llmRisks = parseLlmJsonString(documentData.risks_raw_llm);

          // 2. Get the "basic" server data
          const serverRisks = documentData.risks as ServerRisk[];

          if (llmRisks) {
            // 3. Create a lookup map for server data
            const serverRiskMap = new Map(serverRisks.map((r) => [r.id, r]));

            // 4. Merge
            finalRisks = llmRisks.map((llmRisk) => {
              const serverData = serverRiskMap.get(llmRisk.id);

              return {
                ...llmRisk, // The good data (short_risk, explanation, etc.)
                // Add the missing page/context data from serverRisks
                page_number: serverData?.page_number,
                page_text: serverData?.page_text,
                original_text: serverData?.original_text || serverData?.snippet,
                snippet: serverData?.snippet,
                label: serverData?.label, // Keep as a fallback
                highlight_start: serverData?.highlight_start, // Preserve highlight positions
                highlight_end: serverData?.highlight_end, // Preserve highlight positions
              };
            });
            console.log("Merge successful.");
          } else {
            // Parsing failed, just use the server_risks
            finalRisks = serverRisks;
          }
        } else if (Array.isArray(documentData.risks)) {
          // Standard path: risks are already good
          console.log("Standard path: risks are pre-parsed.");
          finalRisks = documentData.risks;
        }
        // --- END MERGE LOGIC ---

        // De-duplicate just in case
        const uniqueRisks = new Map<string, RiskData>();
        finalRisks.forEach((risk) => {
          if (risk.id && !uniqueRisks.has(risk.id)) {
            uniqueRisks.set(risk.id, risk);
          }
        });
        const risksToStore = Array.from(uniqueRisks.values());

        setRisks(risksToStore);
        calculateRiskScore(risksToStore);

        // Cache the final, merged risks
        updateCachedDocument(doc_id, {
          risks: risksToStore,
          risks_generated_at: documentData.risks_generated_at,
        });
      } catch (error) {
        console.error("Error fetching risks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRisks();
  }, [doc_id]);

  const calculateRiskScore = (riskArray: RiskData[]) => {
    if (!riskArray || riskArray.length === 0) {
      setRiskScore(0);
      return;
    }
    const totalScore = riskArray.reduce((sum, risk) => {
      return sum + (risk.severity_score || 0);
    }, 0);
    const avgScore = Math.min(
      100,
      Math.max(0, Math.round(totalScore / riskArray.length))
    );
    setRiskScore(avgScore);
  };

  useEffect(() => {
    if (cachedDocId && !paramDocId) {
      navigate(`/risk-analysis/${cachedDocId}`, { replace: true });
    }
  }, [cachedDocId, paramDocId, navigate]);

  const redFlags: RedFlag[] = useMemo(() => {
    if (risks.length === 0) {
      return [
        {
          id: "no-risks",
          severity: "low",
          title: "No Significant Risks Identified",
          explanation:
            "No significant risks were found in the document based on the analysis. You should still review the document carefully.",
          recommendations: [
            "Review the document for any business-specific concerns.",
          ],
          pageNumber: 1,
          pageText: "No document text available for no-risk report.",
          highlightText: "",
          highlightStart: 0,
          highlightEnd: 0,
          severityScore: 0,
        },
      ];
    }

    // Helper function to generate contextual fallback explanation based on risk label/title
    const generateFallbackExplanation = (label: string, snippet: string): string => {
      const labelLower = label.toLowerCase();
      if (labelLower.includes("termination")) {
        return "This clause defines termination conditions and notice periods. Review the specific terms to understand when and how the contract can be ended, what notice is required, and whether termination rights are mutual or one-sided.";
      } else if (labelLower.includes("liability") || labelLower.includes("liabilit")) {
        return "This clause addresses liability limitations or allocations. Such clauses can significantly impact your legal protection and financial exposure in case of disputes or damages.";
      } else if (labelLower.includes("penalt")) {
        return "This clause outlines penalties or liquidated damages. Review the specific amounts, triggers, and whether they are reasonable and clearly defined.";
      } else if (labelLower.includes("indemnif")) {
        return "This indemnity clause may require one party to compensate the other for losses. Indemnity provisions can be broad and may create unexpected financial obligations.";
      } else if (labelLower.includes("warrant")) {
        return "This warranty clause defines what is guaranteed and what is not. Review the scope, duration, and any disclaimers that may limit your legal recourse.";
      } else if (labelLower.includes("confident")) {
        return "This confidentiality clause governs how sensitive information is protected. Ensure the terms provide adequate data protection and meet your security requirements.";
      } else if (labelLower.includes("governing law") || labelLower.includes("jurisdiction")) {
        return "This clause determines which jurisdiction's laws apply and where disputes will be resolved. This may impact legal costs and procedures if disputes arise.";
      } else if (labelLower.includes("assign")) {
        return "This clause addresses assignment or transfer of rights. Review whether assignments are permitted, require consent, and what restrictions apply.";
      } else if (labelLower.includes("notice")) {
        return "This clause sets notice periods and methods. Short notice periods can make it difficult to respond or exercise your rights in time.";
      } else if (labelLower.includes("automatic")) {
        return "This clause includes automatic renewal provisions that could extend the contract without explicit renewal. Review cancellation rights and renewal terms.";
      } else {
        // Try to extract context from snippet
        const snippetText = snippet ? snippet.substring(0, 100) : "";
        return `This clause (${label}) contains terms that may require careful review. ${snippetText ? `The text mentions: "${snippetText}..."` : "Review the specific language to understand its implications."}`;
      }
    };

    // Helper function to generate contextual fallback recommendations
    const generateFallbackRecommendations = (label: string): string[] => {
      const labelLower = label.toLowerCase();
      if (labelLower.includes("termination")) {
        return [
          "Request mutual termination rights if currently one-sided",
          "Negotiate longer notice periods (60-90 days minimum)",
          "Add clear conditions for termination (e.g., 'just cause' requirements)"
        ];
      } else if (labelLower.includes("liability") || labelLower.includes("liabilit")) {
        return [
          "Cap liability amounts to reasonable, agreed limits",
          "Ensure liability terms are mutual and fair to both parties",
          "Consider adding liability insurance requirements"
        ];
      } else if (labelLower.includes("penalt")) {
        return [
          "Negotiate reasonable penalty amounts that reflect actual damages",
          "Ensure penalty triggers are clearly defined and reasonable",
          "Request opportunity to cure issues before penalties apply"
        ];
      } else if (labelLower.includes("indemnif")) {
        return [
          "Narrow the indemnity scope to specific situations and losses",
          "Add exceptions for the other party's negligence or willful misconduct",
          "Cap indemnity amounts or require insurance coverage"
        ];
      } else if (labelLower.includes("warrant")) {
        return [
          "Clarify warranty scope, duration, and what is excluded",
          "Ensure warranty disclaimers are reasonable and clearly stated",
          "Request specific warranty language for critical components or services"
        ];
      } else if (labelLower.includes("confident")) {
        return [
          "Strengthen data protection and confidentiality language",
          "Add specific data breach notification requirements and timelines",
          "Ensure compliance with applicable privacy and data protection laws"
        ];
      } else if (labelLower.includes("governing law") || labelLower.includes("jurisdiction")) {
        return [
          "Negotiate jurisdiction closer to your location if currently unfavorable",
          "Consider arbitration as an alternative dispute resolution method",
          "Ensure you understand the legal and cost implications of the chosen jurisdiction"
        ];
      } else if (labelLower.includes("assign")) {
        return [
          "Request right to assign with reasonable notice to the other party",
          "Negotiate assignment restrictions to be reasonable and specific",
          "Add exceptions for assignment to affiliates or in case of merger/acquisition"
        ];
      } else if (labelLower.includes("notice")) {
        return [
          "Request longer notice periods (30-60 days minimum)",
          "Ensure multiple notice methods are accepted (email, registered mail, etc.)",
          "Clarify when notice is considered received and effective"
        ];
      } else if (labelLower.includes("automatic")) {
        return [
          "Request opt-in renewal rather than automatic opt-out renewal",
          "Negotiate shorter renewal periods with clear cancellation windows",
          "Add explicit cancellation rights before renewal dates"
        ];
      } else {
        return [
          "Review the specific language and terms of this clause carefully",
          "Request clarification of any ambiguous or unclear terms",
          "Negotiate modifications to better align with your interests and risk tolerance"
        ];
      }
    };

    return risks.map((risk, index) => {
      // Get recommendations - filter out generic ones
      let recommendations =
        Array.isArray(risk.recommendations) && risk.recommendations.length > 0
          ? risk.recommendations.filter((rec) => rec && rec.trim())
          : [];

      // Filter out generic recommendations
      const genericPatterns = [
        "review this clause with a legal professional",
        "consult with a legal professional",
        "seek legal advice",
        "contact a lawyer",
        "review this clause",
        "consult a legal professional"
      ];
      
      recommendations = recommendations.filter(rec => {
        const recLower = rec.toLowerCase().trim();
        return !genericPatterns.some(pattern => recLower.includes(pattern));
      });

      // If no valid recommendations, generate contextual ones
      if (recommendations.length === 0) {
        const label = risk.short_risk || risk.label || `Risk ${index + 1}`;
        recommendations = generateFallbackRecommendations(label);
      }

      // Get explanation - must be real, not generic
      let explanation = risk.explanation?.trim() || "";
      const genericExplanations = [
        "no explanation provided",
        "explanation not provided",
        "this clause requires attention",
        "review this clause",
        "consult a legal professional",
        "seek legal advice"
      ];

      // Check if explanation is generic or missing
      if (!explanation || 
          explanation.length < 20 ||
          genericExplanations.some(gen => explanation.toLowerCase().includes(gen))) {
        // Generate contextual fallback explanation
        const label = risk.short_risk || risk.label || `Risk ${index + 1}`;
        const snippet = risk.original_text || risk.snippet || "";
        explanation = generateFallbackExplanation(label, snippet);
      }

      return {
        id: risk.id || `risk-${index}`,
        severity:
          (risk.severity_level?.toLowerCase() as RedFlag["severity"]) ||
          "medium",
        title: risk.short_risk || risk.label || `Risk ${index + 1}`, // Uses good short_risk
        explanation: explanation, // Real explanation, never generic
        recommendations: recommendations, // Real recommendations, never generic
        pageNumber: risk.page_number || 1,
        pageText: risk.page_text || "",
        highlightText: risk.original_text || risk.snippet || "", // This is the snippet (for reference)
        highlightStart: risk.highlight_start ?? 0, // Character position start (relative to page text)
        highlightEnd: risk.highlight_end ?? 0, // Character position end (relative to page text)
        severityScore: risk.severity_score || 0,
      };
    });
  }, [risks]);

  const allPageNumbers = useMemo(() => {
    return redFlags.length > 0
      ? [...new Set(redFlags.map((r) => r.pageNumber))]
      : [1];
  }, [redFlags]);

  const maxPage = allPageNumbers.length > 0 ? Math.max(...allPageNumbers) : 1;

  const currentPageText = useMemo(() => {
    const riskForPage = redFlags.find(
      (r) => r.pageNumber === currentPage && r.pageText
    );
    return riskForPage ? riskForPage.pageText : "";
  }, [redFlags, currentPage]);

  const risksOnCurrentPage = useMemo(() => {
    return redFlags.filter((r) => r.pageNumber === currentPage);
  }, [redFlags, currentPage]);

  const toggleFlag = (flagId: string) => {
    setExpandedFlags((prev) =>
      prev.includes(flagId)
        ? prev.filter((id) => id !== flagId)
        : [...prev, flagId]
    );

    const flag = redFlags.find((f) => f.id === flagId);
    if (flag) {
      setCurrentPage(flag.pageNumber);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "risk-high";
      case "medium":
        return "risk-medium";
      case "low":
        return "risk-low";
      default:
        return "muted-foreground";
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-risk-high/20";
      case "medium":
        return "bg-risk-medium/20";
      case "low":
        return "bg-risk-low/20";
      default:
        return "bg-muted";
    }
  };

  if (!doc_id) {
    return (
      <UploadRequired message="Please upload a document first to view the risk analysis." />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background neural-bg flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-neon-blue animate-spin mx-auto mb-4" />
          <p className="font-rajdhani text-xl text-muted-foreground">
            Loading risk analysis...
          </p>
        </div>
      </div>
    );
  }

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
                    className={`border rounded-lg overflow-hidden ${getSeverityBg(
                      flag.severity
                    )}`}
                  >
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer"
                      onClick={() => toggleFlag(flag.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-${getSeverityColor(
                            flag.severity
                          )} font-medium`}
                        >
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
                              <h4 className="text-sm font-medium">
                                Explanation:
                              </h4>
                              <p className="text-sm">{flag.explanation}</p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium">
                                Recommendations:
                              </h4>
                              <ul className="text-sm list-disc pl-5 space-y-1">
                                {flag.recommendations.map((reason, idx) => (
                                  <li key={idx}>{reason}</li>
                                ))}
                              </ul>
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage <= 1}
                  className="p-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, maxPage))
                  }
                  disabled={currentPage >= maxPage}
                  className="p-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
                >
                  <ChevronRightIcon size={16} />
                </button>
              </div>
              <div className="flex items-center">
                <span className="mr-2">
                  Page {currentPage} of {maxPage}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setZoom((prev) => Math.max(prev - 10, 50))}
                    className="p-2 bg-secondary text-secondary-foreground rounded-md"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    onClick={() => setZoom((prev) => Math.min(prev + 10, 200))}
                    className="p-2 bg-secondary text-secondary-foreground rounded-md"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-muted/20 relative min-h-[600px] overflow-auto">
              <div
                className="bg-white shadow-md rounded p-6 prose max-w-none"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top left",
                }}
              >
                {currentPageText ? (
                  <div>
                    <div className="mb-4 pb-2 border-b">
                      <h3 className="text-lg font-semibold">
                        Page {currentPage}
                      </h3>
                      {risksOnCurrentPage.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {risksOnCurrentPage.length} risk
                          {risksOnCurrentPage.length !== 1 ? "s" : ""}{" "}
                          identified on this page
                        </p>
                      )}
                    </div>
                    <HighlightedPage
                      pageText={currentPageText}
                      risksOnPage={risksOnCurrentPage}
                    />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <p>Page {currentPage} text not available.</p>
                    {risksOnCurrentPage.length > 0 && (
                      <p className="text-sm mt-2">
                        {risksOnCurrentPage.length} risk
                        {risksOnCurrentPage.length !== 1 ? "s" : ""} identified,
                        but text could not be loaded.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiskAnalysis;
