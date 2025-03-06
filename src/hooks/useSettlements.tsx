
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import type { Settlement } from "@/types/settlement";
import { useSubscription } from "@/hooks/useSubscription";
import { verifyFileExists } from "@/utils/imageUtils";

export const useSettlements = (user: User | null, hideWithoutImages: boolean = false) => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [filteredSettlements, setFilteredSettlements] = useState<Settlement[]>([]);
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
        setFilteredSettlements([]);
        setIsLoading(false);
        return;
      }
      
      // If user has an active subscription, get all their settlements
      let query = supabase
        .from('settlements')
        .select('*')
        .eq('user_id', user.id);
      
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
            .order('created_at', { ascending: false });
            
          if (tempError) {
            console.error('Error fetching settlements by temporary_id:', tempError);
          } else if (tempData && tempData.length > 0) {
            console.log('Found settlements by temporary_id:', tempData);
            
            // Process the data to ensure all required fields exist
            const processedData: Settlement[] = tempData.map(settlement => {
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
                photo_url: settlement.photo_url
              };
            });
            
            setSettlements(processedData);
            
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
            
            if (hideWithoutImages) {
              filterSettlementsWithValidImages(processedData);
            } else {
              setFilteredSettlements(processedData);
            }
            
            setIsLoading(false);
            return;
          }
        }
      }
      
      console.log('Found settlements:', data);
      
      // Process the data to ensure all required fields exist
      const processedData: Settlement[] = (data || []).map(settlement => {
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
          photo_url: settlement.photo_url
        };
      });
      
      setSettlements(processedData);
      
      if (hideWithoutImages) {
        filterSettlementsWithValidImages(processedData);
      } else {
        setFilteredSettlements(processedData);
      }
      
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

  const filterSettlementsWithValidImages = async (allSettlements: Settlement[]) => {
    try {
      const validSettlements: Settlement[] = [];
      
      for (const settlement of allSettlements) {
        if (!settlement.photo_url) {
          // Skip settlements with no photo_url
          console.log(`Settlement ${settlement.id} has no photo_url, filtering out`);
          continue;
        }
        
        const exists = await verifyFileExists(settlement.photo_url, settlement.id);
        if (exists) {
          validSettlements.push(settlement);
        } else {
          console.log(`Image for settlement ${settlement.id} (${settlement.photo_url}) doesn't exist, filtering out`);
        }
      }
      
      setFilteredSettlements(validSettlements);
    } catch (error) {
      console.error('Error filtering settlements with valid images:', error);
      // Fallback to showing all settlements
      setFilteredSettlements(allSettlements);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSettlements();
    } else {
      setSettlements([]);
      setFilteredSettlements([]);
      setIsLoading(false);
    }
  }, [user, subscription, hideWithoutImages]);

  return {
    settlements: filteredSettlements, // Return filtered settlements based on image validity
    allSettlements: settlements, // The original list of all settlements
    isLoading,
    refreshSettlements: fetchSettlements
  };
};
