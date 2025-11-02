import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader, FileText as FileTextIcon, Shield, AlertTriangle, CheckCircle } from "lucide-react";
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
              <div className="space-y-6">
                {summary ? (
                  <FormattedSummary text={summary} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <p>Summary is still being generated. Please wait a moment and refresh.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Component to format and display summary with proper headings and styling
const FormattedSummary = ({ text }: { text: string }) => {
  // Convert markdown-style bold (**text**) to actual bold formatting
  const convertBoldText = (content: string) => {
    // Replace **text** with bold span
    return content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>');
  };
  
  // Parse the summary text to identify sections and format them
  const parseSummary = (summary: string) => {
    const sections: Array<{ type: 'heading' | 'paragraph' | 'list' | 'subheading'; content: string }> = [];
    const lines = summary.split('\n');
    
    let currentSection: { type: string; content: string } | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        if (currentSection) {
          sections.push(currentSection);
          currentSection = null;
        }
        continue;
      }
      
      // Detect headings (lines that are short and end without period, or numbered headings)
      const isHeading = line.length < 100 && (
        line.match(/^\d+\)?\s+[A-Z]/) || // Numbered headings like "1) EXECUTIVE SUMMARY"
        line.match(/^[A-Z][A-Z\s:]+$/) || // ALL CAPS headings
        line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:$/) || // Title Case headings with colon
        (line.length < 60 && !line.includes('.') && line.split(' ').length <= 8)
      );
      
      // Detect list items
      const isListItem = line.match(/^[-•*]\s+/) || line.match(/^\d+\.\s+/);
      
      // Detect subheadings (shorter lines that are emphasized)
      const isSubheading = line.length < 80 && (
        line.match(/^[A-Z][^.]{0,50}:$/) || // Ends with colon
        (line.split(' ').length <= 6 && !line.includes('.'))
      );
      
      if (isHeading && !isListItem) {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'heading', content: line };
      } else if (isSubheading && !isListItem) {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'subheading', content: line };
      } else if (isListItem) {
        if (currentSection && currentSection.type === 'list') {
          currentSection.content += '\n' + line;
        } else {
          if (currentSection) sections.push(currentSection);
          currentSection = { type: 'list', content: line };
        }
      } else {
        if (currentSection && currentSection.type === 'paragraph') {
          currentSection.content += ' ' + line;
        } else {
          if (currentSection) sections.push(currentSection);
          currentSection = { type: 'paragraph', content: line };
        }
      }
    }
    
    if (currentSection) sections.push(currentSection);
    return sections;
  };
  
  const sections = parseSummary(text);
  
  return (
    <div className="space-y-6">
      {sections.map((section, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="space-y-3"
        >
          {section.type === 'heading' && (
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-neon-cyan/20">
              <div className="w-1 h-8 bg-gradient-to-b from-neon-cyan to-neon-blue rounded-full" />
              <h2 
                className="text-2xl font-orbitron font-bold text-neon-cyan cyber-glow"
                dangerouslySetInnerHTML={{ 
                  __html: convertBoldText(section.content.replace(/^\d+\)?\s*/, '').replace(/:$/, '')) 
                }}
              />
            </div>
          )}
          
          {section.type === 'subheading' && (
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-neon-blue flex-shrink-0" />
              <h3 
                className="text-xl font-rajdhani font-semibold text-neon-blue"
                dangerouslySetInnerHTML={{ 
                  __html: convertBoldText(section.content.replace(/:$/, '')) 
                }}
              />
            </div>
          )}
          
          {section.type === 'list' && (
            <div className="ml-4 space-y-2">
              {section.content.split('\n').map((item, idx) => {
                const cleanItem = item.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').trim();
                if (!cleanItem) return null;
                
                // Check if item has bold text followed by colon (like "**Rent Payment: ** text")
                const hasBoldLabel = cleanItem.match(/^\*\*(.*?)\*\*\s*:\s*(.*)/);
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 + idx * 0.05 }}
                    className="flex items-start gap-3 group"
                  >
                    <CheckCircle className="w-5 h-5 text-neon-green mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <p 
                      className="text-foreground leading-relaxed flex-1"
                      dangerouslySetInnerHTML={{ 
                        __html: hasBoldLabel 
                          ? `<span class="font-bold text-neon-cyan">${hasBoldLabel[1]}:</span> ${convertBoldText(hasBoldLabel[2])}`
                          : convertBoldText(cleanItem)
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {section.type === 'paragraph' && (
            <p 
              className="text-foreground leading-relaxed text-base pl-2 border-l-2 border-neon-blue/30"
              dangerouslySetInnerHTML={{ __html: convertBoldText(section.content) }}
            />
          )}
        </motion.div>
      ))}
      
      {/* Fallback: if parsing didn't work well, show as formatted text */}
      {sections.length === 0 && (
        <div className="prose prose-invert max-w-none">
          <p 
            className="text-foreground leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: convertBoldText(text) }}
          />
        </div>
      )}
    </div>
  );
};

export default DocumentSummary;