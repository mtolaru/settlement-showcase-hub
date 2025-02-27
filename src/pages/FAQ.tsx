
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

const FAQ = () => {
  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-display text-neutral-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Find answers to common questions about SettlementWins and how it can help your practice
          </p>
        </div>

        <div className="space-y-8">
          {/* About SettlementWins */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-primary-900 mb-4">About SettlementWins</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is-settlementwins">
                <AccordionTrigger>What is SettlementWins?</AccordionTrigger>
                <AccordionContent>
                  SettlementWins is the first platform dedicated to showcasing attorneys' settlement victories. 
                  We provide a professional, searchable gallery that turns your settlement wins into powerful 
                  marketing assets.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="who-is-settlementwins-for">
                <AccordionTrigger>Who is SettlementWins for?</AccordionTrigger>
                <AccordionContent>
                  Our platform is designed primarily for individual attorneys and small to mid-sized personal 
                  injury law firms looking to showcase their successful cases and gain recognition for their 
                  track record.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          {/* Submission Process */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Submission Process</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="how-to-submit">
                <AccordionTrigger>How do I submit a settlement?</AccordionTrigger>
                <AccordionContent>
                  Simply click the "Submit Settlement" button, complete our streamlined form with your settlement details, 
                  make a payment, and your settlement will be published immediately on our platform.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="info-needed">
                <AccordionTrigger>What information do I need to provide?</AccordionTrigger>
                <AccordionContent>
                  You'll need to provide the settlement amount, case type, attorney name, firm name, settlement date, 
                  location, and optional additional details about the case. Client names can remain confidential.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="immediate-publishing">
                <AccordionTrigger>Is my settlement published immediately?</AccordionTrigger>
                <AccordionContent>
                  Yes. Once your payment is processed, your settlement appears on our platform automatically, 
                  giving you immediate visibility.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="edit-after-submission">
                <AccordionTrigger>Can I edit my settlement after submission?</AccordionTrigger>
                <AccordionContent>
                  Absolutely.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          {/* Privacy & Security */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Privacy & Security</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="client-confidentiality">
                <AccordionTrigger>Is client information kept confidential?</AccordionTrigger>
                <AccordionContent>
                  Yes. We only display the information you choose to share. Client names and identifying details 
                  are not required for submission.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="payment-security">
                <AccordionTrigger>How secure is my payment information?</AccordionTrigger>
                <AccordionContent>
                  We use Stripe, an industry-leading payment processor with the highest security standards, 
                  to handle all transactions. Your payment information is never stored on our servers.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          {/* Pricing & Plans */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Pricing & Plans</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="cost">
                <AccordionTrigger>How much does it cost to submit a settlement?</AccordionTrigger>
                <AccordionContent>
                  We offer one pricing option of $199 monthly per month for unlimited submissions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cancel-subscription">
                <AccordionTrigger>Can I cancel my subscription?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can cancel your monthly subscription at any time. Your existing settlements will 
                  remain on the platform.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          {/* Platform Benefits */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Platform Benefits</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="how-it-helps">
                <AccordionTrigger>How does SettlementWins help my practice?</AccordionTrigger>
                <AccordionContent>
                  <p>SettlementWins transforms your past victories into marketing assets by:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Building credibility with potential clients</li>
                    <li>Creating visibility among peers in your practice area</li>
                    <li>Providing third-party validation of your success</li>
                    <li>Turning settlements into shareable content for your marketing</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="client-discovery">
                <AccordionTrigger>Can potential clients find me through SettlementWins?</AccordionTrigger>
                <AccordionContent>
                  Yes. Potential clients can discover attorneys based on case types, settlement amounts, and locations. 
                  Each settlement links to your attorney profile, making it easy for prospects to see your track record.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="difference-from-directories">
                <AccordionTrigger>How is SettlementWins different from other legal directories?</AccordionTrigger>
                <AccordionContent>
                  Unlike general legal directories, we focus exclusively on settlement victories, creating a specialized 
                  platform that highlights your actual results rather than just your credentials or practice areas.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
