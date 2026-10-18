"use client";

import { api, type CustomerSummary } from "../../../../../lib/api";
import { useResource } from "../../../../../hooks/use-resource";
import { CustomersSection } from "../../../../../components/admin/sections/customers-section";

const fetchCustomers = () => api.getCustomers();

export default function CustomersPage() {
  const customers = useResource<CustomerSummary[]>(fetchCustomers, []);
  return <CustomersSection customers={customers.data} />;
}