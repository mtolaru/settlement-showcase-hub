
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { LogOut } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const { user, signOut, isAuthenticated } = useAuth();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Leaderboard", path: "/settlements" },
    { label: "Submit", path: "/submit" },
    ...(isAuthenticated ? [{ label: "My Account", path: "/manage" }] : []),
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
            {isAuthenticated ? (
              <Button 
                variant="outline" 
                onClick={signOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <LoginDialog />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
