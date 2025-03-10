
import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const ConfirmationHeader = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const recoverFormData = async () => {
      const storedData = localStorage.getItem('settlement_form_data');
      const temporaryId = searchParams.get('temporaryId') || localStorage.getItem('temporary_id');
      
      if (!storedData || !temporaryId) return;
      
      try {
        const formData = JSON.parse(storedData);
        console.log("Attempting to recover form data:", formData);
        console.log("For temporaryId:", temporaryId);
        
        // Check if settlement exists and needs update
        const { data: settlement } = await supabase
          .from('settlements')
          .select('*')
          .eq('temporary_id', temporaryId)
          .maybeSingle();
          
        if (!settlement) {
          console.log("No settlement found to recover");
          return;
        }
        
        if (settlement.amount === 0 || !settlement.attorney) {
          console.log("Settlement needs recovery, updating with stored form data");
          
          const { error: updateError } = await supabase
            .from('settlements')
            .update({
              amount: Number(formData.amount.replace(/[^0-9.]/g, '')),
              attorney: formData.attorneyName,
              firm: formData.firmName,
              firm_website: formData.firmWebsite,
              location: formData.location,
              type: formData.caseType === "Other" ? formData.otherCaseType : formData.caseType,
              description: formData.caseDescription,
              case_description: formData.caseDescription,
              initial_offer: formData.initialOffer ? Number(formData.initialOffer.replace(/[^0-9.]/g, '')) : null,
              policy_limit: formData.policyLimit ? Number(formData.policyLimit.replace(/[^0-9.]/g, '')) : null,
              medical_expenses: formData.medicalExpenses ? Number(formData.medicalExpenses.replace(/[^0-9.]/g, '')) : null,
              settlement_phase: formData.settlementPhase,
              settlement_date: formData.settlementDate,
              photo_url: formData.photoUrl,
              attorney_email: formData.attorneyEmail,
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
            console.log("Successfully recovered form data");
            toast({
              title: "Data Recovered",
              description: "Your settlement information has been restored."
            });
          }
        }
      } catch (error) {
        console.error("Error in form data recovery:", error);
      }
    };
    
    recoverFormData();
  }, [location, toast, searchParams]);

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

