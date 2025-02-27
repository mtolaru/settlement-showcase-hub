
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-neutral-50 text-neutral-800 py-12 border-t border-neutral-200">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">SettlementWins</h3>
            <p className="text-neutral-600">
              Share your settlements. Build your reputation. Grow your practice.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-lg mb-4">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/settlements" className="text-neutral-600 hover:text-neutral-900 transition">
                  Browse Settlements
                </Link>
              </li>
              <li>
                <Link to="/submit" className="text-neutral-600 hover:text-neutral-900 transition">
                  Submit Your Settlement
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-neutral-600 hover:text-neutral-900 transition">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-lg mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-neutral-600 hover:text-neutral-900 transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-neutral-600 hover:text-neutral-900 transition">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="mailto:contact@settlementwins.com" className="text-neutral-600 hover:text-neutral-900 transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-lg mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-neutral-600 hover:text-neutral-900 transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-neutral-600 hover:text-neutral-900 transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-200 mt-8 pt-8 text-neutral-500 text-sm">
          <p>© {currentYear} SettlementWins. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
