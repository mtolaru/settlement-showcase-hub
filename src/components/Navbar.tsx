
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { LoginDialog } from "@/components/auth/LoginDialog";

const Navbar = () => {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Leaderboard", path: "/settlements" },
    { label: "Submit", path: "/submit" },
    ...(user ? [{ label: "My Account", path: "/manage" }] : []),
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
            {!user && <LoginDialog />}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
