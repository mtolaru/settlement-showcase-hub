
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useSettlements } from "@/hooks/useSettlements";
import AccountHeader from "@/components/manage/AccountHeader";
import SubscriptionSection from "@/components/manage/SubscriptionSection";
import SettlementsSection from "@/components/manage/SettlementsSection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  const {
    toast
  } = useToast();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Attempt to link any unlinked settlements when the user is authenticated
    const linkUnlinkedSettlements = async () => {
      if (!user?.id || !user?.email) return;
      try {
        console.log("Checking for unlinked settlements for user:", user.id, user.email);

        // Try to link settlements by email
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

        // Also try to link settlements by temporary_id from subscriptions
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

  return <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container max-w-4xl">
        <AccountHeader user={user} signOut={signOut} />

        <SubscriptionSection subscription={subscription} isLoading={isLoadingSubscription} isVerified={isVerified} refreshSubscription={refreshSubscription} />

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">My Settlements</h2>
        </div>

        <SettlementsSection settlements={settlements} isLoading={isLoadingSettlements} refreshSettlements={refreshSettlements} userId={user?.id} />
      </div>
    </div>;
};

export default ManageSettlements;
