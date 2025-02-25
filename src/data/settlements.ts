
import { Settlement } from "@/types/settlement";

export const settlements: Settlement[] = [
  {
    id: 1,
    amount: 2500000,
    type: "Motor Vehicle Accidents",
    firm: "Smith & Associates",
    firmWebsite: "https://www.smithassociates.com",
    attorney: "Sarah Johnson",
    location: "Los Angeles, CA",
    date: "2024-03-15",
    description: "Successful resolution of a complex motor vehicle accident case resulting in severe injuries to our client. Settlement achieved through strategic negotiation and comprehensive evidence presentation.",
    details: {
      initialOffer: "$1,500,000",
      policyLimit: "$3,000,000",
      medicalExpenses: "$750,000",
      settlementPhase: "during-litigation",
      caseDescription: "Multi-vehicle collision resulting in severe injuries"
    },
    photo_url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
  },
  {
    id: 2,
    amount: 3100000,
    type: "Medical Malpractice",
    firm: "Johnson Legal Group",
    firmWebsite: "https://www.johnsonlegal.com",
    attorney: "Michael Chen",
    location: "San Francisco, CA",
    date: "2024-02-20",
    description: "Resolution of a complex medical malpractice case involving surgical complications. Settlement achieved through expert testimony and detailed documentation of care standards violations.",
    details: {
      initialOffer: "$1,800,000",
      policyLimit: "$5,000,000",
      medicalExpenses: "$950,000",
      settlementPhase: "pre-litigation",
      caseDescription: "Surgical error leading to permanent disability"
    },
    photo_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e"
  },
  {
    id: 3,
    amount: 1800000,
    type: "Premises Liability",
    firm: "Pacific Law Partners",
    firmWebsite: "https://www.pacificlawpartners.com",
    attorney: "David Martinez",
    location: "Los Angeles, CA",
    date: "2024-01-10",
    description: "Successfully settled premises liability case involving hazardous conditions at a commercial property. Case resolved through mediation and comprehensive documentation of safety violations.",
    details: {
      initialOffer: "$800,000",
      policyLimit: "$2,000,000",
      medicalExpenses: "$450,000",
      settlementPhase: "during-litigation",
      caseDescription: "Fall incident at commercial property"
    },
    photo_url: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1"
  }
];
