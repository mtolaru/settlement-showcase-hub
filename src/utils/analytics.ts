
interface SettlementEventData {
  settlement_amount?: number;
  settlement_type?: string;
}

interface FormFieldEventData {
  field_name: string;
  step: string;
}

interface SubmissionStepData {
  step_number: number;
  step_name: string;
}

interface CheckoutEventData {
  temporary_id: string;
  amount: number;
}

interface PurchaseEventData {
  value: number;
  currency: string;
  transaction_id: string;
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

export const trackBeginSubmission = (formSection: string) => {
  try {
    // @ts-ignore - gtag is defined in index.html
    window.gtag('event', 'begin_submission', {
      form_section: formSection
    });
  } catch (error) {
    console.error('Failed to track begin submission:', error);
  }
};

export const trackSubmissionStepComplete = (data: SubmissionStepData) => {
  try {
    // @ts-ignore - gtag is defined in index.html
    window.gtag('event', 'submission_step_complete', data);
  } catch (error) {
    console.error('Failed to track step completion:', error);
  }
};

export const trackBeginCheckout = (data: CheckoutEventData) => {
  try {
    // @ts-ignore - gtag is defined in index.html
    window.gtag('event', 'begin_checkout', data);
  } catch (error) {
    console.error('Failed to track checkout start:', error);
  }
};

export const trackPurchase = (data: PurchaseEventData) => {
  try {
    // @ts-ignore - gtag is defined in index.html
    window.gtag('event', 'purchase', data);
  } catch (error) {
    console.error('Failed to track purchase:', error);
  }
};
