
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import type { Settlement } from "@/types/settlement";

export const useSettlements = (user: User | null) => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettlements = async () => {
    try {
      if (!user) {
        console.log('No user found, skipping settlements fetch');
        setIsLoading(false);
        return;
      }

      console.log('Fetching settlements for user:', user.id);
      
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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

  useEffect(() => {
    if (user) {
      fetchSettlements();
    }
  }, [user]);

  return {
    settlements,
    isLoading,
    refreshSettlements: fetchSettlements
  };
};
