
import { useEffect } from "react";

const Terms = () => {
  useEffect(() => {
    // Scroll to top when the page loads
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">TERMS OF SERVICE</h1>
      <p className="text-sm text-neutral-500 mb-8">Last Updated: February 27, 2025</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. ACCEPTANCE OF TERMS</h2>
        <p className="mb-4">
          Welcome to SettlementWins. These Terms of Service ("Terms") constitute a legally binding agreement between you and SettlementWins ("we," "our," or "us") governing your access to and use of the SettlementWins website, services, and content (collectively, the "Services").
        </p>
        <p className="mb-4">
          By accessing or using the Services, you agree to be bound by these Terms. If you do not agree to all the terms and conditions of this agreement, you may not access or use the Services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. DESCRIPTION OF SERVICES</h2>
        <p className="mb-4">
          SettlementWins is a platform that enables attorneys to showcase their settlement victories and case results. Our Services include:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>A listing service for attorneys to publish information about their settlements</li>
          <li>Tools for users to browse, filter, and view published settlements</li>
          <li>Account management and settlement submission functionality</li>
          <li>Payment processing for listing settlements</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">3. USER ACCOUNTS AND REGISTRATION</h2>
        
        <h3 className="text-lg font-semibold mb-3">3.1 Registration Requirements</h3>
        <p className="mb-4">
          To submit settlements, you must provide accurate and complete information during the submission process, including your attorney name, email address, and payment information.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">3.2 Account Security</h3>
        <p className="mb-4">
          You are responsible for maintaining the confidentiality of your account information, including any edit links or tokens provided to you. You are fully responsible for all activities that occur under your account or through your edit links.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">3.3 Unauthorized Access</h3>
        <p className="mb-4">
          You agree to notify us immediately of any unauthorized use of your account or any other breach of security. We cannot and will not be liable for any loss or damage arising from your failure to comply with this section.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">4. USER CONTENT</h2>
        
        <h3 className="text-lg font-semibold mb-3">4.1 Content Ownership</h3>
        <p className="mb-4">
          You retain ownership of the content you submit to our Services ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display such content in connection with providing and promoting the Services.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">4.2 Content Responsibility</h3>
        <p className="mb-4">
          You are solely responsible for all User Content that you submit to the Services. By submitting User Content, you represent and warrant that:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>You are an attorney or authorized representative of an attorney or law firm</li>
          <li>You have the right to submit the User Content and grant the licenses described in these Terms</li>
          <li>The User Content is accurate, truthful, and not misleading</li>
          <li>The User Content does not violate these Terms, applicable law, or the rights of any third party</li>
          <li>The User Content does not contain any confidential client information</li>
        </ul>
        
        <h3 className="text-lg font-semibold mb-3">4.3 Content Disclaimer</h3>
        <p className="mb-4">
          WE DO NOT VERIFY OR VALIDATE THE ACCURACY OR AUTHENTICITY OF USER CONTENT. SettlementWins is a listing service that displays information provided by users and does not independently verify the accuracy, completeness, or legitimacy of any settlement information submitted to the platform.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">4.4 Prohibited Content</h3>
        <p className="mb-4">
          You agree not to submit User Content that:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Is false, fraudulent, deceptive, or misleading</li>
          <li>Violates client confidentiality or attorney-client privilege</li>
          <li>Violates any court order, settlement agreement, or confidentiality provision</li>
          <li>Infringes upon or violates any third party's rights, including intellectual property rights</li>
          <li>Contains personally identifiable information about clients without proper authorization</li>
          <li>Is defamatory, libelous, threatening, harassing, or promotes illegal activities</li>
          <li>Contains viruses, malware, or other harmful code</li>
        </ul>
        
        <h3 className="text-lg font-semibold mb-3">4.5 Content Removal</h3>
        <p className="mb-4">
          We reserve the right, but not the obligation, to review, monitor, or remove User Content, in our sole discretion, at any time and for any reason, without notice to you.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">5. PAYMENT TERMS</h2>
        
        <h3 className="text-lg font-semibold mb-3">5.1 Fees and Payment</h3>
        <p className="mb-4">
          We charge fees for submitting settlements to our platform. Current pricing is available on our website. All fees are in U.S. dollars and are non-refundable except as required by law or as expressly stated in these Terms.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">5.2 Subscription Terms</h3>
        <p className="mb-4">
          If you purchase a subscription plan, you authorize us to charge the applicable fees to your designated payment method on a recurring basis until you cancel your subscription.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">5.3 Cancellation</h3>
        <p className="mb-4">
          You may cancel your subscription at any time through your account settings or by contacting us. Upon cancellation, you will continue to have access to the subscription benefits until the end of your current billing period, at which point your subscription will terminate.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">5.4 Fee Changes</h3>
        <p className="mb-4">
          We reserve the right to change our fees or billing methods at any time. We will provide notice of any price changes at least 30 days before they become effective. Your continued use of the Services after the price change becomes effective constitutes your agreement to pay the modified fees.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">6. INTELLECTUAL PROPERTY RIGHTS</h2>
        
        <h3 className="text-lg font-semibold mb-3">6.1 Our Intellectual Property</h3>
        <p className="mb-4">
          The Services and all content, features, and functionality (including but not limited to text, graphics, logos, icons, images, audio clips, software, and the design, selection, and arrangement thereof) are owned by SettlementWins, our licensors, or other providers and are protected by copyright, trademark, and other intellectual property laws.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">6.2 Limited License</h3>
        <p className="mb-4">
          We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Services for their intended purposes in accordance with these Terms.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">6.3 Restrictions</h3>
        <p className="mb-4">
          You may not:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any content on our Services, except as permitted by these Terms</li>
          <li>Use any data mining, robots, or similar data gathering or extraction methods</li>
          <li>Use the Services in any manner that could disable, overburden, damage, or impair the Services or interfere with any other party's use of the Services</li>
          <li>Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Services or any server, computer, or database connected to the Services</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">7. DISCLAIMERS</h2>
        
        <h3 className="text-lg font-semibold mb-3">7.1 "AS IS" Basis</h3>
        <p className="mb-4">
          THE SERVICES AND ALL CONTENT ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">7.2 No Warranties</h3>
        <p className="mb-4">
          TO THE FULLEST EXTENT PROVIDED BY LAW, WE HEREBY DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, STATUTORY OR OTHERWISE, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY, NON-INFRINGEMENT, AND FITNESS FOR PARTICULAR PURPOSE.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">7.3 Content Disclaimer</h3>
        <p className="mb-4">
          WE MAKE NO WARRANTY OR REPRESENTATION REGARDING THE ACCURACY, COMPLETENESS, RELIABILITY, OR LEGITIMACY OF ANY USER CONTENT, INCLUDING SETTLEMENT INFORMATION. USERS ARE SOLELY RESPONSIBLE FOR VERIFYING ANY INFORMATION BEFORE RELYING ON IT.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">7.4 Third-Party Content</h3>
        <p className="mb-4">
          The Services may include content provided by third parties, including materials provided by other users and third-party licensors. All statements and/or opinions expressed in such materials, and all articles and responses to questions and other content, other than the content provided by us, are solely the responsibility of the person or entity providing those materials.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">8. LIMITATION OF LIABILITY</h2>
        
        <h3 className="text-lg font-semibold mb-3">8.1 Limitation of Liability</h3>
        <p className="mb-4">
          TO THE FULLEST EXTENT PROVIDED BY LAW, IN NO EVENT WILL SETTLEMENTWINS, ITS AFFILIATES, OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN CONNECTION WITH YOUR USE, OR INABILITY TO USE, THE SERVICES, ANY WEBSITES LINKED TO THEM, ANY CONTENT ON THE SERVICES OR SUCH OTHER WEBSITES, INCLUDING ANY DIRECT, INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO, PERSONAL INJURY, PAIN AND SUFFERING, EMOTIONAL DISTRESS, LOSS OF REVENUE, LOSS OF PROFITS, LOSS OF BUSINESS OR ANTICIPATED SAVINGS, LOSS OF USE, LOSS OF GOODWILL, LOSS OF DATA, AND WHETHER CAUSED BY TORT (INCLUDING NEGLIGENCE), BREACH OF CONTRACT, OR OTHERWISE, EVEN IF FORESEEABLE.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">8.2 Cap on Liability</h3>
        <p className="mb-4">
          IN NO EVENT WILL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE AMOUNT YOU HAVE PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE LIABILITY.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">8.3 Essential Purpose</h3>
        <p className="mb-4">
          THE LIMITATIONS OF DAMAGES SET FORTH ABOVE ARE FUNDAMENTAL ELEMENTS OF THE BASIS OF THE BARGAIN BETWEEN YOU AND SETTLEMENTWINS.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">9. INDEMNIFICATION</h2>
        <p className="mb-4">
          You agree to defend, indemnify, and hold harmless SettlementWins, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Services, including, but not limited to, your User Content, any use of the Services' content, services, and products other than as expressly authorized in these Terms, or your use of any information obtained from the Services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">10. DISPUTE RESOLUTION</h2>
        
        <h3 className="text-lg font-semibold mb-3">10.1 Governing Law</h3>
        <p className="mb-4">
          These Terms and your use of the Services shall be governed by and construed in accordance with the laws of the State of California, without giving effect to any choice or conflict of law provision or rule.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">10.2 Jurisdiction and Venue</h3>
        <p className="mb-4">
          Any legal suit, action, or proceeding arising out of, or related to, these Terms or the Services shall be instituted exclusively in the federal courts of the United States or the courts of the State of California, although we retain the right to bring any suit, action, or proceeding against you for breach of these Terms in your country of residence or any other relevant country.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">10.3 Arbitration</h3>
        <p className="mb-4">
          At our sole discretion, we may require you to submit any disputes arising from these Terms or your use of the Services, including disputes arising from or concerning their interpretation, violation, invalidity, non-performance, or termination, to final and binding arbitration under the Rules of Arbitration of the American Arbitration Association applying California law.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">10.4 Limitation on Time to File Claims</h3>
        <p className="mb-4">
          ANY CAUSE OF ACTION OR CLAIM YOU MAY HAVE ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICES MUST BE COMMENCED WITHIN ONE (1) YEAR AFTER THE CAUSE OF ACTION ACCRUES; OTHERWISE, SUCH CAUSE OF ACTION OR CLAIM IS PERMANENTLY BARRED.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">11. TERMINATION</h2>
        
        <h3 className="text-lg font-semibold mb-3">11.1 Termination by You</h3>
        <p className="mb-4">
          You may terminate your use of the Services at any time by discontinuing use of the Services or by canceling any subscription services according to the cancellation procedures.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">11.2 Termination by Us</h3>
        <p className="mb-4">
          We may terminate or suspend your access to all or part of the Services, at any time and without prior notice, for any reason, including, without limitation, breach of these Terms.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">11.3 Effect of Termination</h3>
        <p className="mb-4">
          Upon termination, your right to use the Services will immediately cease. The following provisions shall survive termination: Sections 4 (User Content), 6 (Intellectual Property Rights), 7 (Disclaimers), 8 (Limitation of Liability), 9 (Indemnification), 10 (Dispute Resolution), and any other provision that by its terms or nature is intended to survive termination.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">12. CHANGES TO TERMS</h2>
        <p className="mb-4">
          We may revise and update these Terms from time to time in our sole discretion. All changes are effective immediately when we post them and apply to all access to and use of the Services thereafter.
        </p>
        <p className="mb-4">
          Your continued use of the Services following the posting of revised Terms means that you accept and agree to the changes. You are expected to check this page frequently so you are aware of any changes, as they are binding on you.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">13. GENERAL PROVISIONS</h2>
        
        <h3 className="text-lg font-semibold mb-3">13.1 Entire Agreement</h3>
        <p className="mb-4">
          These Terms, our Privacy Policy, and any other agreements expressly incorporated by reference herein constitute the sole and entire agreement between you and SettlementWins regarding the Services and supersede all prior and contemporaneous understandings, agreements, representations, and warranties, both written and oral, regarding the Services.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">13.2 Waiver</h3>
        <p className="mb-4">
          No waiver by us of any term or condition set out in these Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition, and any failure by us to assert a right or provision under these Terms shall not constitute a waiver of such right or provision.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">13.3 Severability</h3>
        <p className="mb-4">
          If any provision of these Terms is held by a court or other tribunal of competent jurisdiction to be invalid, illegal, or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of the Terms will continue in full force and effect.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">13.4 Assignment</h3>
        <p className="mb-4">
          You may not assign or transfer these Terms, by operation of law or otherwise, without our prior written consent. Any attempt by you to assign or transfer these Terms without such consent will be null and void. We may freely assign or transfer these Terms without restriction.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">13.5 No Third-Party Beneficiaries</h3>
        <p className="mb-4">
          These Terms do not confer any rights, remedies, obligations, or liabilities upon any person or entity other than you and SettlementWins.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">14. CONTACT INFORMATION</h2>
        <p className="mb-4">
          If you have any questions about these Terms, please contact us at:
        </p>
        <p className="mb-4">
          Email: <a href="mailto:support@settlementwins.com" className="text-primary-600 hover:underline">support@settlementwins.com</a>
        </p>
      </section>
    </div>
  );
};

export default Terms;
