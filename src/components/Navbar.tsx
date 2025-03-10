
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { LogOut, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-6">
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

            {/* Mobile navigation */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white">
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={cn(
                          "w-full",
                          location.pathname === item.path
                            ? "text-primary-900"
                            : "text-neutral-600"
                        )}
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

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
