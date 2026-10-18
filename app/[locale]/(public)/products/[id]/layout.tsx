import type { Metadata } from "next";
import { Suspense } from "react";
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
  
    <Suspense fallback={<div className="min-h-screen  flex items-center justify-center">
      <div className=" text-sm animate-pulse">Loading tile…</div>
    </div>}>
      {children}</Suspense>
  </>;
}
