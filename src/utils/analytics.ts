
interface SettlementEventData {
  settlement_amount?: number;
  settlement_type?: string;
}

interface FormFieldEventData {
  field_name: string;
  step: string;
}

export const trackSettlementSubmission = (data: SettlementEventData) => {
  try {
    // @ts-ignore - gtag is defined in index.html
    window.gtag('event', 'settlement_submitted', data);
  } catch (error) {
    console.error('Failed to track settlement submission:', error);
  }
};

export const trackFormFieldCompletion = (data: FormFieldEventData) => {
  try {
    // @ts-ignore - gtag is defined in index.html
    window.gtag('event', 'form_field_completion', data);
  } catch (error) {
    console.error('Failed to track form field completion:', error);
  }
};
