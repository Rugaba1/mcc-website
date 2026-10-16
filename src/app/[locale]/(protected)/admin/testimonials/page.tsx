"use client";

import { api, type Testimonial } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import { TestimonialsSection } from "@/components/admin/sections/testimonials-section";

const fetchTestimonials = () => api.getTestimonials();

export default function TestimonialsPage() {
  const t = useResource<Testimonial[]>(fetchTestimonials, []);
  return <TestimonialsSection testimonials={t.data} reload={t.reload} />;
}