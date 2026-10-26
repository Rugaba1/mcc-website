
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { PublicationsSurface } from "@/components/publications-surface";

export default async function Publicayout({ children }: { children: React.ReactNode }) {
  

    return (
        <>
            <PublicationsSurface />
            <Navbar />

            {children}
           
            <Footer />

        </>
    );
}
