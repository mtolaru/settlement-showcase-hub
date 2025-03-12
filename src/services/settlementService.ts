import { supabase } from "@/integrations/supabase/client";
import { FormData } from "@/types/settlementForm";
import { trackSettlementSubmission } from '@/utils/analytics';

export const settlementService = {
  submitWithSubscription: async (temporaryId: string, formData: FormData, unformatNumber: (value: string) => string) => {
    try {
      const { data: result, error } = await supabase
        .from('settlements')
        .update({ payment_completed: true })
        .eq('temporary_id', temporaryId)
        .select()
        .single();

      if (error) throw error;

      // Track successful submission
      trackSettlementSubmission({
        settlement_amount: Number(unformatNumber(formData.amount)),
        settlement_type: formData.caseType === 'Other' ? formData.otherCaseType : formData.caseType
      });

      return result;
    } catch (error) {
      console.error('Error in submitWithSubscription:', error);
      throw error;
    }
  },
};
