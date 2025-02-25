
import { Link } from "react-router-dom";
import { LoginDialog } from "@/components/auth/LoginDialog";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-neutral-200 mt-auto">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-display text-primary-900">SettlementWins</h3>
            <p className="text-sm text-neutral-600">
              Showcasing legal excellence through successful settlement outcomes.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-neutral-600 hover:text-primary-900">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-neutral-600 hover:text-primary-900">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-neutral-600 hover:text-primary-900">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-sm text-neutral-600 hover:text-primary-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-neutral-600 hover:text-primary-900">
                  Terms of Service
                </Link>
              </li>
              <li className="[&>button]:text-left [&>button]:w-full [&>button]:justify-start">
                <LoginDialog />
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:support@settlementwins.com" className="text-sm text-neutral-600 hover:text-primary-900">
                  support@settlementwins.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-200 mt-12 pt-8">
          <p className="text-center text-sm text-neutral-600">
            © {new Date().getFullYear()} SettlementWins. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
