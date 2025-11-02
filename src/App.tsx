import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Upload from "./pages/Upload";
import Processing from "./pages/Processing";
import DocumentSummary from "./pages/DocumentSummary";
import RiskAnalysis from "./pages/RiskAnalysis";
import ChatBot from "./pages/ChatBot";
import Export from "./pages/Export";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Upload />} />
            <Route path="processing/:doc_id" element={<Processing />} />
            <Route path="document-summary/:doc_id" element={<DocumentSummary />} />
            <Route path="document-summary" element={<DocumentSummary />} />
            <Route path="risk-analysis/:doc_id" element={<RiskAnalysis />} />
            <Route path="risk-analysis" element={<RiskAnalysis />} />
            <Route path="chat/:doc_id" element={<ChatBot />} />
            <Route path="chat" element={<ChatBot />} />
            <Route path="export/:doc_id" element={<Export />} />
            <Route path="export" element={<Export />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
