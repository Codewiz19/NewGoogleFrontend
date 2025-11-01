import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import UploadRequired from "@/components/UploadRequired";
import { 
  Send, 
  Brain, 
  User,
  Trash2,
  Mic,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import API from "@/lib/api";
import { getCachedDocument, getCurrentDocId } from "@/lib/documentCache";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: { page: number; text: string }[];
  relatedLinks?: { title: string; url: string }[];
}

const ChatBot = () => {
  const { doc_id: paramDocId } = useParams<{ doc_id?: string }>();
  const navigate = useNavigate();
  // Use doc_id from params or get from cache
  const cachedDocId = getCurrentDocId();
  const doc_id = paramDocId || cachedDocId;

  // Get cached document info for context
  const cachedDoc = doc_id ? getCachedDocument(doc_id) : null;
  const hasDocument = !!(cachedDoc || doc_id);

  // Redirect to URL with doc_id if we have cached doc_id but no param
  useEffect(() => {
    if (cachedDocId && !paramDocId && cachedDocId.trim()) {
      navigate(`/chat/${cachedDocId}`, { replace: true });
    }
  }, [cachedDocId, paramDocId, navigate]);

  if (!hasDocument) {
    return <UploadRequired message="Please upload a document first to start chatting with the AI assistant." />;
  }

  // Initialize messages with proper doc_id and cachedDoc context
  const getInitialMessage = (): Message => {
    if (doc_id && cachedDoc?.filename) {
      return {
        id: '1',
        type: 'bot',
        content: `Hi! I'm LensBot, your AI legal assistant. I'm here to help you understand ${cachedDoc.filename}. Ask me anything about the document, and I'll reference the original text and provide simplified explanations.`,
        timestamp: new Date(),
        confidence: 95
      };
    } else if (doc_id) {
      return {
        id: '1',
        type: 'bot',
        content: "Hi! I'm LensBot, your AI legal assistant. Ask me anything about your document, and I'll reference the original text and provide simplified explanations.",
        timestamp: new Date(),
        confidence: 95
      };
    } else {
      return {
        id: '1',
        type: 'bot',
        content: "Hi! I'm LensBot, your AI legal assistant. Please provide a document ID to start asking questions.",
        timestamp: new Date(),
        confidence: 95
      };
    }
  };

  const [messages, setMessages] = useState<Message[]>([getInitialMessage()]);
  
  // Update greeting message when doc_id or cachedDoc filename changes (only if greeting is still present)
  useEffect(() => {
    // Only update if we still have just the initial greeting message
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === '1') {
        return [getInitialMessage()];
      }
      return prev;
    });
  }, [doc_id]); // Only depend on doc_id to avoid infinite loops
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "What if I break the lease early?",
    "Explain the liability waiver",
    "What are my maintenance responsibilities?",
    "Can the landlord raise rent during the lease?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !doc_id) {
      console.error("Cannot send message: missing doc_id or input");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // Build messages array for chat context (excluding the greeting message)
      const previousMessages = messages
        .filter(m => m.id !== '1') // Exclude initial greeting
        .slice(-5) // Last 5 messages for context
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));
      
      const chatMessages = [
        ...previousMessages,
        { role: "user", content: currentInput }
      ];

      const response = await fetch(API.chat, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doc_id,
          messages: chatMessages,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to get chat response.");
      }

      const chatData = await response.json();
      
      // Update session ID if provided
      if (chatData.session_id) {
        setSessionId(chatData.session_id);
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: chatData.response || "I'm sorry, I couldn't generate a response. Please try again.",
        timestamp: new Date(),
        confidence: chatData.fallback ? 70 : 90,
        sources: chatData.sources || [],
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `Error: ${(error as Error).message}. Please try again.`,
        timestamp: new Date(),
        confidence: 0,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };


  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const clearChat = () => {
    setMessages([messages[0]]); // Keep only the greeting
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-muted-foreground';
    if (confidence >= 90) return 'text-neon-green';
    if (confidence >= 70) return 'text-risk-medium';
    return 'text-risk-high';
  };

  return (
    <div className="min-h-screen bg-background neural-bg">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
              className="w-16 h-16 bg-gradient-to-br from-neon-blue to-neon-cyan rounded-full flex items-center justify-center"
            >
              <Brain className="w-8 h-8 text-cyber-void" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-orbitron font-bold cyber-glow">
                LENS<span className="text-neon-cyan">BOT</span>
              </h1>
              <p className="text-sm font-rajdhani text-muted-foreground">
                AI Legal Assistant
              </p>
            </div>
          </div>
        </motion.div>

        {/* Chat Container */}
        <Card className="h-[600px] bg-cyber-dark/50 border-neon-blue/30 holo-border flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-neon-blue/20 border border-neon-blue/30' 
                      : 'bg-neon-cyan/20 border border-neon-cyan/30'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-5 h-5 text-neon-blue" />
                    ) : (
                      <Brain className="w-5 h-5 text-neon-cyan" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-neon-blue/20 border border-neon-blue/30 ml-12'
                        : 'bg-cyber-navy/30 border border-neon-cyan/30 mr-12'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      
                      {/* Bot-specific features */}
                      {message.type === 'bot' && (
                        <div className="mt-4 space-y-3">
                          {/* Confidence Indicator */}
                          {message.confidence && (
                            <div className="flex items-center gap-2 text-xs">
                              <div className={`w-2 h-2 rounded-full ${getConfidenceColor(message.confidence)}`} />
                              <span className="text-muted-foreground">
                                Confidence: {message.confidence}%
                              </span>
                              {message.confidence < 80 && (
                                <span className="text-risk-medium">
                                  - Consider consulting a professional
                                </span>
                              )}
                            </div>
                          )}

                          {/* Source References */}
                          {message.sources && (
                            <div className="space-y-2">
                              <div className="text-xs text-neon-cyan font-rajdhani font-semibold">
                                ORIGINAL TEXT REFERENCE:
                              </div>
                              {message.sources.map((source, index) => (
                                <div key={index} className="p-3 bg-cyber-dark/50 rounded border-l-2 border-neon-cyan">
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Page {source.page}
                                  </div>
                                  <p className="text-xs font-mono italic">
                                    "{source.text}..."
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Related Links */}
                          {message.relatedLinks && (
                            <div className="space-y-2">
                              <div className="text-xs text-neon-cyan font-rajdhani font-semibold">
                                LEARN MORE:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {message.relatedLinks.map((link, index) => (
                                  <button
                                    key={index}
                                    className="text-xs px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20 transition-colors flex items-center gap-1"
                                  >
                                    {link.title}
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground mt-1 px-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-neon-cyan" />
                </div>
                <div className="bg-cyber-navy/30 border border-neon-cyan/30 rounded-2xl p-4">
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-neon-cyan rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="p-4 border-t border-neon-blue/20">
              <div className="text-xs text-muted-foreground mb-3 font-rajdhani">
                SUGGESTED QUESTIONS:
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-xs px-3 py-2 rounded-lg bg-cyber-navy/30 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-neon-blue/20">
            <div className="flex gap-3">
              <div className="flex-1 flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={doc_id ? "Ask me about your legal document..." : "Please upload a document first..."}
                  className="bg-cyber-dark/50 border-neon-blue/30 text-foreground placeholder:text-muted-foreground"
                  disabled={isTyping || !doc_id}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                  disabled
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping || !doc_id}
                className="bg-neon-blue hover:bg-neon-cyan text-cyber-void"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                onClick={clearChat}
                variant="outline"
                className="border-risk-medium/30 text-risk-medium hover:bg-risk-medium/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <AlertCircle className="w-3 h-3" />
              <span>
                Based on document analysis • For legal advice, consult a professional
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatBot;