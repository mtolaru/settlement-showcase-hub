
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { LoadingState } from "./components/settlement/LoadingState";

// Eagerly load the homepage for fast initial load
import Index from "./pages/Index";

// Lazy load other pages to improve initial load time
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminImport = lazy(() => import("./pages/AdminImport"));
const SubmitSettlement = lazy(() => import("./pages/SubmitSettlement"));
const ManageSettlements = lazy(() => import("./pages/ManageSettlements"));
const SettlementDetail = lazy(() => import("./pages/SettlementDetail"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const SubmissionConfirmation = lazy(() => import("./pages/SubmissionConfirmation"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Pricing = lazy(() => import("./pages/Pricing"));

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
        <Navbar />
        <Suspense fallback={<LoadingState message="Loading page..." />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin/import" element={<AdminImport />} />
            <Route path="/submit" element={<SubmitSettlement />} />
            <Route path="/manage" element={<ManageSettlements />} />
            <Route path="/settlements" element={<Leaderboard />} />
            <Route path="/settlements/:id" element={<SettlementDetail />} />
            <Route path="/confirmation" element={<SubmissionConfirmation />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
