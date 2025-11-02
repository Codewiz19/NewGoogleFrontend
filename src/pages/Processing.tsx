import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Upload, 
  Scissors, 
  Brain, 
  Search,
  Loader2,
  CheckCircle,
  FileText,
  AlertTriangle
} from "lucide-react";
import API from "@/lib/api";
import { cacheDocument, updateCachedDocument } from "@/lib/documentCache";

const Processing = () => {
  const { doc_id } = useParams<{ doc_id: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [summaryReady, setSummaryReady] = useState(false);
  const [risksReady, setRisksReady] = useState(false);

  // Smooth progress animation helper using ref to track current progress
  const progressRef = useRef(0);
  
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const animateProgress = (targetProgress: number, duration: number = 1000) => {
    const startProgress = progressRef.current;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progressRatio, 3);
      const currentProgress = startProgress + (targetProgress - startProgress) * easeOutCubic;
      
      setProgress(currentProgress);
      progressRef.current = currentProgress;
      
      if (progressRatio < 1) {
        requestAnimationFrame(animate);
      } else {
        setProgress(targetProgress);
        progressRef.current = targetProgress;
      }
    };
    
    requestAnimationFrame(animate);
  };

  const steps = [
    {
      id: 'uploading',
      title: 'File Uploaded',
      description: 'Document securely uploaded and ready for analysis',
      icon: Upload,
      duration: 1000
    },
    {
      id: 'processing',
      title: 'Analyzing Document',
      description: 'AI is analyzing your document (summary and risks in parallel)',
      icon: Brain,
      duration: 30000 // Will be updated based on actual API response
    },
    {
      id: 'complete',
      title: 'Processing Complete',
      description: 'Your document is ready to view',
      icon: CheckCircle,
      duration: 1000
    }
  ];

  // Process document - call summarize and risks endpoints
  useEffect(() => {
    if (!doc_id) {
      navigate("/");
      return;
    }

    let mounted = true;
    
    const processDocument = async () => {
      try {
        // Step 1: Upload is complete, move to parallel processing
        setCurrentStep(1);
        animateProgress(25, 800);

        // Step 2: Call summarize and risks endpoints in PARALLEL
        try {
          console.log("Starting parallel processing: summary and risks...");
          
          // Show progress while waiting for both endpoints
          const progressInterval = setInterval(() => {
            setProgress(prev => {
              if (prev < 95) {
                return Math.min(prev + 0.5, 95); // Gradually increase during parallel processing
              }
              return prev;
            });
          }, 100);

          // Call both endpoints SIMULTANEOUSLY using Promise.allSettled
          const [summarizeResult, risksResult] = await Promise.allSettled([
            fetch(API.summarize, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ doc_id }),
            }),
            fetch(API.risks, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ doc_id }),
            }),
          ]);

          clearInterval(progressInterval);

          // Handle summarize response
          if (summarizeResult.status === 'fulfilled' && summarizeResult.value.ok) {
            try {
              const summaryData = await summarizeResult.value.json();
              console.log("Summary generated successfully");
              
              updateCachedDocument(doc_id, {
                summary: summaryData.summary,
                summary_generated_at: Date.now()
              });
              
              if (mounted) {
                setSummaryReady(true);
              }
            } catch (e) {
              console.warn("Error parsing summary response:", e);
            }
          } else {
            console.warn("Summary generation failed or pending");
          }

          // Handle risks response
          if (risksResult.status === 'fulfilled' && risksResult.value.ok) {
            try {
              const risksData = await risksResult.value.json();
              console.log("Risks analyzed successfully");
              
              const risks = risksData.risks || risksData.server_risks || [];
              updateCachedDocument(doc_id, {
                risks: risks,
                risks_generated_at: Date.now()
              });
              
              if (mounted) {
                setRisksReady(true);
              }
            } catch (e) {
              console.warn("Error parsing risks response:", e);
            }
          } else {
            console.warn("Risk analysis failed or pending");
          }

          // Update progress and navigate once both are complete (or attempted)
          if (mounted) {
            animateProgress(100, 1000);
            setCurrentStep(2);
            setIsComplete(true);
            
            // Navigate to document summary after a brief delay
            setTimeout(() => {
              if (mounted) {
                navigate(`/document-summary/${doc_id}`);
              }
            }, 2000);
          }
        } catch (error) {
          console.warn("Parallel processing error:", error);
          if (mounted) {
            animateProgress(100, 1000);
            setCurrentStep(2);
            setIsComplete(true);
            setTimeout(() => {
              if (mounted) {
                navigate(`/document-summary/${doc_id}`);
              }
            }, 2000);
          }
        }
      } catch (error) {
        console.error("Processing error:", error);
        if (mounted) {
          // Still navigate to summary even if there's an error
          setTimeout(() => {
            if (mounted) {
              navigate(`/document-summary/${doc_id}`);
            }
          }, 2000);
        }
      }
    };

    processDocument();

    return () => {
      mounted = false;
    };
  }, [doc_id, navigate]);

  return (
    <div className="min-h-screen bg-background neural-bg flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl text-center"
      >
        {/* Main Progress Indicator */}
        <motion.div
          className="relative w-64 h-64 mx-auto mb-12"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {/* Outer Ring with Smooth Animation */}
          <div className="absolute inset-0 rounded-full border-4 border-cyber-dark">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="hsl(var(--cyber-dark))"
                strokeWidth="4"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="hsl(var(--neon-blue))"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress / 100 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                  filter: `drop-shadow(0 0 3px hsl(var(--neon-blue)))`
                }}
              />
            </svg>
          </div>

          {/* Inner Content */}
          <div className="absolute inset-8 rounded-full bg-cyber-dark/50 backdrop-blur-sm border border-neon-blue/30 flex flex-col items-center justify-center">
            <motion.div
              key={currentStep}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4"
            >
              {React.createElement(steps[currentStep]?.icon || Loader2, {
                className: "w-12 h-12 text-neon-blue",
                ...(steps[currentStep]?.icon ? {} : { 
                  style: { animation: 'spin 1s linear infinite' }
                })
              })}
            </motion.div>
            
            <div className="text-4xl font-orbitron font-bold text-neon-blue">
              {Math.round(progress)}%
            </div>
            
            <div className="text-sm text-muted-foreground mt-2">
              {isComplete ? "Complete!" : "Processing..."}
            </div>
          </div>

          {/* Neural Nodes */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-neon-cyan rounded-full"
              style={{
                left: '50%',
                top: '10px',
                transformOrigin: '0 118px'
              }}
              animate={{
                rotate: i * 45,
                scale: currentStep >= i / 2 ? [1, 1.5, 1] : 1,
                opacity: currentStep >= i / 2 ? [0.5, 1, 0.5] : 0.3
              }}
              transition={{
                rotate: { duration: 0 },
                scale: { duration: 1.5, repeat: Infinity },
                opacity: { duration: 1.5, repeat: Infinity }
              }}
            />
          ))}
        </motion.div>

        {/* Current Step Info */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-orbitron font-bold cyber-glow mb-4">
            {steps[currentStep]?.title || 'Initializing...'}
          </h2>
          <p className="text-lg font-rajdhani text-muted-foreground">
            {steps[currentStep]?.description || 'Preparing to process your document...'}
          </p>
        </motion.div>

        {/* Step Timeline */}
        <div className="flex justify-center items-center gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: index <= currentStep ? 1 : 0.3,
                scale: index === currentStep ? 1.1 : 1
              }}
            >
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                index < currentStep 
                  ? 'border-neon-green bg-neon-green/20' 
                  : index === currentStep 
                    ? 'border-neon-blue bg-neon-blue/20' 
                    : 'border-cyber-dark bg-cyber-dark/20'
              }`}>
                {index < currentStep ? (
                  <CheckCircle className="w-6 h-6 text-neon-green" />
                ) : (
                  <step.icon className={`w-6 h-6 ${
                    index === currentStep ? 'text-neon-blue' : 'text-muted-foreground'
                  }`} />
                )}
              </div>
              
              <div className="text-xs font-rajdhani text-center max-w-20">
                {step.title}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Neural Background Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-neon-blue/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 200 - 100],
                y: [0, Math.random() * 200 - 100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Processing Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Average processing time: 30-45 seconds (parallel processing) • Your document remains private and ephemeral
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Processing;