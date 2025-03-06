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
      
      // Check if the user has an active subscription
      const hasActiveSubscription = !!subscription?.is_active;
      console.log('User has active subscription:', hasActiveSubscription);
      
      if (!hasActiveSubscription) {
        console.log('User does not have an active subscription, showing no settlements');
        setSettlements([]);
        setIsLoading(false);
        return;
      }
      
      // If user has an active subscription, get only settlements with photos
      // We don't want to show settlements without photos
      let query = supabase
        .from('settlements')
        .select('*')
        .eq('user_id', user.id)
        .not('photo_url', 'is', null);
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching settlements:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('No settlements found for user_id with photo_url. Checking temporary_id...');
        
        // Try to find settlements by temporary ID
        if (user.user_metadata?.temporaryId) {
          const tempId = user.user_metadata.temporaryId;
          
          const { data: tempData, error: tempError } = await supabase
            .from('settlements')
            .select('*')
            .eq('temporary_id', tempId)
            .not('photo_url', 'is', null)
            .order('created_at', { ascending: false });
            
          if (tempError) {
            console.error('Error fetching settlements by temporary_id:', tempError);
          } else if (tempData && tempData.length > 0) {
            console.log('Found settlements by temporary_id:', tempData);
            
            // Process the data to ensure all required fields exist
            const allSettlements = processSettlementData(tempData);
            
            // Update these settlements with the user_id
            const { error: updateError } = await supabase
              .from('settlements')
              .update({ user_id: user.id })
              .eq('temporary_id', tempId);
              
            if (updateError) {
              console.error('Error updating settlements with user_id:', updateError);
            } else {
              console.log('Updated settlements with user_id');
            }
            
            setSettlements(allSettlements);
            setIsLoading(false);
            return;
          }
        }
      }
      
      console.log('Found settlements with photos:', data);
      
      // Process the data to ensure all required fields exist
      const allSettlements = processSettlementData(data || []);
      setSettlements(allSettlements);
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
