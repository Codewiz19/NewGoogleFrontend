import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader, FileText as FileTextIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UploadRequired from "@/components/UploadRequired";
import API from "@/lib/api";
import { getCachedDocument, getCachedSummary, updateCachedDocument, getCurrentDocId } from "@/lib/documentCache";

const DocumentSummary = () => {
  const { doc_id: paramDocId } = useParams<{ doc_id?: string }>();
  const navigate = useNavigate();
  // Use doc_id from params or get from cache
  const cachedDocId = getCurrentDocId();
  const doc_id = paramDocId || cachedDocId;
  const [summary, setSummary] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!doc_id) {
        setLoading(false);
        return;
      }

      // Check cache first
      const cached = getCachedDocument(doc_id);
      if (cached?.summary) {
        setSummary(cached.summary);
        setFilename(cached.filename || "Document");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(API.getDocument(doc_id));

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to get document summary.");
        }

        const documentData = await response.json();
        
        // Cache the document data
        updateCachedDocument(doc_id, {
          filename: documentData.filename,
          summary: documentData.summary,
          summary_generated_at: documentData.summary_generated_at,
          risks: documentData.risks,
          risks_generated_at: documentData.risks_generated_at
        });
        
        if (documentData.summary) {
          setSummary(documentData.summary);
        } else {
          setSummary("Summary is still being generated. Please wait a moment and refresh.");
        }
        
        setFilename(documentData.filename || "Document");
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [doc_id]);

  // Redirect to URL with doc_id if we have cached doc_id but no param
  useEffect(() => {
    if (cachedDocId && !paramDocId) {
      navigate(`/document-summary/${cachedDocId}`, { replace: true });
    }
  }, [cachedDocId, paramDocId, navigate]);

  if (!doc_id) {
    return <UploadRequired message="Please upload a document first to view the document summary." />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background neural-bg flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-neon-blue animate-spin mx-auto mb-4" />
          <p className="font-rajdhani text-xl text-muted-foreground">Loading document summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background neural-bg flex items-center justify-center">
        <div className="text-center">
          <p className="font-rajdhani text-xl text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background neural-bg text-foreground p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-orbitron font-bold mb-8 cyber-glow text-center">
          Document Summary
        </h1>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-cyber-dark/50 border-neon-blue/30 holo-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-rajdhani font-semibold text-neon-cyan">
                <FileTextIcon className="w-6 h-6" />
                {filename}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-rajdhani font-semibold mb-3 text-neon-cyan">Summary</h3>
                  <p className="font-sans whitespace-pre-wrap text-foreground leading-relaxed">
                    {summary || "No summary available yet."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DocumentSummary;