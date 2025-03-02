
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface CaseDetails {
  carAccident: {
    vehicleType: string;
    injuryType: string;
    atFault: string;
  };
  workplaceInjury: {
    injuryType: string;
    workSector: string;
    employerSize: string;
  };
  medicalMalpractice: {
    procedureType: string;
    facilityType: string;
    injuryType: string;
  };
  slipAndFall: {
    locationType: string;
    injuryType: string;
    propertyType: string;
  };
}

export interface FormData {
  amount: string;
  initialOffer: string;
  policyLimit: string;
  medicalExpenses: string;
  settlementPhase: string;
  caseType: string;
  otherCaseType: string;
  caseDescription: string;
  settlementDate: string;
  caseDetails: CaseDetails;
  attorneyName: string;
  attorneyEmail: string;
  firmName: string;
  firmWebsite: string;
  location: string;
  photoUrl: string;
}
