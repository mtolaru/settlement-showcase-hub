
import type { Settlement } from "../types/settlement";

export const sampleSettlements: Settlement[] = [
  {
    id: 1,
    amount: 1500000,
    type: "Motor Vehicle Accidents",
    firm: "Johnson & Associates",
    firmWebsite: "https://example.com",
    attorney: "Sarah Johnson",
    location: "San Francisco, CA",
    created_at: "2023-09-15T12:00:00Z",
    settlement_date: "2023-08-10T12:00:00Z", // Added settlement date
    description: "Severe injury from a T-bone collision at an intersection with a commercial truck. Client suffered multiple fractures and required several surgeries.",
    initial_offer: 350000,
    policy_limit: 2000000,
    medical_expenses: 425000,
    settlement_phase: "pre-litigation",
    case_description: "Severe injury from a T-bone collision at an intersection with a commercial truck. Client suffered multiple fractures and required several surgeries.",
    photo_url: "https://images.unsplash.com/photo-1594805290949-bdb34f4247a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
  },
  {
    id: 2,
    amount: 875000,
    type: "Medical Malpractice",
    firm: "Wilson Legal Group",
    firmWebsite: "https://example.com",
    attorney: "David Wilson",
    location: "Los Angeles, CA",
    created_at: "2023-08-28T12:00:00Z",
    settlement_date: "2023-07-15T12:00:00Z", // Added settlement date
    description: "Surgical error during routine gallbladder removal leading to bile duct injury requiring multiple corrective surgeries and extended hospitalization.",
    initial_offer: 250000,
    policy_limit: 1000000,
    medical_expenses: 380000,
    settlement_phase: "during-litigation",
    case_description: "Surgical error during routine gallbladder removal leading to bile duct injury requiring multiple corrective surgeries and extended hospitalization.",
    photo_url: "https://images.unsplash.com/photo-1631248055158-edec7a3c072b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
  },
  {
    id: 3,
    amount: 650000,
    type: "Premises Liability",
    firm: "Martinez Law",
    firmWebsite: "https://example.com",
    attorney: "Maria Martinez",
    location: "San Diego, CA",
    created_at: "2023-09-05T12:00:00Z",
    settlement_date: "2023-08-01T12:00:00Z", // Added settlement date
    description: "Slip and fall accident at a retail store due to unmarked wet floor. Client suffered a severe hip fracture requiring surgery and extensive physical therapy.",
    initial_offer: 125000,
    policy_limit: 750000,
    medical_expenses: 210000,
    settlement_phase: "pre-litigation",
    case_description: "Slip and fall accident at a retail store due to unmarked wet floor. Client suffered a severe hip fracture requiring surgery and extensive physical therapy.",
    photo_url: "https://images.unsplash.com/photo-1597047084897-51e81819a499?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1969&q=80",
  }
];
