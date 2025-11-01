import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload as UploadIcon, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Zap,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import API from "@/lib/api";
import { cacheDocument } from "@/lib/documentCache";

const Upload = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileSelection = (selectedFile: File) => {
    // Validate file type and size
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(selectedFile.type)) {
      alert("Please upload a PDF, DOCX, or TXT file.");
      return;
    }

    if (selectedFile.size > maxSize) {
      alert("File size must be less than 10MB.");
      return;
    }

    setFile(selectedFile);
    // Auto-start scanning after successful selection
    handleScanDocument(selectedFile);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleScanDocument = async (fileToScan?: File) => {
    const targetFile = fileToScan ?? file;
    if (!targetFile) return;
    
    setUploading(true);

    const formData = new FormData();
    formData.append("file", targetFile);

    try {
      // Step 1: Upload document
      setUploadProgress("Uploading document...");
      const uploadResponse = await fetch(API.upload, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.detail || "File upload failed.");
      }

      const uploadResult = await uploadResponse.json();
      const docId = uploadResult.doc_id;
      console.log("File uploaded successfully. Document ID:", docId);

      // Cache initial document info
      cacheDocument({
        doc_id: docId,
        filename: targetFile.name,
        uploaded_at: Date.now(),
        corpus_name: uploadResult.corpus_name
      });

      // Navigate to Processing page - it will handle summarize and risks calls
      navigate(`/processing/${docId}`);
    } catch (error) {
      console.error("An error occurred during document processing:", error);
      setUploadProgress("");
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="min-h-screen bg-background neural-bg">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-screen px-6 relative"
      >
        {/* Background Neural Network */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-neon-blue/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3,
                delay: i * 0.5,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12 z-10"
        >
          <motion.h1 
            className="text-6xl font-orbitron font-bold mb-4 cyber-glow"
            animate={{
              textShadow: [
                "0 0 10px hsl(var(--neon-blue))",
                "0 0 20px hsl(var(--neon-cyan))",
                "0 0 10px hsl(var(--neon-blue))"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            UPLOAD YOUR LEGAL DOCUMENT
          </motion.h1>
          <motion.p 
            className="text-xl font-rajdhani text-muted-foreground scan-lines"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            TO UNLOCK CLARITY
          </motion.p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          className="relative z-10"
        >
          <motion.div
            className={`relative w-96 h-96 rounded-full border-4 border-dashed transition-all duration-500 ${
              dragActive 
                ? 'border-neon-cyan bg-neon-cyan/10' 
                : 'border-neon-blue/50 hover:border-neon-blue bg-cyber-dark/30'
            }`}
            whileHover={{ scale: 1.05 }}
            animate={{
              boxShadow: [
                "0 0 30px hsl(var(--neon-blue) / 0.3)",
                "0 0 50px hsl(var(--neon-blue) / 0.5)",
                "0 0 30px hsl(var(--neon-blue) / 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {/* Upload Icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="mb-4"
              >
                <Eye className="w-16 h-16 text-neon-blue" />
              </motion.div>
              
              <UploadIcon className="w-12 h-12 text-neon-cyan mb-4" />
              
              <div className="text-center">
                <p className="font-rajdhani font-semibold text-lg mb-2">
                  Drop file here or click to upload
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, DOCX, TXT • Max 10MB
                </p>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.docx,.txt"
              onChange={handleFileInput}
            />
          </motion.div>
        </motion.div>

        {/* File Preview */}
        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className="mt-8 p-6 bg-cyber-dark/50 rounded-lg border border-neon-blue/30 holo-border backdrop-blur-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-neon-blue/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-neon-blue" />
                </div>
                <div>
                  <h3 className="font-rajdhani font-semibold">{file.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/').pop()?.toUpperCase()}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-neon-green ml-auto" />
              </div>

              <Button
                onClick={() => handleScanDocument()}
                disabled={uploading}
                className="w-full bg-neon-blue hover:bg-neon-cyan text-cyber-void font-rajdhani font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              >
                {uploading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      PROCESSING...
                    </div>
                    {uploadProgress && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {uploadProgress}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    SCAN DOCUMENT
                  </div>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span>Your file is processed ephemerally – deleted after session. 🔒 No storage, no training.</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Upload;