"use client";

import { MediaImage } from "@/components/media-image";

import { Star } from "lucide-react";
import { api, type Project } from "@/lib/api";
import { ResourcePage, type Values } from "@/components/admin/resource-page";
import { ProductPicker, type Picked } from "@/components/product-picker";
import { Badge } from "@/components/ui/badge";
import { PERM } from "@/lib/permissions/catalog";
import { GradientField } from "@/components/gradient-field";

const toPayload = (v: Values): Omit<Project, "id"> => ({
  title: v.title.trim(),
  type: (v.type ?? "").trim(),
  description: (v.description ?? "").trim(),
  gradient: (v.gradient ?? "").trim(),
  image: v.image ?? "",
  large: !!v.large,
  location: (v.location ?? "").trim(),
  area: (v.area ?? "").trim(),
  year: String(v.year ?? "").trim(),
  tileIds: ((v.tiles ?? []) as Picked[]).map((t) => t.id),
});

export default function AdminProjectsPage() {
  return (
    <ResourcePage<Project>
      title="Projects"
      description="Finished installations shown in your portfolio."
      entityName="project"
      loadPage={api.getProjectsPage}
      createPermission={PERM.PROJECTS_MANAGE}
      updatePermission={PERM.PROJECTS_MANAGE}
      deletePermission={PERM.PROJECTS_MANAGE}
      columns={[
        {
          header: "Project",
          cell: (p) => (
            <div className="flex items-center gap-3">
              <div className="h-11 w-16 shrink-0 overflow-hidden border bg-muted">
                {p.image && <MediaImage src={p.image} alt={p.title} className="size-full object-cover" />}
              </div>
              <div><p className="font-medium">{p.title}</p><p className="text-xs text-muted-foreground">{p.location || "No location"}</p></div>
            </div>
          ),
        },
        { header: "Type", cell: (p) => p.type || "—" },
        { header: "Area", cell: (p) => p.area || "—" },
        { header: "Year", cell: (p) => p.year || "—" },
        { header: "Tiles", cell: (p) => p.tileIds?.length ?? 0 },
        { header: "Layout", cell: (p) => (p.large ? <Badge variant="secondary" className="gap-1 rounded-none"><Star className="size-3" /> Large</Badge> : <span className="text-muted-foreground">Standard</span>) },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true, wide: true },
        { name: "type", label: "Type", type: "text", placeholder: "Residential, Commercial…", hint: "Used for the filter tabs on the site" },
        { name: "location", label: "Location", type: "text", placeholder: "Kigali" },
        { name: "area", label: "Area", type: "text", placeholder: "320 m²" },
        { name: "year", label: "Year", type: "text", placeholder: "2026" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "image", label: "Cover image", type: "image" },
        {
          name: "gradient",
          label: "Fallback gradient",
          type: "custom",
          wide: true,
          hint: "Choose a previewable background gradient for the project image.",
          render: (value, set) => (
            <GradientField
              id="project-fallback-gradient"
              value={value ?? ""}
              onChange={set}
            />
          ),
        },
        { name: "large", label: "Show as a large card", type: "checkbox" },
        { name: "tiles", label: "Tiles used", type: "custom", render: (v, set) => <ProductPicker value={v ?? []} onChange={set} /> },
      ]}
      emptyForm={{ title: "", type: "", location: "", area: "", year: "", description: "", image: "", gradient: "", large: false, tiles: [] }}
      toForm={(p) => {
        const names = new Map<number, string>();
        for (const t of (p.products ?? []) as { id?: number; name?: string; product?: { id: number; name: string } }[]) {
          const id = t.product?.id ?? t.id;
          const name = t.product?.name ?? t.name;
          if (id != null && name) names.set(id, name);
        }
        return { ...p, year: p.year ?? "", tiles: (p.tileIds ?? []).map((id) => ({ id, name: names.get(id) ?? `Product #${id}` })) };
      }}
      create={(v) => api.createProject(toPayload(v))}
      update={(p, v) => api.updateProject(p.id, toPayload(v))}
      remove={(p) => api.deleteProject(p.id)}
      deleteWarning={(p) => `“${p.title}” will be removed from your portfolio. The tiles themselves are not deleted.`}
    />
  );
}