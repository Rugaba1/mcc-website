import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects — Mountain Ceramics Company",
  description: "Explore MCC tile projects across Rwanda — hospitality, residential, commercial and infrastructure.",
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
