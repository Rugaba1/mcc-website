"use client";

import { api, type PaymentSummary } from "../../../../../lib/api";
import { useResource } from "../../../../../hooks/use-resource";
import { PaymentsSection } from "../../../../../components/admin/sections/payments-section";

const fetchPayments = () => api.getPayments();

export default function PaymentsPage() {
  const payments = useResource<PaymentSummary[]>(fetchPayments, []);
  return <PaymentsSection payments={payments.data} />;
}