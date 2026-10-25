import type { Metadata } from "next";
import { Suspense } from "react";
import { LuxuryLoading } from "@/components/luxury-loading";
export const metadata: Metadata = {
  title: "Projects — Mountain Ceramics Company",
  description: "Explore MCC tile projects across Rwanda — hospitality, residential, commercial and infrastructure.",
};

export default async function ProjectsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id)
  return <>
  
    <Suspense fallback={<LuxuryLoading fullScreen label="Loading product" />}>
      {children}</Suspense>
  </>;
}
