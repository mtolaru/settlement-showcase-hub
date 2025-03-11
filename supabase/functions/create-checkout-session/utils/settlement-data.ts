
/**
 * Save settlement form data to the database
 */
export const saveSettlementData = async (
  supabase: any,
  temporaryId: string,
  formData: any
) => {
  try {
    // Check if settlement record exists
    const { data: existingSettlement, error: checkError } = await supabase
      .from('settlements')
      .select('id')
      .eq('temporary_id', temporaryId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking existing settlement:', checkError);
      throw new Error(`Failed to check if settlement exists: ${checkError.message}`);
    }
      
    // Format the data for insertion
    const settlementData = {
      temporary_id: temporaryId,
      amount: Number(formData.amount?.replace?.(/[^0-9.]/g, '') || 0) || 0,
      attorney: formData.attorneyName || '',
      firm: formData.firmName || '',
      firm_website: formData.firmWebsite || '',
      location: formData.location || '',
      type: formData.caseType === "Other" ? formData.otherCaseType || 'Other' : formData.caseType || 'Other',
      description: formData.caseDescription || '',
      case_description: formData.caseDescription || '',
      initial_offer: formData.initialOffer ? Number(formData.initialOffer.replace(/[^0-9.]/g, '')) : null,
      policy_limit: formData.policyLimit ? Number(formData.policyLimit.replace(/[^0-9.]/g, '')) : null,
      medical_expenses: formData.medicalExpenses ? Number(formData.medicalExpenses.replace(/[^0-9.]/g, '')) : null,
      settlement_phase: formData.settlementPhase || '',
      settlement_date: formData.settlementDate || null,
      photo_url: formData.photoUrl || '',
      attorney_email: formData.attorneyEmail || '',
      payment_completed: false,
      updated_at: new Date().toISOString()
    };
    
    if (existingSettlement) {
      console.log("Found existing settlement record, updating:", existingSettlement);
      
      // Update existing record with current form data
      const { data: updatedRecord, error: updateError } = await supabase
        .from('settlements')
        .update(settlementData)
        .eq('id', existingSettlement.id)
        .select()
        .single();
        
      if (updateError) {
        console.error("Error updating existing settlement:", updateError);
        throw new Error(`Failed to update settlement: ${updateError.message}`);
      }
      
      console.log("Updated existing settlement record:", updatedRecord);
      return updatedRecord;
    } else {
      // Create a new record that includes created_at
      const newSubmissionData = {
        ...settlementData,
        created_at: new Date().toISOString()
      };
      
      console.log("Inserting new settlement record:", newSubmissionData);
      
      const { data, error: insertError } = await supabase
        .from('settlements')
        .insert(newSubmissionData)
        .select()
        .single();
        
      if (insertError) {
        console.error("Error creating settlement record:", insertError);
        throw new Error(`Failed to create settlement record: ${insertError.message}`);
      }
      
      console.log("Successfully created settlement record:", data);
      return data;
    }
  } catch (saveError) {
    console.error('Error saving settlement data:', saveError);
    throw saveError;
  }
};

/**
 * Check if payment for a settlement has already been completed
 */
export const checkExistingPayment = async (
  supabase: any,
  temporaryId: string
) => {
  try {
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements')
      .select('payment_completed')
      .eq('temporary_id', temporaryId)
      .maybeSingle();
      
    if (settlementError) {
      console.error('Error checking settlement:', settlementError);
      throw new Error(`Failed to check existing settlement: ${settlementError.message}`);
    }
    
    return settlement?.payment_completed || false;
  } catch (dbError) {
    console.error('Database error checking settlement:', dbError);
    return false;
  }
};
