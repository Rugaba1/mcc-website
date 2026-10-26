
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { PublicationsSurface } from "@/components/publications-surface";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicationsSurface />
      <Navbar />

      <main className="min-h-screen bg-background text-foreground">{children}</main>

      <Footer />
    </>
  );
}
