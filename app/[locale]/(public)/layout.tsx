import Footer from "@/components/Footer";
import Navbar from "../../../components/Navbar";
import BackToTop from "@/components/BackToTop";


export default function Publicayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navbar />
            {children}
            <Footer />
            <BackToTop />
        </>
    );
}
