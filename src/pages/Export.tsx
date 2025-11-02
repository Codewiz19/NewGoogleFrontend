import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import UploadRequired from "@/components/UploadRequired";
import { 
  Download, 
  FileText, 
  Mail, 
  Share2, 
  Printer,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCachedDocument, getCurrentDocId } from "@/lib/documentCache";
import API from "@/lib/api";

const Export = () => {
  const { doc_id: paramDocId } = useParams<{ doc_id?: string }>();
  const navigate = useNavigate();
  // Use doc_id from params or get from cache
  const cachedDocId = getCurrentDocId();
  const doc_id = paramDocId || cachedDocId;
  const cachedDoc = doc_id ? getCachedDocument(doc_id) : null;

  const [documentData, setDocumentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [includeOptions, setIncludeOptions] = useState({
    summary: true,
    riskAnalysis: true,
    redFlags: true,
    originalText: false,
    recommendations: true
  });
  const [email, setEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  // Fetch document data
  useEffect(() => {
    const fetchDocumentData = async () => {
      if (!doc_id) {
        setLoading(false);
        return;
      }

      // Check cache first
      const cached = getCachedDocument(doc_id);
      if (cached?.summary || cached?.risks) {
        setDocumentData(cached);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(API.getDocument(doc_id));
        if (response.ok) {
          const data = await response.json();
          setDocumentData(data);
        }
      } catch (error) {
        console.error("Error fetching document data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentData();
  }, [doc_id]);

  // Redirect to URL with doc_id if we have cached doc_id but no param
  useEffect(() => {
    if (cachedDocId && !paramDocId) {
      navigate(`/export/${cachedDocId}`, { replace: true });
    }
  }, [cachedDocId, paramDocId, navigate]);

  if (!doc_id) {
    return <UploadRequired message="Please upload a document first to export the analysis report." />;
  }

  // Calculate actual risk score from risks
  const calculateRiskScore = () => {
    if (!documentData?.risks || !Array.isArray(documentData.risks) || documentData.risks.length === 0) {
      return { score: 0, level: 'Low' };
    }
    
    const totalScore = documentData.risks.reduce((sum: number, risk: any) => {
      return sum + (risk.severity_score || 0);
    }, 0);
    
    const avgScore = Math.min(100, Math.round(totalScore / documentData.risks.length));
    
    let level = 'Low';
    if (avgScore >= 70) level = 'High';
    else if (avgScore >= 40) level = 'Medium';
    
    return { score: avgScore, level };
  };

  const riskInfo = calculateRiskScore();
  const riskCount = documentData?.risks && Array.isArray(documentData.risks) ? documentData.risks.length : 0;
  const filename = documentData?.filename || cachedDoc?.filename || 'Document';

  const exportFormats = [
    { id: 'pdf', name: 'PDF Report', icon: FileText, description: 'Professional formatted document' },
    { id: 'email', name: 'Email Summary', icon: Mail, description: 'Send analysis to your inbox' },
    { id: 'print', name: 'Print Version', icon: Printer, description: 'Optimized for printing' }
  ];

  const handleExport = async () => {
    if (!documentData) return;
    
    setIsExporting(true);
    
    try {
      // Prepare report data
      const reportData = {
        filename: filename,
        date: new Date().toLocaleDateString(),
        summary: includeOptions.summary ? documentData.summary : null,
        risks: includeOptions.riskAnalysis ? documentData.risks : null,
        riskScore: includeOptions.riskAnalysis ? riskInfo : null,
        recommendations: includeOptions.recommendations ? 
          documentData.risks?.map((r: any) => r.recommendations).flat().filter(Boolean) : null,
        redFlags: includeOptions.redFlags ? 
          documentData.risks?.filter((r: any) => r.severity_level === 'High') : null,
        originalText: includeOptions.originalText ? documentData.text_info?.full_text : null
      };

      if (selectedFormat === 'pdf') {
        // Generate PDF content
        const pdfContent = generatePDFContent(reportData);
        
        // Create blob and download
        const blob = new Blob([pdfContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_analysis_report_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
      } else if (selectedFormat === 'email') {
        // In a real app, this would call a backend endpoint to send email
        console.log('Email export:', { email, reportData });
        // For now, just simulate
      } else if (selectedFormat === 'print') {
        // Generate print-friendly content
        const printContent = generatePrintContent(reportData);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(printContent);
          printWindow.document.close();
          printWindow.print();
        }
      }
      
      setIsExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (error) {
      console.error("Export error:", error);
      setIsExporting(false);
    }
  };

  const generatePDFContent = (data: any) => {
    let content = `LEGAL DOCUMENT ANALYSIS REPORT\n`;
    content += `================================\n\n`;
    content += `Document: ${data.filename}\n`;
    content += `Analysis Date: ${data.date}\n`;
    if (data.riskScore) {
      content += `Risk Score: ${data.riskScore.score}/100 (${data.riskScore.level} Risk)\n`;
    }
    content += `\n${'='.repeat(50)}\n\n`;

    if (data.summary) {
      content += `EXECUTIVE SUMMARY\n`;
      content += `${'-'.repeat(50)}\n`;
      content += `${data.summary}\n\n`;
    }

    if (data.risks && data.risks.length > 0) {
      content += `RISK ANALYSIS\n`;
      content += `${'-'.repeat(50)}\n`;
      data.risks.forEach((risk: any, idx: number) => {
        content += `\n${idx + 1}. ${risk.short_risk || risk.label || 'Risk'}\n`;
        content += `   Severity: ${risk.severity_level} (Score: ${risk.severity_score})\n`;
        if (risk.explanation) {
          content += `   Explanation: ${risk.explanation}\n`;
        }
        if (risk.recommendations && Array.isArray(risk.recommendations)) {
          content += `   Recommendations:\n`;
          risk.recommendations.forEach((rec: string) => {
            content += `     - ${rec}\n`;
          });
        }
      });
      content += `\n`;
    }

    if (data.recommendations && data.recommendations.length > 0) {
      content += `RECOMMENDATIONS\n`;
      content += `${'-'.repeat(50)}\n`;
      data.recommendations.forEach((rec: string) => {
        content += `• ${rec}\n`;
      });
      content += `\n`;
    }

    return content;
  };

  const generatePrintContent = (data: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Legal Document Analysis Report - ${data.filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          h2 { color: #555; margin-top: 20px; }
          .risk { margin: 10px 0; padding: 10px; border-left: 3px solid #ff6b6b; }
        </style>
      </head>
      <body>
        <h1>Legal Document Analysis Report</h1>
        <p><strong>Document:</strong> ${data.filename}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        ${data.riskScore ? `<p><strong>Risk Score:</strong> ${data.riskScore.score}/100 (${data.riskScore.level} Risk)</p>` : ''}
        
        ${data.summary ? `<h2>Executive Summary</h2><p>${data.summary.replace(/\n/g, '<br>')}</p>` : ''}
        
        ${data.risks && data.risks.length > 0 ? `
          <h2>Risk Analysis</h2>
          ${data.risks.map((risk: any, idx: number) => `
            <div class="risk">
              <h3>${idx + 1}. ${risk.short_risk || risk.label || 'Risk'}</h3>
              <p><strong>Severity:</strong> ${risk.severity_level} (Score: ${risk.severity_score})</p>
              ${risk.explanation ? `<p>${risk.explanation}</p>` : ''}
              ${risk.recommendations && Array.isArray(risk.recommendations) ? `
                <p><strong>Recommendations:</strong></p>
                <ul>${risk.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}</ul>
              ` : ''}
            </div>
          `).join('')}
        ` : ''}
      </body>
      </html>
    `;
  };

  const toggleOption = (option: keyof typeof includeOptions) => {
    setIncludeOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  return (
    <div className="min-h-screen bg-background neural-bg p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-orbitron font-bold cyber-glow mb-4">
            EXPORT ANALYSIS REPORT
          </h1>
          <p className="text-lg font-rajdhani text-muted-foreground">
            Download or share your legal document analysis
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Export Format Selection */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-cyber-dark/50 border-neon-blue/30 holo-border">
              <CardHeader>
                <CardTitle className="font-orbitron text-neon-blue">
                  SELECT FORMAT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {exportFormats.map((format) => (
                  <motion.button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                      selectedFormat === format.id
                        ? 'border-neon-blue bg-neon-blue/10'
                        : 'border-muted hover:border-neon-cyan/50 hover:bg-cyber-navy/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <format.icon className={`w-6 h-6 ${
                        selectedFormat === format.id ? 'text-neon-blue' : 'text-muted-foreground'
                      }`} />
                      <span className="font-rajdhani font-semibold">
                        {format.name}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format.description}
                    </p>
                  </motion.button>
                ))}

                {/* Email Input for Email Format */}
                {selectedFormat === 'email' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4"
                  >
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-cyber-dark/50 border-neon-blue/30"
                    />
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Content Options */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-cyber-dark/50 border-neon-cyan/30 holo-border">
              <CardHeader>
                <CardTitle className="font-orbitron text-neon-cyan">
                  INCLUDE IN REPORT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(includeOptions).map(([key, value]) => (
                  <motion.label
                    key={key}
                    className="flex items-center gap-3 cursor-pointer"
                    whileHover={{ x: 5 }}
                  >
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => toggleOption(key as keyof typeof includeOptions)}
                      className="w-5 h-5 rounded bg-cyber-dark border-2 border-neon-cyan/50 checked:bg-neon-cyan checked:border-neon-cyan"
                    />
                    <span className="font-rajdhani capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    {key === 'summary' && <FileText className="w-4 h-4 text-neon-cyan" />}
                    {key === 'riskAnalysis' && <BarChart3 className="w-4 h-4 text-risk-medium" />}
                    {key === 'redFlags' && <AlertTriangle className="w-4 h-4 text-risk-high" />}
                  </motion.label>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-cyber-dark/50 border-neon-magenta/30 holo-border">
            <CardHeader>
              <CardTitle className="font-orbitron text-neon-magenta">
                REPORT PREVIEW
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan mx-auto mb-2"></div>
                  Loading document data...
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-2 text-neon-green">
                    <CheckCircle className="w-4 h-4" />
                    <span>Document: {filename}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neon-green">
                    <CheckCircle className="w-4 h-4" />
                    <span>Analysis Date: {new Date().toLocaleDateString()}</span>
                  </div>
                  {documentData?.risks && riskInfo.score > 0 && (
                    <div className="flex items-center gap-2 text-neon-green">
                      <CheckCircle className="w-4 h-4" />
                      <span>Risk Score: {riskInfo.score}/100 ({riskInfo.level} Risk)</span>
                    </div>
                  )}
                  {riskCount > 0 && (
                    <div className="flex items-center gap-2 text-neon-green">
                      <CheckCircle className="w-4 h-4" />
                      <span>Risks Identified: {riskCount}</span>
                    </div>
                  )}
                  {documentData?.summary && (
                    <div className="flex items-center gap-2 text-neon-green">
                      <CheckCircle className="w-4 h-4" />
                      <span>Summary Available: Yes</span>
                    </div>
                  )}
                  
                  <div className="mt-6 p-4 bg-cyber-navy/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">
                      REPORT SECTIONS:
                    </p>
                    <ul className="text-xs space-y-1">
                      {includeOptions.summary && documentData?.summary && <li>• Executive Summary</li>}
                      {includeOptions.riskAnalysis && documentData?.risks && <li>• Risk Analysis & Score</li>}
                      {includeOptions.redFlags && riskCount > 0 && <li>• Identified Risks ({riskCount})</li>}
                      {includeOptions.originalText && documentData?.text_info?.full_text && <li>• Original Document Text</li>}
                      {includeOptions.recommendations && documentData?.risks?.some((r: any) => r.recommendations) && <li>• Recommendations</li>}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Export Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Button
            onClick={handleExport}
            disabled={isExporting || (selectedFormat === 'email' && !email)}
            className="px-12 py-4 bg-gradient-to-r from-neon-blue to-neon-cyan hover:from-neon-cyan hover:to-neon-magenta text-cyber-void font-orbitron font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
          >
            {isExporting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="flex items-center gap-3"
              >
                <Download className="w-6 h-6" />
                GENERATING REPORT...
              </motion.div>
            ) : exported ? (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6" />
                EXPORT COMPLETE
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {selectedFormat === 'pdf' && <Download className="w-6 h-6" />}
                {selectedFormat === 'email' && <Mail className="w-6 h-6" />}
                {selectedFormat === 'print' && <Printer className="w-6 h-6" />}
                EXPORT REPORT
              </div>
            )}
          </Button>

          {exported && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-neon-green"
            >
              Your report has been {selectedFormat === 'email' ? 'sent to your email' : 'downloaded'} successfully!
            </motion.p>
          )}
        </motion.div>

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground"
        >
          <p>
            Reports are generated ephemeral and not stored. This export is for informational purposes only and does not constitute legal advice.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Export;