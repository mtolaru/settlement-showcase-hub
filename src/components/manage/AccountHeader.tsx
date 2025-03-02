
import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface AccountHeaderProps {
  user: User | null;
  signOut: () => Promise<void>;
}

const AccountHeader = ({ user, signOut }: AccountHeaderProps) => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold font-display text-primary-900">
          My Account
        </h1>
        <Button 
          variant="outline" 
          onClick={signOut}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {user && (
        <div className="bg-primary-50 rounded-lg p-4 mb-8">
          <p className="text-primary-700">
            Signed in as <span className="font-semibold">{user.email}</span>
          </p>
        </div>
      )}
    </>
  );
};

export default AccountHeader;
