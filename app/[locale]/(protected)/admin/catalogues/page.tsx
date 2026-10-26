"use client";

import { FileText } from "lucide-react";
import Image from "next/image";

import { ImageField } from "@/components/file-picker";
import { ResourcePage, type Values } from "@/components/admin/resource-page";
import { ShareWidget } from "@/components/share-widget";
import { Badge } from "@/components/ui/badge";
import { api, type CatalogueDoc } from "@/lib/api";
import { PERM } from "@/lib/permissions/catalog";

type CatalogueInput = Omit<CatalogueDoc, "id" | "createdAt" | "updatedAt">;

function toPayload(values: Values): CatalogueInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    coverImage: values.coverImage.trim(),
    fileUrl: values.fileUrl.trim(),
    category: values.category.trim() || "general",
    year: values.year.trim(),
    published: Boolean(values.published),
    featured: Boolean(values.featured),
  };
}

export default function AdminCataloguesPage() {
  return (
    <ResourcePage<CatalogueDoc>
      title="Catalogues"
      description="Manage downloadable product catalogues and announcements shown to visitors."
      entityName="catalogue"
      loadPage={api.getAdminCataloguesPage}
      createPermission={PERM.CATALOGUES_MANAGE}
      updatePermission={PERM.CATALOGUES_MANAGE}
      deletePermission={PERM.CATALOGUES_MANAGE}
      columns={[
        {
          header: "Catalogue",
          cell: (catalogue) => (
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden border bg-muted">
                {catalogue.coverImage ? (
                  <ImageFieldThumbnail src={catalogue.coverImage} alt={catalogue.title} />
                ) : (
                  <FileText className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{catalogue.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {catalogue.category}{catalogue.year ? ` · ${catalogue.year}` : ""}
                </p>
              </div>
            </div>
          ),
        },
        {
          header: "Visibility",
          cell: (catalogue) => (
            <div className="flex gap-1">
              <Badge variant={catalogue.published ? "default" : "secondary"}>
                {catalogue.published ? "Published" : "Draft"}
              </Badge>
              {catalogue.featured && <Badge variant="outline">Featured</Badge>}
            </div>
          ),
        },
        {
          header: "File",
          cell: (catalogue) => (
            <a
              href={catalogue.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="max-w-48 truncate text-sm text-primary underline"
            >
              {catalogue.fileUrl.split("/").pop() || "Open file"}
            </a>
          ),
        },
        {
          header: "Share",
          cell: (catalogue) => (
            catalogue.published ? (
              <ShareWidget
                title={catalogue.title}
                text={catalogue.description}
                path={`/catalogue#catalogue-${catalogue.id}`}
                label="Share"
              />
            ) : <span className="text-xs text-muted-foreground">Draft</span>
          ),
        },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        { name: "category", label: "Category", type: "text", placeholder: "Product catalogue" },
        { name: "year", label: "Year", type: "text", placeholder: "2026" },
        { name: "description", label: "Description", type: "textarea", wide: true },
        { name: "coverImage", label: "Cover image", type: "image", wide: true },
        {
          name: "fileUrl",
          label: "PDF / document file",
          type: "custom",
          required: true,
          wide: true,
          render: (value, onChange) => (
            <ImageField value={value ?? ""} onChange={onChange} kind="file" />
          ),
        },
        { name: "published", label: "Published", type: "checkbox" },
        { name: "featured", label: "Featured", type: "checkbox" },
      ]}
      emptyForm={{
        title: "",
        description: "",
        coverImage: "",
        fileUrl: "",
        category: "product catalogue",
        year: "",
        published: false,
        featured: false,
      }}
      toForm={(catalogue) => ({ ...catalogue })}
      validate={(values): Record<string, string> => {
        if (typeof values.fileUrl === "string" && values.fileUrl.trim()) return {};
        return { fileUrl: "A PDF or document file is required" };
      }}
      create={(values) => api.createCatalogue(toPayload(values))}
      update={(catalogue, values) =>
        api.updateCatalogue(catalogue.id, toPayload(values))
      }
      remove={(catalogue) => api.deleteCatalogue(catalogue.id)}
      deleteWarning={(catalogue) =>
        `${catalogue.title} will be removed from the public catalogue.`
      }
      detail={{
        title: (catalogue) => catalogue.title,
        description: (catalogue) => catalogue.description,
        render: (catalogue) => (
          <div className="space-y-4">
            <p className="break-all text-sm text-muted-foreground">{catalogue.fileUrl}</p>
            <ShareWidget
              title={catalogue.title}
              text={catalogue.description}
              path={`/catalogue#catalogue-${catalogue.id}`}
            />
          </div>
        ),
      }}
    />
  );
}

function ImageFieldThumbnail({ src, alt }: { src: string; alt: string }) {
  return (
    <Image src={src} alt={alt} fill sizes="3rem" className="object-cover" />
  );
}
