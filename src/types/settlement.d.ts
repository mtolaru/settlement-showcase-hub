
export interface Settlement {
  id: number;
  amount: number;
  type: string;
  firm: string;
  firmWebsite?: string;
  attorney: string;
  location: string;
  date: string;
  description: string;
  photoUrl?: string;
  details: {
    initialOffer: string;
    policyLimit: string;
    medicalExpenses: string;
    settlementPhase: string;
    caseDescription: string;
  };
}
