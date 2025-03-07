
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useSettlements } from "@/hooks/useSettlements";
import AccountHeader from "@/components/manage/AccountHeader";
import SubscriptionSection from "@/components/manage/SubscriptionSection";
import SettlementsSection from "@/components/manage/SettlementsSection";
import { supabase, checkSupabaseConnection } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";

const ManageSettlements = () => {
  const {
    checkAuth,
    signOut,
    user
  } = useAuth();
  const {
    subscription,
    isLoading: isLoadingSubscription,
    isVerified,
    refreshSubscription
  } = useSubscription(user);
  const {
    settlements,
    isLoading: isLoadingSettlements,
    refreshSettlements
  } = useSettlements(user);
  const { toast } = useToast();
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionError(null);
        const result = await checkSupabaseConnection();
        if (!result.success) {
          setConnectionError(`Connection check failed: ${result.error}`);
          console.error('Supabase connection check failed:', result.error);
        } else {
          console.log('Supabase connection verified:', result);
        }
      } catch (error) {
        setConnectionError(`Connection check error: ${String(error)}`);
        console.error('Error checking Supabase connection:', error);
      }
    };
    
    checkConnection();
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const linkUnlinkedSettlements = async () => {
      if (!user?.id || !user?.email) return;
      try {
        console.log("Checking for unlinked settlements for user:", user.id, user.email);

        const {
          data: emailSettlements,
          error: emailError
        } = await supabase.from('settlements').update({
          user_id: user.id
        }).is('user_id', null).eq('attorney_email', user.email).select('id');
        if (emailError) {
          console.error("Error linking settlements by email:", emailError);
        } else if (emailSettlements && emailSettlements.length > 0) {
          console.log(`Successfully linked ${emailSettlements.length} settlement(s) by email`);
          toast({
            title: "Settlements Linked",
            description: `${emailSettlements.length} settlement(s) associated with your email have been linked to your account.`
          });
          refreshSettlements();
        }

        const {
          data: subscriptions,
          error: subError
        } = await supabase.from('subscriptions').select('temporary_id').eq('user_id', user.id).not('temporary_id', 'is', null);
        if (subError) {
          console.error("Error fetching user subscriptions:", subError);
        } else if (subscriptions && subscriptions.length > 0) {
          const temporaryIds = subscriptions.map(sub => sub.temporary_id).filter(Boolean);
          if (temporaryIds.length > 0) {
            console.log("Attempting to link settlements by temporary IDs:", temporaryIds);
            for (const tempId of temporaryIds) {
              const {
                data: linkedData,
                error: linkError
              } = await supabase.from('settlements').update({
                user_id: user.id
              }).is('user_id', null).eq('temporary_id', tempId).select('id');
              if (linkError) {
                console.error(`Error linking settlement with temporary ID ${tempId}:`, linkError);
              } else if (linkedData && linkedData.length > 0) {
                console.log(`Successfully linked ${linkedData.length} settlement(s) with temporary ID ${tempId}`);
                toast({
                  title: "Settlements Linked",
                  description: `${linkedData.length} additional settlement(s) have been linked to your account.`
                });
                refreshSettlements();
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in linkUnlinkedSettlements:", error);
      }
    };
    if (user) {
      linkUnlinkedSettlements();
    }
  }, [user, toast, refreshSettlements]);

  return <div className="min-h-screen bg-white py-12">
      <div className="container max-w-4xl">
        <AccountHeader user={user} signOut={signOut} />

        {connectionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <h3 className="font-semibold">Supabase Connection Error</h3>
              <p className="text-sm">{connectionError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-red-700 underline text-sm mt-2"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}

        <SubscriptionSection subscription={subscription} isLoading={isLoadingSubscription} isVerified={isVerified} refreshSubscription={refreshSubscription} />

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">My Settlements</h2>
        </div>

        <SettlementsSection settlements={settlements} isLoading={isLoadingSettlements} refreshSettlements={refreshSettlements} userId={user?.id} />
      </div>
    </div>;
};

export default ManageSettlements;
