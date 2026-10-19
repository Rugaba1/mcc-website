"use client";

import { api, type Testimonial } from "@/lib/api";
import { ResourcePage, type Values } from "@/components/admin/resource-page";

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

const toPayload = (v: Values): Omit<Testimonial, "id"> => ({
  name: v.name.trim(),
  role: (v.role ?? "").trim(),
  text: v.text.trim(),
  initials: (v.initials ?? "").trim().toUpperCase().slice(0, 3) || initialsOf(v.name),
});

export default function AdminTestimonialsPage() {
  return (
    <ResourcePage<Testimonial>
      title="Testimonials"
      description="What customers say about you, shown on the public site."
      entityName="testimonial"
      load={api.getTestimonials}
      searchText={(t) => `${t.name} ${t.role} ${t.text}`}
      columns={[
        {
          header: "Customer",
          cell: (t) => (
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center bg-muted text-xs font-semibold">{t.initials}</span>
              <div><p className="font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.role}</p></div>
            </div>
          ),
        },
        { header: "Testimonial", cell: (t) => <p className="max-w-lg truncate text-muted-foreground">{t.text}</p> },
      ]}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "role", label: "Role or company", type: "text", placeholder: "Architect, Kigali" },
        { name: "initials", label: "Initials", type: "text", hint: "Leave blank to use the name’s initials" },
        { name: "text", label: "Testimonial", type: "textarea", required: true },
      ]}
      emptyForm={{ name: "", role: "", initials: "", text: "" }}
      create={(v) => api.createTestimonial(toPayload(v))}
      update={(t, v) => api.updateTestimonial(t.id, toPayload(v))}
      remove={(t) => api.deleteTestimonial(t.id)}
      deleteWarning={(t) => `The testimonial from ${t.name} will be removed from the site.`}
    />
  );
}