
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
    created_at: "2024-03-15",
    description: "Successful resolution of a complex motor vehicle accident case resulting in severe injuries to our client. Settlement achieved through strategic negotiation and comprehensive evidence presentation.",
    initial_offer: 1500000,
    policy_limit: 3000000,
    medical_expenses: 750000,
    settlement_phase: "during-litigation",
    case_description: "Multi-vehicle collision resulting in severe injuries",
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
    created_at: "2024-02-20",
    description: "Resolution of a complex medical malpractice case involving surgical complications. Settlement achieved through expert testimony and detailed documentation of care standards violations.",
    initial_offer: 1800000,
    policy_limit: 5000000,
    medical_expenses: 950000,
    settlement_phase: "pre-litigation",
    case_description: "Surgical error leading to permanent disability",
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
    created_at: "2024-01-10",
    description: "Successfully settled premises liability case involving hazardous conditions at a commercial property. Case resolved through mediation and comprehensive documentation of safety violations.",
    initial_offer: 800000,
    policy_limit: 2000000,
    medical_expenses: 450000,
    settlement_phase: "during-litigation",
    case_description: "Fall incident at commercial property",
    photo_url: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1"
  }
];
