import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader, AlertTriangle, FileText, BrainCircuit } from "lucide-react";
import API from "@/lib/api";
import UploadRequired from "@/components/UploadRequired";

interface Risk {
  id: string;
  severity_level: string;
  severity_score: number;
  short_risk?: string;
  label?: string;
  explanation?: string;
  recommendations?: string[];
  snippet?: string;
}

const Dashboard = () => {
  const { doc_id } = useParams<{ doc_id: string }>();
  const [status, setStatus] = useState("processing");
  const [summary, setSummary] = useState("");
  const [risks, setRisks] = useState<Risk[]>([]);
  const [error, setError] = useState<string | null>(null);

  // If no doc_id, show upload required message
  if (!doc_id) {
    return <UploadRequired message="Please upload a document first to view the dashboard." />;
  }

  useEffect(() => {
    const fetchDocumentData = async () => {
      if (!doc_id) return;

      try {
        setStatus("processing");

        // Fetch stored document data (summary and risks if available)
        const response = await fetch(API.getDocument(doc_id));

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to get document data.");
        }

        const documentData = await response.json();
        console.log("Fetched document data:", documentData);
        
        // Set summary if available
        if (documentData.summary) {
          setSummary(documentData.summary);
        } else {
          setSummary("");
        }

        // Set risks if available
        if (documentData.risks) {
          // Handle both array format and object format
          if (Array.isArray(documentData.risks)) {
            setRisks(documentData.risks);
          } else {
            setRisks([]);
          }
        } else {
          setRisks([]);
        }

        // Update status based on what's available - prioritize showing data if it exists
        const hasSummary = !!documentData.summary;
        const hasRisks = !!documentData.risks && Array.isArray(documentData.risks) && documentData.risks.length > 0;
        
        if (hasSummary && hasRisks) {
          // Both are available - show complete
          setStatus("complete");
        } else if (hasSummary || hasRisks) {
          // At least one is available - show partial data
          setStatus("complete");
        } else if (documentData.status) {
          // Use backend status if no data yet
          setStatus(documentData.status === "complete" ? "complete" : "processing");
        } else {
          // Default to processing
          setStatus("processing");
        }
      } catch (err) {
        setError((err as Error).message);
        setStatus("error");
      }
    };

    fetchDocumentData();
  }, [doc_id]);

  return (
    <div className="min-h-screen bg-background neural-bg text-foreground p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-orbitron font-bold mb-8 cyber-glow text-center">
          Analysis Dashboard
        </h1>

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-4 p-8 bg-cyber-dark/50 rounded-lg holo-border">
            <Loader className="w-12 h-12 text-neon-blue animate-spin" />
            <p className="font-rajdhani text-xl">Analyzing your document...</p>
          </div>
        )}
        
        {status === "processing" && (
          <div className="flex flex-col items-center justify-center gap-4 p-8 bg-cyber-dark/50 rounded-lg holo-border">
            <BrainCircuit className="w-12 h-12 text-neon-cyan animate-pulse" />
            <p className="font-rajdhani text-xl">Processing insights...</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center gap-4 p-8 bg-red-900/50 rounded-lg border border-red-500">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <p className="font-rajdhani text-xl text-red-400">
              {error || "An unknown error occurred."}
            </p>
          </div>
        )}

        {/* Show data if we have summary or risks, regardless of status */}
        {(status === "complete" || summary || risks.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Summary Card */}
            {(summary || status === "complete") && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-cyber-dark/50 rounded-lg holo-border"
              >
                <h2 className="flex items-center gap-2 text-2xl font-rajdhani font-semibold mb-4 text-neon-cyan">
                  <FileText />
                  Document Summary
                </h2>
                {summary ? (
                  <p className="font-sans whitespace-pre-wrap">{summary}</p>
                ) : (
                  <p className="text-muted-foreground">Summary is being generated...</p>
                )}
              </motion.div>
            )}

            {/* Risks Card */}
            {(risks.length > 0 || status === "complete") && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 bg-cyber-dark/50 rounded-lg holo-border"
              >
                <h2 className="flex items-center gap-2 text-2xl font-rajdhani font-semibold mb-4 text-neon-red">
                  <AlertTriangle />
                  Identified Risks
                </h2>
                {risks.length === 0 ? (
                  <p className="text-muted-foreground">No risks identified.</p>
                ) : (
                  <ul className="space-y-4">
                    {risks.map((risk) => (
                      <li key={risk.id} className="font-sans p-3 bg-red-900/30 rounded-md">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-semibold text-neon-red">
                            {risk.short_risk || risk.label || "Risk"}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            risk.severity_level === "High" ? "bg-red-900/50 text-red-300" :
                            risk.severity_level === "Medium" ? "bg-yellow-900/50 text-yellow-300" :
                            "bg-green-900/50 text-green-300"
                          }`}>
                            {risk.severity_level} ({risk.severity_score})
                          </span>
                        </div>
                        {risk.explanation && (
                          <p className="text-sm text-muted-foreground mb-2">{risk.explanation}</p>
                        )}
                        {risk.recommendations && risk.recommendations.length > 0 && (
                          <ul className="text-xs text-muted-foreground list-disc list-inside">
                            {risk.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        )}
                        {risk.snippet && (
                          <div className="mt-2 p-2 bg-cyber-dark/50 rounded text-xs font-mono text-muted-foreground">
                            "{risk.snippet.substring(0, 100)}..."
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;