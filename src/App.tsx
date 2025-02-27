
import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import About from "@/pages/About";
import Pricing from "@/pages/Pricing";
import SubmitSettlement from "@/pages/SubmitSettlement";
import Leaderboard from "@/pages/Leaderboard";
import SettlementDetail from "@/pages/SettlementDetail";
import NotFound from "@/pages/NotFound";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ManageSettlements from "@/pages/ManageSettlements";
import PaymentSelection from "@/pages/PaymentSelection";
import SubmissionConfirmation from "@/pages/SubmissionConfirmation";
import PaymentTest from "@/pages/PaymentTest";
import FAQ from "@/pages/FAQ";
import "./App.css";

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/submit" element={<SubmitSettlement />} />
          <Route path="/settlements" element={<Leaderboard />} />
          <Route path="/settlements/:id" element={<SettlementDetail />} />
          <Route path="/manage" element={<ManageSettlements />} />
          <Route path="/payment-selection" element={<PaymentSelection />} />
          <Route path="/submission-confirmation" element={<SubmissionConfirmation />} />
          <Route path="/payment-test" element={<PaymentTest />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
