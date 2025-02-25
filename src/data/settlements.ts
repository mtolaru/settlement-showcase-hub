
import { Settlement } from "@/types/settlement";

export const settlements: Settlement[] = [
  {
    id: 1,
    amount: 2500000,
    type: "Motor Vehicle Accidents",
    firm: "Johnson & Associates",
    firmWebsite: "https://www.johnsonlaw.com",
    attorney: "Sarah Johnson",
    location: "Los Angeles, CA",
    date: "2024-02-15",
    description: "A severe multi-vehicle collision resulting in major injuries. Successfully negotiated a settlement that covered all medical expenses and future care needs.",
    details: {
      initialOffer: "$500,000",
      policyLimit: "$3,000,000",
      medicalExpenses: "$450,000",
      settlementPhase: "pre-litigation",
      caseDescription: "Multi-vehicle collision on I-405"
    },
    photo_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"
  },
  {
    id: 2,
    amount: 1750000,
    type: "Medical Malpractice",
    firm: "Medical Justice Law Group",
    firmWebsite: "https://www.medicaljustice.com",
    attorney: "Michael Chen",
    location: "San Francisco, CA",
    date: "2024-01-20",
    description: "A medical malpractice case involving surgical error. Successfully demonstrated negligence and secured compensation for ongoing medical care.",
    details: {
      initialOffer: "$250,000",
      policyLimit: "$2,000,000",
      medicalExpenses: "$300,000",
      settlementPhase: "during-litigation",
      caseDescription: "Surgical error leading to complications"
    },
    photo_url: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952"
  },
  {
    id: 3,
    amount: 950000,
    type: "Product Liability",
    firm: "Consumer Advocates LLP",
    firmWebsite: "https://www.consumeradvocates.com",
    attorney: "Emily Rodriguez",
    location: "San Diego, CA",
    date: "2024-01-10",
    description: "Product liability case involving a defective consumer device. Successfully proved manufacturer negligence in product design.",
    details: {
      initialOffer: "$150,000",
      policyLimit: "$1,000,000",
      medicalExpenses: "$175,000",
      settlementPhase: "pre-litigation",
      caseDescription: "Defective consumer device causing injury"
    },
    photo_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e"
  }
];
