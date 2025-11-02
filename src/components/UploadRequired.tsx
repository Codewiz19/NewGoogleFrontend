import { motion, AnimatePresence } from "framer-motion";
import { Upload, ArrowLeft, AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface UploadRequiredProps {
  message?: string;
  showBackButton?: boolean;
}

const UploadRequired = ({ 
  message = "Please upload a document first to access this feature.", 
  showBackButton = true 
}: UploadRequiredProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  // Auto-show popup
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-background neural-bg flex items-center justify-center p-8">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative max-w-lg w-full"
          >
            {/* Popup Card with Backdrop */}
            <div className="absolute inset-0 bg-cyber-void/50 backdrop-blur-sm rounded-lg" />
            <motion.div
              className="relative bg-cyber-dark/95 border-2 border-neon-blue/50 rounded-lg p-8 shadow-2xl"
              style={{
                boxShadow: "0 0 40px rgba(59, 130, 246, 0.5), 0 0 80px rgba(59, 130, 246, 0.3)"
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-neon-red transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="flex justify-center mb-6"
              >
                <div className="w-24 h-24 bg-neon-blue/20 rounded-full flex items-center justify-center border-2 border-neon-blue/50">
                  <AlertCircle className="w-12 h-12 text-neon-blue" />
                </div>
              </motion.div>

              {/* Title */}
              <h2 className="text-3xl font-orbitron font-bold mb-4 cyber-glow text-neon-cyan text-center">
                Document Required
              </h2>
              
              {/* Message */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-lg font-rajdhani text-foreground text-center">
                  {message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 items-center">
                <Button
                  onClick={() => navigate("/")}
                  className="w-full bg-neon-blue hover:bg-neon-cyan text-cyber-void font-rajdhani font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Document
                </Button>

                {showBackButton && (
                  <Button
                    onClick={() => navigate(-1)}
                    variant="outline"
                    className="w-full border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 font-rajdhani"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadRequired;
