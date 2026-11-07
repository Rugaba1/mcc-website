import { serverApi } from "@/lib/api";
import TestimonialsCarousel from "@/components/testimonials-carousel";

export default async function Testimonials() {
  let testimonials;
  try {
    testimonials = await serverApi.getTestimonials();
  } catch (error) {
    console.error("Could not load homepage testimonials:", error);
    return (
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="font-playfair text-4xl font-bold md:text-5xl">
            What Our Clients Say
          </h2>
          <p className="mt-4 text-muted-foreground" role="status">
            Customer testimonials are temporarily unavailable. Please try again later.
          </p>
        </div>
      </section>
    );
  }

  return <TestimonialsCarousel testimonials={testimonials} />;
}
