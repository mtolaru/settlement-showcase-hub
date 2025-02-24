
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Gallery", path: "/settlements" },
    { label: "Submit", path: "/submit" },
    { label: "About", path: "/about" },
    { label: "Pricing", path: "/pricing" },
  ];

  return (
    <nav className="bg-white border-b border-neutral-200">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold font-display text-primary-900">
            SettlementWins
          </Link>
          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "text-primary-900"
                    : "text-neutral-600 hover:text-primary-900"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
