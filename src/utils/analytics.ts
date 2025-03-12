
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

interface PageViewData {
  page_title: string;
  page_location: string;
  page_path: string;
}

interface ButtonClickData {
  button_name: string;
  page_location: string;
  component?: string;
  action?: string;
}

interface LinkClickData {
  link_name: string;
  link_url: string;
  page_location: string;
}

export const trackPageView = (data: PageViewData) => {
  try {
    // @ts-ignore - gtag is defined in index.html
    window.gtag('event', 'page_view', data);
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
};

export const trackButtonClick = (data: ButtonClickData) => {
  try {
    // @ts-ignore - gtag is defined in index.html
    window.gtag('event', 'button_click', {
      ...data,
      page_location: data.page_location || window.location.pathname
    });
    console.log('🔍 Analytics: Tracked button click', data.button_name);
  } catch (error) {
    console.error('Failed to track button click:', error);
  }
};

export const trackLinkClick = (data: LinkClickData) => {
  try {
    // @ts-ignore - gtag is defined in index.html
    window.gtag('event', 'link_click', {
      ...data,
      page_location: data.page_location || window.location.pathname
    });
  } catch (error) {
    console.error('Failed to track link click:', error);
  }
};

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
