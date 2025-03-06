
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import type { Settlement } from "@/types/settlement";
import { useSubscription } from "@/hooks/useSubscription";
import { verifySettlementImageExists } from "@/utils/imageHelpers";

export const useSettlements = (user: User | null) => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { subscription } = useSubscription(user);
  const [processingImages, setProcessingImages] = useState(false);

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
      
      // If user has an active subscription, get all their settlements
      // Only get non-hidden settlements
      let query = supabase
        .from('settlements')
        .select('*')
        .eq('user_id', user.id)
        .eq('hidden', false);
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching settlements:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('No settlements found for user_id. Checking temporary_id...');
        
        // Try to find settlements by temporary ID
        if (user.user_metadata?.temporaryId) {
          const tempId = user.user_metadata.temporaryId;
          
          const { data: tempData, error: tempError } = await supabase
            .from('settlements')
            .select('*')
            .eq('temporary_id', tempId)
            .eq('hidden', false) // Only get non-hidden settlements
            .order('created_at', { ascending: false });
            
          if (tempError) {
            console.error('Error fetching settlements by temporary_id:', tempError);
          } else if (tempData && tempData.length > 0) {
            console.log('Found settlements by temporary_id:', tempData);
            
            // Process the data to ensure all required fields exist
            const allSettlements = processSettlementData(tempData);
            await verifySettlementImages(allSettlements);
            
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
            
            return;
          }
        }
      }
      
      console.log('Found settlements:', data);
      
      // Process the data to ensure all required fields exist
      const allSettlements = processSettlementData(data || []);
      await verifySettlementImages(allSettlements);
      
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
        hidden: settlement.hidden,
        attorney_email: settlement.attorney_email
      };
    });
  };
  
  // Verify settlement images and filter out ones with missing images
  const verifySettlementImages = async (allSettlements: Settlement[]) => {
    setProcessingImages(true);
    console.log('Checking image availability for', allSettlements.length, 'settlements');
    
    const filteredSettlements: Settlement[] = [];
    const settlementsToHide: number[] = [];
    
    for (const settlement of allSettlements) {
      try {
        // Skip if the settlement is explicitly marked as hidden
        if (settlement.hidden) {
          console.log(`Skipping hidden settlement ${settlement.id}`);
          continue;
        }
        
        // Check if the image exists
        const imageExists = await verifySettlementImageExists(settlement.id, settlement.photo_url);
        
        if (imageExists) {
          filteredSettlements.push(settlement);
        } else {
          console.log(`Hiding settlement ${settlement.id} due to missing image`);
          settlementsToHide.push(settlement.id);
        }
      } catch (error) {
        console.error(`Error processing settlement ${settlement.id}:`, error);
        // If there's an error, mark the settlement to be hidden
        settlementsToHide.push(settlement.id);
      }
    }
    
    // Update hidden flag for settlements with missing images
    if (settlementsToHide.length > 0) {
      try {
        console.log(`Updating hidden flag for ${settlementsToHide.length} settlements:`, settlementsToHide);
        const { error } = await supabase
          .from('settlements')
          .update({ hidden: true })
          .in('id', settlementsToHide);
          
        if (error) {
          console.error('Error updating hidden flag:', error);
        }
      } catch (updateError) {
        console.error('Error batch updating hidden flag:', updateError);
      }
    }
    
    console.log(`Showing ${filteredSettlements.length} of ${allSettlements.length} settlements (${allSettlements.length - filteredSettlements.length} hidden due to missing images)`);
    setSettlements(filteredSettlements);
    setProcessingImages(false);
    setIsLoading(false);
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
    isLoading: isLoading || processingImages,
    refreshSettlements: fetchSettlements
  };
};
