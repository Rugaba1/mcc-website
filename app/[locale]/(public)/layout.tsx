
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { PublicationsSurface } from "@/components/publications-surface";
import WebMcpTools from "@/components/webmcp-tools";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:not-sr-only focus:bg-background focus:p-3 focus:text-foreground"
      >
        Skip to main content
      </a>
      <PublicationsSurface />
      <WebMcpTools />
      <Navbar />

      <main id="main-content" tabIndex={-1} className="min-h-screen bg-background text-foreground">
        {children}
      </main>

      <Footer />
    </>
  );
}
