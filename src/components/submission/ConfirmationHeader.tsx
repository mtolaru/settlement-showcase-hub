
import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const ConfirmationHeader = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);

  useEffect(() => {
    const recoverFormData = async () => {
      try {
        const storedData = localStorage.getItem('settlement_form_data');
        const temporaryId = searchParams.get('temporaryId') || localStorage.getItem('temporary_id');
        const sessionId = searchParams.get('session_id') || localStorage.getItem('payment_session_id');
        
        if (!temporaryId) {
          console.log("No temporaryId found for recovery");
          return;
        }
        
        console.log("Attempting to recover form data using temporaryId:", temporaryId);
        
        // Check if settlement exists and needs update
        const { data: settlement, error: fetchError } = await supabase
          .from('settlements')
          .select('*')
          .eq('temporary_id', temporaryId)
          .maybeSingle();
          
        if (fetchError) {
          console.error("Error fetching settlement for recovery:", fetchError);
          return;
        }
          
        if (!settlement) {
          console.log("No settlement found to recover");
          
          // If we have stored form data but no settlement, create one
          if (storedData && sessionId) {
            console.log("Creating new settlement from stored form data");
            const formData = JSON.parse(storedData);
            
            try {
              const { error: createError } = await supabase
                .from('settlements')
                .insert({
                  temporary_id: temporaryId,
                  amount: Number(formData.amount.replace(/[^0-9.]/g, '')) || 0,
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
                  payment_completed: true,
                  stripe_session_id: sessionId,
                  created_at: new Date().toISOString(),
                  paid_at: new Date().toISOString()
                });
                
              if (createError) {
                console.error("Error creating settlement from stored data:", createError);
              } else {
                console.log("Successfully created settlement from stored data");
                toast({
                  title: "Data Recovered",
                  description: "Your settlement information has been created from local data."
                });
              }
            } catch (error) {
              console.error("Error creating settlement:", error);
            }
          }
          
          return;
        }
        
        // Check if payment is completed but data is missing
        const needsRecovery = settlement.payment_completed && (
          settlement.amount === 0 || 
          !settlement.attorney || 
          settlement.attorney === '' || 
          !settlement.type || 
          settlement.type === ''
        );
        
        if (needsRecovery && storedData) {
          console.log("Settlement needs recovery, updating with stored form data");
          
          const formData = JSON.parse(storedData);
          console.log("Recovered form data from localStorage:", formData);
          
          const { error: updateError } = await supabase
            .from('settlements')
            .update({
              amount: Number(formData.amount.replace(/[^0-9.]/g, '')) || 0,
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
              updated_at: new Date().toISOString()
            })
            .eq('temporary_id', temporaryId);
            
          if (updateError) {
            console.error("Error recovering form data:", updateError);
            toast({
              variant: "destructive",
              title: "Recovery Error",
              description: "Failed to recover settlement data."
            });
          } else {
            console.log("Successfully recovered form data for settlement");
            toast({
              title: "Data Recovered",
              description: "Your settlement information has been restored."
            });
          }
        } else if (!settlement.payment_completed && sessionId) {
          // Settlement exists but payment status might need updating
          console.log("Updating payment status for settlement");
          
          const { error: updateError } = await supabase
            .from('settlements')
            .update({
              payment_completed: true,
              stripe_session_id: sessionId,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('temporary_id', temporaryId);
            
          if (updateError) {
            console.error("Error updating payment status:", updateError);
          } else {
            console.log("Payment status updated successfully");
          }
        } else {
          console.log("Settlement data appears to be complete, no recovery needed");
        }
        
        setRecoveryAttempted(true);
      } catch (error) {
        console.error("Error in form data recovery:", error);
        setRecoveryAttempted(true);
      }
    };
    
    if (!recoveryAttempted) {
      recoverFormData();
    }
  }, [location, toast, searchParams, recoveryAttempted]);

  return (
    <div className="bg-green-50 border-b border-green-100">
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-green-900">
          Payment Successful
        </h1>
        <p className="mt-2 text-green-700">
          Your settlement has been submitted successfully.
        </p>
      </div>
    </div>
  );
};
