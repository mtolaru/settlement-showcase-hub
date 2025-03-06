
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useSettlements } from "@/hooks/useSettlements";
import AccountHeader from "@/components/manage/AccountHeader";
import SubscriptionSection from "@/components/manage/SubscriptionSection";
import SettlementsSection from "@/components/manage/SettlementsSection";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const ManageSettlements = () => {
  const { checkAuth, signOut, user } = useAuth();
  const { subscription, isLoading: isLoadingSubscription, isVerified, refreshSubscription } = useSubscription(user);
  const { settlements, isLoading: isLoadingSettlements, refreshSettlements } = useSettlements(user);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

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
        const { data: emailSettlements, error: emailError } = await supabase
          .from('settlements')
          .update({ user_id: user.id })
          .is('user_id', null)
          .eq('attorney_email', user.email)
          .select('id');
          
        if (emailError) {
          console.error("Error linking settlements by email:", emailError);
        } else if (emailSettlements && emailSettlements.length > 0) {
          console.log(`Successfully linked ${emailSettlements.length} settlement(s) by email`);
          toast({
            title: "Settlements Linked",
            description: `${emailSettlements.length} settlement(s) associated with your email have been linked to your account.`,
          });
          refreshSettlements();
        }
        
        // Also try to link settlements by temporary_id from subscriptions
        const { data: subscriptions, error: subError } = await supabase
          .from('subscriptions')
          .select('temporary_id')
          .eq('user_id', user.id)
          .not('temporary_id', 'is', null);
          
        if (subError) {
          console.error("Error fetching user subscriptions:", subError);
        } else if (subscriptions && subscriptions.length > 0) {
          const temporaryIds = subscriptions
            .map(sub => sub.temporary_id)
            .filter(Boolean);
            
          if (temporaryIds.length > 0) {
            console.log("Attempting to link settlements by temporary IDs:", temporaryIds);
            
            for (const tempId of temporaryIds) {
              const { data: linkedData, error: linkError } = await supabase
                .from('settlements')
                .update({ user_id: user.id })
                .is('user_id', null)
                .eq('temporary_id', tempId)
                .select('id');
                
              if (linkError) {
                console.error(`Error linking settlement with temporary ID ${tempId}:`, linkError);
              } else if (linkedData && linkedData.length > 0) {
                console.log(`Successfully linked ${linkedData.length} settlement(s) with temporary ID ${tempId}`);
                toast({
                  title: "Settlements Linked",
                  description: `${linkedData.length} additional settlement(s) have been linked to your account.`,
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Try to link settlements by email and temporary_id before refreshing
    if (user?.id && user?.email) {
      try {
        // Link by email
        const { data: linkedData, error: linkError } = await supabase
          .from('settlements')
          .update({ user_id: user.id })
          .is('user_id', null)
          .eq('attorney_email', user.email)
          .select('id');
          
        if (linkError) {
          console.error("Error linking settlements during refresh:", linkError);
        } else if (linkedData && linkedData.length > 0) {
          console.log(`Linked ${linkedData.length} settlement(s) during refresh`);
          toast({
            title: "Settlements Linked",
            description: `${linkedData.length} additional settlement(s) have been linked to your account.`,
          });
        }
        
        // Also try to link by temporary_id from subscriptions
        const { data: subscriptions, error: subError } = await supabase
          .from('subscriptions')
          .select('temporary_id')
          .eq('user_id', user.id)
          .not('temporary_id', 'is', null);
          
        if (subError) {
          console.error("Error fetching user subscriptions:", subError);
        } else if (subscriptions && subscriptions.length > 0) {
          const temporaryIds = subscriptions
            .map(sub => sub.temporary_id)
            .filter(Boolean);
            
          if (temporaryIds.length > 0) {
            console.log("Attempting to link settlements by temporary IDs during refresh:", temporaryIds);
            
            for (const tempId of temporaryIds) {
              const { data: tempLinkedData, error: tempLinkError } = await supabase
                .from('settlements')
                .update({ user_id: user.id })
                .is('user_id', null)
                .eq('temporary_id', tempId)
                .select('id');
                
              if (tempLinkError) {
                console.error(`Error linking settlement with temporary ID ${tempId}:`, tempLinkError);
              } else if (tempLinkedData && tempLinkedData.length > 0) {
                console.log(`Successfully linked ${tempLinkedData.length} settlement(s) with temporary ID ${tempId}`);
                toast({
                  title: "Settlements Linked",
                  description: `${tempLinkedData.length} additional settlement(s) have been linked to your account.`,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error during manual linking:", error);
      }
    }
    
    await refreshSettlements();
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container max-w-4xl">
        <AccountHeader user={user} signOut={signOut} />

        <SubscriptionSection 
          subscription={subscription} 
          isLoading={isLoadingSubscription}
          isVerified={isVerified}
          refreshSubscription={refreshSubscription}
        />

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">My Settlements</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingSettlements}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <SettlementsSection 
          settlements={settlements} 
          isLoading={isLoadingSettlements || isRefreshing}
          refreshSettlements={refreshSettlements}
          userId={user?.id}
        />
      </div>
    </div>
  );
};

export default ManageSettlements;
