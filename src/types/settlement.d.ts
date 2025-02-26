
export interface Settlement {
  id: number;
  amount: number;
  type: string;
  firm: string;
  firmWebsite?: string;
  attorney: string;
  location: string;
  created_at: string;
  description: string | null;
  details: {
    initialOffer: string;
    policyLimit: string;
    medicalExpenses: string;
    settlementPhase: string;
    caseDescription: string;
  };
  temporary_id?: string;
  user_id?: string;
  payment_completed?: boolean;
  photo_url?: string;
}
