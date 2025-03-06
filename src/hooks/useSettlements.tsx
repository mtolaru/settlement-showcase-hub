
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import type { Settlement } from "@/types/settlement";
import { useSubscription } from "@/hooks/useSubscription";

export const useSettlements = (user: User | null) => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { subscription } = useSubscription(user);

  const fetchSettlements = async () => {
    try {
      if (!user) {
        console.log('No user found, skipping settlements fetch');
        setIsLoading(false);
        return;
      }

      console.log('Fetching settlements for user:', user.id);
      
      const hasActiveSubscription = !!subscription?.is_active;
      console.log('User has active subscription:', hasActiveSubscription);
      
      if (!hasActiveSubscription) {
        console.log('User does not have an active subscription, showing no settlements');
        setSettlements([]);
        setIsLoading(false);
        return;
      }
      
      // First, try to claim any settlements that match the user's email but don't have a user_id
      if (user.email) {
        console.log('Attempting to claim unassigned settlements for:', user.email);
        const { error: updateError } = await supabase
          .from('settlements')
          .update({ user_id: user.id })
          .is('user_id', null)
          .eq('attorney_email', user.email)
          .eq('payment_completed', true);
          
        if (updateError) {
          console.error('Error claiming settlements:', updateError);
        } else {
          console.log('Successfully claimed any unassigned settlements');
        }
      }
      
      // Fetch all settlements that might be related to this user
      let allSettlements: Settlement[] = [];
      
      // 1. Fetch by user_id 
      const { data: userIdData, error: userIdError } = await supabase
        .from('settlements')
        .select('*')
        .not('photo_url', 'is', null)
        .eq('user_id', user.id)
        .eq('payment_completed', true);
      
      if (userIdError) {
        console.error('Error fetching settlements by user_id:', userIdError);
      } else if (userIdData) {
        console.log('Found settlements by user_id:', userIdData.length);
        allSettlements = [...allSettlements, ...userIdData];
      }
      
      // 2. Fetch by email if available
      if (user.email) {
        const { data: emailData, error: emailError } = await supabase
          .from('settlements')
          .select('*')
          .not('photo_url', 'is', null)
          .eq('attorney_email', user.email)
          .eq('payment_completed', true);
        
        if (emailError) {
          console.error('Error fetching settlements by email:', emailError);
        } else if (emailData) {
          console.log('Found settlements by email:', emailData.length);
          allSettlements = [...allSettlements, ...emailData];
        }
      }
      
      // Remove duplicates
      const uniqueSettlements = allSettlements.filter((settlement, index, self) => 
        index === self.findIndex(s => s.id === settlement.id)
      );
      
      console.log('Total unique settlements found:', uniqueSettlements.length);
      const processedSettlements = processSettlementData(uniqueSettlements);
      setSettlements(processedSettlements);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch settlements. Please try again.",
      });
      setIsLoading(false);
    }
  };

  // Process settlement data from the database into the required format
  const processSettlementData = (data: any[]): Settlement[] => {
    return data.map(settlement => {
      return {
        id: settlement.id,
        amount: settlement.amount,
        type: settlement.type,
        firm: settlement.firm,
        firmWebsite: settlement.firm_website,
        attorney: settlement.attorney,
        location: settlement.location,
        created_at: settlement.created_at,
        settlement_date: settlement.settlement_date || settlement.created_at,
        description: settlement.description,
        case_description: settlement.case_description,
        initial_offer: settlement.initial_offer,
        policy_limit: settlement.policy_limit,
        medical_expenses: settlement.medical_expenses,
        settlement_phase: settlement.settlement_phase,
        temporary_id: settlement.temporary_id,
        user_id: settlement.user_id,
        payment_completed: settlement.payment_completed,
        photo_url: settlement.photo_url,
        hidden: settlement.hidden
      };
    });
  };

  // New function to get the most recent attorney information for pre-populating fields
  const getLatestAttorneyInfo = () => {
    if (settlements.length === 0) return null;
    
    // Sort by created_at in descending order and get the first (most recent) settlement
    const sortedSettlements = [...settlements].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const latestSettlement = sortedSettlements[0];
    
    return {
      attorneyName: latestSettlement.attorney
    };
  };

  useEffect(() => {
    if (user) {
      fetchSettlements();
    } else {
      setSettlements([]);
      setIsLoading(false);
    }
  }, [user, subscription]);

  return {
    settlements,
    isLoading,
    refreshSettlements: fetchSettlements,
    getLatestAttorneyInfo
  };
};
