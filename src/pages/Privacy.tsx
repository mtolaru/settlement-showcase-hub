
import { useEffect } from "react";
import { format } from "date-fns";

const Privacy = () => {
  useEffect(() => {
    // Scroll to top when the page loads
    window.scrollTo(0, 0);
  }, []);

  const currentDate = format(new Date(), "MMMM d, yyyy");

  return (
    <div className="container py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">PRIVACY POLICY</h1>
      <p className="text-sm text-neutral-500 mb-8">Last Updated: {currentDate}</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. INTRODUCTION</h2>
        <p className="mb-4">
          Welcome to SettlementWins ("we," "our," or "us"). We respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
        </p>
        <p className="mb-4">
          By accessing or using SettlementWins, you consent to the practices described in this Privacy Policy. If you do not agree with the policies and practices described herein, please do not use our services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. INFORMATION WE COLLECT</h2>
        
        <h3 className="text-lg font-semibold mb-3">2.1 Information You Provide Directly</h3>
        <p className="mb-4">
          We may collect the following types of information when you register, submit content, or otherwise interact with our services:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li><strong>Professional Information:</strong> Attorney name, firm name, email address, and other professional contact information.</li>
          <li><strong>Settlement Information:</strong> Case types, settlement amounts, case dates, locations, and other details you choose to submit.</li>
          <li><strong>Payment Information:</strong> Credit card or payment details necessary to process transactions. Note that full payment information is processed by our third-party payment processor and is not stored on our servers.</li>
          <li><strong>Communications:</strong> Information provided in emails, forms, or other communications with us.</li>
        </ul>

        <h3 className="text-lg font-semibold mb-3">2.2 Information Collected Automatically</h3>
        <p className="mb-4">
          When you visit or use our website, we may automatically collect certain information, including:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li><strong>Usage Data:</strong> IP address, browser type, operating system, referring URLs, access times, pages viewed, and other browsing information.</li>
          <li><strong>Device Information:</strong> Information about the devices used to access our services.</li>
          <li><strong>Cookies and Similar Technologies:</strong> We use cookies, web beacons, and similar technologies to enhance your experience and collect information about how you interact with our services. You can control cookies through your browser settings.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">3. HOW WE USE YOUR INFORMATION</h2>
        <p className="mb-4">
          We may use the information we collect for the following purposes:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Providing, maintaining, and improving our services</li>
          <li>Processing transactions and sending related information</li>
          <li>Displaying submitted settlement information on our platform</li>
          <li>Responding to your requests and providing customer support</li>
          <li>Sending administrative information, updates, and marketing communications</li>
          <li>Monitoring and analyzing usage patterns and trends</li>
          <li>Protecting our services and users, and enforcing our Terms of Service</li>
          <li>Complying with legal obligations</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">4. SHARING OF INFORMATION</h2>
        
        <h3 className="text-lg font-semibold mb-3">4.1 Public Information</h3>
        <p className="mb-4">
          Settlement information you submit (excluding your email address and payment details) is displayed publicly on our platform. By submitting settlement information, you acknowledge and agree that such information will be publicly available.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">4.2 Service Providers</h3>
        <p className="mb-4">
          We may share your information with third-party vendors, service providers, and other contractors who perform services on our behalf, including payment processing, data analysis, email delivery, hosting, and customer service.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">4.3 Legal Requirements</h3>
        <p className="mb-4">
          We may disclose your information if required by law or in response to valid requests by public authorities (e.g., a court or government agency).
        </p>
        
        <h3 className="text-lg font-semibold mb-3">4.4 Business Transfers</h3>
        <p className="mb-4">
          If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.
        </p>
        
        <h3 className="text-lg font-semibold mb-3">4.5 With Your Consent</h3>
        <p className="mb-4">
          We may disclose your information for any other purpose with your consent.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">5. DATA SECURITY</h2>
        <p className="mb-4">
          We implement reasonable security measures designed to protect your information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure. Therefore, while we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">6. DATA RETENTION</h2>
        <p className="mb-4">
          We retain your information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">7. YOUR RIGHTS AND CHOICES</h2>
        <p className="mb-4">
          Depending on your location, you may have certain rights regarding your personal information, including:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Accessing, correcting, or deleting your information</li>
          <li>Restricting or objecting to our use of your information</li>
          <li>Requesting portability of your information</li>
          <li>Withdrawing consent (where applicable)</li>
        </ul>
        <p className="mb-4">
          To exercise any of these rights, please contact us using the information provided in the "Contact Us" section below.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">8. THIRD-PARTY LINKS AND SERVICES</h2>
        <p className="mb-4">
          Our website may contain links to third-party websites and services. We have no control over these third parties and are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party websites or services you visit.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">9. CHILDREN'S PRIVACY</h2>
        <p className="mb-4">
          Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">10. CHANGES TO THIS PRIVACY POLICY</h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">11. CONTACT US</h2>
        <p className="mb-4">
          If you have questions or concerns about this Privacy Policy or our privacy practices, please contact us at:
        </p>
        <p className="mb-4">
          Email: <a href="mailto:support@settlementwins.com" className="text-primary-600 hover:underline">support@settlementwins.com</a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">12. CALIFORNIA PRIVACY RIGHTS</h2>
        <p className="mb-4">
          California residents may have additional rights regarding their personal information under the California Consumer Privacy Act (CCPA) and other state laws. For more information about these rights and how to exercise them, please contact us using the information provided above.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">13. INTERNATIONAL TRANSFERS</h2>
        <p className="mb-4">
          Your information may be transferred to, stored, and processed in countries other than the country in which you are resident. These countries may have data protection laws that are different from those in your country. By using our services, you consent to the transfer, storage, and processing of your information in countries outside your country of residence.
        </p>
      </section>
    </div>
  );
};

export default Privacy;
