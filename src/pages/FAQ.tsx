
import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/settlement/LoadingState";

// Lazy load the Accordion components
const LazyAccordion = lazy(() => import("@/components/ui/accordion").then(module => ({
  default: module.Accordion
})));
const LazyAccordionContent = lazy(() => import("@/components/ui/accordion").then(module => ({
  default: module.AccordionContent
})));
const LazyAccordionItem = lazy(() => import("@/components/ui/accordion").then(module => ({
  default: module.AccordionItem
})));
const LazyAccordionTrigger = lazy(() => import("@/components/ui/accordion").then(module => ({
  default: module.AccordionTrigger
})));

// A lightweight fallback for accordion items
const AccordionFallback = () => (
  <div className="py-4 px-2 border-b border-neutral-200">
    <div className="h-6 w-3/4 bg-neutral-100 rounded animate-pulse"></div>
  </div>
);

const FAQ = () => {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-display text-neutral-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Find answers to common questions about SettlementWins and how it can help your practice
          </p>
        </div>

        <div className="space-y-8">
          {/* About SettlementWins */}
          <div>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">About SettlementWins</h2>
            <Suspense fallback={<div className="space-y-4">{[1, 2].map(i => <AccordionFallback key={i} />)}</div>}>
              <LazyAccordion type="multiple" className="w-full">
                <LazyAccordionItem value="what-is-settlementwins">
                  <LazyAccordionTrigger>What is SettlementWins?</LazyAccordionTrigger>
                  <LazyAccordionContent className="text-left">
                    SettlementWins is the first platform dedicated to showcasing attorneys' settlement victories. 
                    We provide a professional, searchable gallery that turns your settlement wins into powerful 
                    marketing assets.
                  </LazyAccordionContent>
                </LazyAccordionItem>

                <LazyAccordionItem value="who-is-settlementwins-for">
                  <LazyAccordionTrigger>Who is SettlementWins for?</LazyAccordionTrigger>
                  <LazyAccordionContent className="text-left">
                    Our platform is designed primarily for individual attorneys and small to mid-sized personal 
                    injury law firms looking to showcase their successful cases and gain recognition for their 
                    track record.
                  </LazyAccordionContent>
                </LazyAccordionItem>
              </LazyAccordion>
            </Suspense>
          </div>

          {/* Submission Process */}
          <div>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Submission Process</h2>
            <Suspense fallback={<div className="space-y-4">{[1, 2, 3, 4].map(i => <AccordionFallback key={i} />)}</div>}>
              <LazyAccordion type="multiple" className="w-full">
                <LazyAccordionItem value="how-to-submit">
                  <LazyAccordionTrigger>How do I submit a settlement?</LazyAccordionTrigger>
                  <LazyAccordionContent className="text-left">
                    Simply click the "Submit Settlement" button, complete our streamlined form with your settlement details, 
                    make a payment, and your settlement will be published immediately on our platform.
                  </LazyAccordionContent>
                </LazyAccordionItem>

                <LazyAccordionItem value="info-needed">
                  <LazyAccordionTrigger>What information do I need to provide?</LazyAccordionTrigger>
                  <LazyAccordionContent className="text-left">
                    You'll need to provide the settlement amount, case type, attorney name, firm name, settlement date, 
                    location, and optional additional details about the case. Client names can remain confidential.
                  </LazyAccordionContent>
                </LazyAccordionItem>

                <LazyAccordionItem value="immediate-publishing">
                  <LazyAccordionTrigger>Is my settlement published immediately?</LazyAccordionTrigger>
                  <LazyAccordionContent className="text-left">
                    Yes. Once your payment is processed, your settlement appears on our platform automatically, 
                    giving you immediate visibility.
                  </LazyAccordionContent>
                </LazyAccordionItem>

                <LazyAccordionItem value="edit-after-submission">
                  <LazyAccordionTrigger>Can I edit my settlement after submission?</LazyAccordionTrigger>
                  <LazyAccordionContent className="text-left">
                    Absolutely. You can edit your settlement details anytime through your account dashboard. 
                    <Link to="/manage" className="text-primary-600 hover:underline ml-1">
                      Log in to your account
                    </Link> to access and update your submissions.
                  </LazyAccordionContent>
                </LazyAccordionItem>
              </LazyAccordion>
            </Suspense>
          </div>

          {/* Privacy & Security */}
          <div>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Privacy & Security</h2>
            <Suspense fallback={<div className="space-y-4">{[1, 2].map(i => <AccordionFallback key={i} />)}</div>}>
              <LazyAccordion type="multiple" className="w-full">
                <LazyAccordionItem value="client-confidentiality">
                  <LazyAccordionTrigger>Is client information kept confidential?</LazyAccordionTrigger>
                  <LazyAccordionContent className="text-left">
                    Yes. We only display the information you choose to share. Client names and identifying details 
                    are not required for submission.
                  </LazyAccordionContent>
                </LazyAccordionItem>

                <LazyAccordionItem value="payment-security">
                  <LazyAccordionTrigger>How secure is my payment information?</LazyAccordionTrigger>
                  <LazyAccordionContent className="text-left">
                    We use Stripe, an industry-leading payment processor with the highest security standards, 
                    to handle all transactions. Your payment information is never stored on our servers.
                  </LazyAccordionContent>
                </LazyAccordionItem>
              </LazyAccordion>
            </Suspense>
          </div>

          {/* Pricing & Plans */}
          <div>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Pricing & Plans</h2>
            <Suspense fallback={<div className="space-y-4">{[1, 2].map(i => <AccordionFallback key={i} />)}</div>}>
              <LazyAccordion type="multiple" className="w-full">
                <LazyAccordionItem value="cost">
                  <LazyAccordionTrigger>How much does it cost to submit a settlement?</LazyAccordionTrigger>
                  <LazyAccordionContent className="text-left">
                    We offer one pricing option of $199 monthly per month for unlimited submissions.
                  </LazyAccordionContent>
                </LazyAccordionItem>

                <LazyAccordionItem value="cancel-subscription">
                  <LazyAccordionTrigger>Can I cancel my subscription?</LazyAccordionTrigger>
                  <LazyAccordionContent className="text-left">
                    Yes, you can cancel your monthly subscription at any time. Your existing settlements will 
                    be delisted when your billing cycle ends.
                  </LazyAccordionContent>
                </LazyAccordionItem>
              </LazyAccordion>
            </Suspense>
          </div>

          {/* Platform Benefits */}
          <div>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Platform Benefits</h2>
            <Suspense fallback={<div className="space-y-4">{[1, 2, 3].map(i => <AccordionFallback key={i} />)}</div>}>
              <LazyAccordion type="multiple" className="w-full">
                <LazyAccordionItem value="how-it-helps">
                  <LazyAccordionTrigger>How does SettlementWins help my practice?</LazyAccordionTrigger>
                  <LazyAccordionContent className="text-left">
                    <p>SettlementWins transforms your past victories into marketing assets by:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Building credibility with potential clients</li>
                      <li>Creating visibility among peers in your practice area</li>
                      <li>Providing third-party validation of your success</li>
                      <li>Turning settlements into shareable content for your marketing</li>
                    </ul>
                  </LazyAccordionContent>
                </LazyAccordionItem>

                <LazyAccordionItem value="client-discovery">
                  <LazyAccordionTrigger>Can potential clients find me through SettlementWins?</LazyAccordionTrigger>
                  <LazyAccordionContent className="text-left">
                    Yes. Potential clients can discover attorneys based on case types, settlement amounts, and locations. 
                    Each settlement links to your attorney profile, making it easy for prospects to see your track record.
                  </LazyAccordionContent>
                </LazyAccordionItem>

                <LazyAccordionItem value="difference-from-directories">
                  <LazyAccordionTrigger>How is SettlementWins different from other legal directories?</LazyAccordionTrigger>
                  <LazyAccordionContent className="text-left">
                    Unlike general legal directories, we focus exclusively on settlement victories, creating a specialized 
                    platform that highlights your actual results rather than just your credentials or practice areas.
                  </LazyAccordionContent>
                </LazyAccordionItem>
              </LazyAccordion>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
