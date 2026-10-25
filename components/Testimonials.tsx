import { serverApi } from "@/lib/api";
import TestimonialsCarousel from "@/components/testimonials-carousel";

export default async function Testimonials() {
  const testimonials = await serverApi.getTestimonials().catch((error: unknown) => {
    console.error("Could not load homepage testimonials:", error);
    return [];
  });

  return <TestimonialsCarousel testimonials={testimonials} />;
}
