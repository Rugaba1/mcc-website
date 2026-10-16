import type { PaymentStatus } from "@/lib/generated/prisma";

export type AdminRequestDTO = {
  id: string;
  type: "DRIVING_LICENSE" | "SPECIAL";
  title: string;
  referenceId?: string;
  category?: string;
  serviceName?: string;
  status: string;
  message?: string;
  completionPercentage: number;
  currentStep?: string;
  paymentStatus?: PaymentStatus;
  paymentAmount?: number;
  applicantName: string;
  applicantPhone: string;
  nationalId: string;
  createdAt: string;
  updatedAt: string;
  raw: any;
};

export type RequestType = "DRIVING_LICENSE" | "SPECIAL";
export interface AdminRequest {
  id: string;
  type: RequestType;
  title: string;
  status: string;
  message?: string | null;
  completionPercentage: number;
  updatedAt: string;
  referenceId: string;
  nationalId: string;
  phoneNumber: string;
  address: null;
  names: string;
}

export type SupportedLocales = "en" | "rw" | "fr";
