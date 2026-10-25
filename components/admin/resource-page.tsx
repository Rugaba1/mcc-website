"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Eye, Inbox, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import type { PaginatedResult } from "@/lib/server-pagination";
import type { PermCode } from "@/lib/permissions/catalog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { DataPagination } from "@/components/admin/data-pagination";
import { ImageField } from "@/components/file-picker";
import { PermissionGate } from "@/components/permission-gate";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Values = Record<string, any>;
export type Column<T> = { header: string; cell: (row: T) => ReactNode; className?: string };
export type Option = { value: string; label: string };

export type FieldDef = {
    name: string;
    label: string;
    type: "text" | "email" | "password" | "number" | "textarea" | "select" | "checkbox" | "image" | "custom";
    options?: Option[];
    placeholder?: string;
    hint?: string;
    required?: boolean;
    wide?: boolean; // span both columns
    render?: (value: any, onChange: (v: any) => void) => ReactNode; // type "custom"
};

export type FilterDef = { key: string; label: string; options: Option[] };

export type DetailDef<T> = {
    title: (row: T) => string;
    description?: (row: T) => string;
    render: (row: T, ctx: { reload: () => Promise<void>; close: () => void }) => ReactNode;
};

export interface ResourcePageProps<T extends { id: number }> {
    title: string;
    description: string;
    entityName: string; // "testimonial"
    loadPage: (query: {
        page: number;
        limit: number;
        q: string;
        filters: Record<string, string>;
    }) => Promise<PaginatedResult<T>>;
    columns: Column<T>[];
    filters?: FilterDef[];
    pageSize?: number;
    // CRUD, every part optional: omit create/update/remove for a read-only page
    fields?: FieldDef[];
    emptyForm?: Values;
    toForm?: (row: T) => Values;
    validate?: (values: Values, editing: boolean) => Record<string, string>;
    create?: (values: Values) => Promise<unknown>;
    createPermission?: PermCode;
    update?: (row: T, values: Values) => Promise<unknown>;
    updatePermission?: PermCode;
    remove?: (row: T) => Promise<unknown>;
    deletePermission?: PermCode;
    deleteWarning?: (row: T) => string;
    detail?: DetailDef<T>;
}

function Control({ f, value, onChange }: { f: FieldDef; value: any; onChange: (v: any) => void }) {
    switch (f.type) {
        case "textarea":
            return <Textarea className="min-h-24 rounded-none" value={value ?? ""} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
        case "select":
            return (
                <Select value={value || undefined} onValueChange={onChange}>
                    <SelectTrigger className="w-full rounded-none"><SelectValue placeholder={f.placeholder ?? "Choose"} /></SelectTrigger>
                    <SelectContent className="rounded-none">
                        {f.options?.map((o) => <SelectItem key={o.value} value={o.value} className="rounded-none">{o.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            );
        case "checkbox":
            return (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox className="rounded-none" checked={!!value} onCheckedChange={(c) => onChange(c === true)} /> {f.label}
                </label>
            );
        case "image":
            return <ImageField value={value ?? ""} onChange={onChange} />;
        case "custom":
            return <>{f.render?.(value, onChange)}</>;
        default:
            return <Input className="rounded-none" type={f.type} value={value ?? ""} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} autoComplete="off" />;
    }
}

export function ResourcePage<T extends { id: number }>(p: ResourcePageProps<T>) {
    const { pageSize = 10 } = p;
    const [rows, setRows] = useState<T[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const q = useDebouncedValue(search, 250);
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [page, setPage] = useState(1);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<T | null>(null);
    const [values, setValues] = useState<Values>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const [deleting, setDeleting] = useState<T | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [detailId, setDetailId] = useState<number | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const result = await p.loadPage({
                page,
                limit: pageSize,
                q: q.trim(),
                filters: filterValues,
            });
            setRows(result.items);
            setTotal(result.total);
            setTotalPages(result.totalPages);
            if (result.page !== page) setPage(result.page);
        } catch (e) {
            toast.error(apiErrorMessage(e, `Failed to load ${p.title.toLowerCase()}`));
        } finally {
            setLoading(false);
        }
    }, [filterValues, page, pageSize, p.loadPage, p.title, q]);
    useEffect(() => { void reload(); }, [reload]);
    useEffect(() => setPage(1), [q, filterValues]);

    const current = Math.min(page, totalPages);
    const pageRows = rows;
    const hasFilters = !!search || Object.values(filterValues).some((v) => v && v !== "all");
    const detailRow = detailId != null ? rows.find((r) => r.id === detailId) ?? null : null;

    const openForm = (row: T | null) => {
        setEditing(row);
        setValues(row && p.toForm ? p.toForm(row) : row ? (row as Values) : { ...(p.emptyForm ?? {}) });
        setErrors({});
        setFormOpen(true);
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        const next: Record<string, string> = {};
        for (const f of p.fields ?? []) {
            const v = values[f.name];
            if (f.required && (v == null || String(v).trim() === "")) next[f.name] = `${f.label} is required`;
        }
        Object.assign(next, p.validate?.(values, !!editing) ?? {});
        setErrors(next);
        if (Object.keys(next).length) return;

        setSaving(true);
        try {
            if (editing) await p.update?.(editing, values);
            else await p.create?.(values);
            toast.success(`${p.entityName[0].toUpperCase()}${p.entityName.slice(1)} ${editing ? "updated" : "created"}`);
            setFormOpen(false);
            await reload();
        } catch (err) {
            toast.error(apiErrorMessage(err, `Could not save the ${p.entityName}`));
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleting || !p.remove) return;
        setDeleteBusy(true);
        try {
            await p.remove(deleting);
            toast.success(`${p.entityName[0].toUpperCase()}${p.entityName.slice(1)} deleted`);
            setDeleting(null);
            await reload();
        } catch (err) {
            toast.error(apiErrorMessage(err, `Could not delete the ${p.entityName}`));
        } finally {
            setDeleteBusy(false);
        }
    };

    const colSpan = p.columns.length + 1;
    const canEdit = !!p.update && !!p.fields;
    const formPermission = editing ? p.updatePermission : p.createPermission;

    return (
        <main className="flex-1 space-y-5 p-4 md:p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{p.title}</h1>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                </div>
                {p.create && p.fields && p.createPermission && (
                    <PermissionGate required={p.createPermission}>
                        <Button className="rounded-none" onClick={() => openForm(null)}><Plus /> Add {p.entityName}</Button>
                    </PermissionGate>
                )}
            </header>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-60 flex-1 sm:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input className="rounded-none pl-8" placeholder={`Search ${p.title.toLowerCase()}`} value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                {p.filters?.map((f) => (
                    <Select key={f.key} value={filterValues[f.key] ?? "all"} onValueChange={(v) => setFilterValues((s) => ({ ...s, [f.key]: v }))}>
                        <SelectTrigger className="w-[170px] rounded-none"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-none">
                            <SelectItem value="all" className="rounded-none">All {f.label.toLowerCase()}</SelectItem>
                            {f.options.map((o) => <SelectItem key={o.value} value={o.value} className="rounded-none">{o.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                ))}
                {hasFilters && <Button variant="ghost" className="rounded-none" onClick={() => { setSearch(""); setFilterValues({}); }}><X /> Clear</Button>}
            </div>

            <div className="border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {p.columns.map((c) => <TableHead key={c.header} className={c.className}>{c.header}</TableHead>)}
                            <TableHead className="w-28 text-right"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? Array.from({ length: 6 }).map((_, i) => (
                            <TableRow key={i}>{Array.from({ length: colSpan }).map((__, j) => <TableCell key={j}><Skeleton className="h-5 w-full rounded-none" /></TableCell>)}</TableRow>
                        )) : pageRows.length === 0 ? (
                            <TableRow><TableCell colSpan={colSpan}>
                                <div className="flex flex-col items-center gap-2 py-14 text-sm text-muted-foreground">
                                    <Inbox className="size-7" />
                                    {hasFilters ? `No ${p.title.toLowerCase()} match your filters.` : `No ${p.title.toLowerCase()} yet.`}
                                </div>
                            </TableCell></TableRow>
                        ) : pageRows.map((r) => (
                            <TableRow key={r.id}>
                                {p.columns.map((c) => <TableCell key={c.header} className={c.className}>{c.cell(r)}</TableCell>)}
                                <TableCell>
                                    <div className="flex justify-end gap-1">
                                        {p.detail && <Button variant="ghost" size="icon" className="size-8 rounded-none" onClick={() => setDetailId(r.id)} aria-label="View"><Eye /></Button>}
                                        {canEdit && p.updatePermission && (
                                            <PermissionGate required={p.updatePermission}>
                                                <Button variant="ghost" size="icon" className="size-8 rounded-none" onClick={() => openForm(r)} aria-label="Edit"><Pencil /></Button>
                                            </PermissionGate>
                                        )}
                                        {p.remove && p.deletePermission && (
                                            <PermissionGate required={p.deletePermission}>
                                                <Button variant="ghost" size="icon" className="size-8 rounded-none text-destructive hover:text-destructive" onClick={() => setDeleting(r)} aria-label="Delete"><Trash2 /></Button>
                                            </PermissionGate>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <DataPagination page={current} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} disabled={loading} />
            </div>

            {/* Create / edit */}
            {p.fields && formPermission && (
                <PermissionGate required={formPermission}>
                <Dialog open={formOpen} onOpenChange={(o) => !saving && setFormOpen(o)}>
                    <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-2xl">
                        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                            <DialogHeader className="border-b p-4">
                                <DialogTitle>{editing ? `Edit ${p.entityName}` : `New ${p.entityName}`}</DialogTitle>
                                <DialogDescription>{editing ? "Changes are saved straight away." : `Fill in the details below.`}</DialogDescription>
                            </DialogHeader>
                            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2">
                                {p.fields.map((f) => (
                                    <div key={f.name} className={`space-y-1.5 ${f.wide || f.type === "textarea" || f.type === "image" || f.type === "custom" ? "sm:col-span-2" : ""}`}>
                                        {f.type !== "checkbox" && <Label>{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>}
                                        <Control f={f} value={values[f.name]} onChange={(v) => { setValues((s) => ({ ...s, [f.name]: v })); setErrors((s) => ({ ...s, [f.name]: "" })); }} />
                                        {f.hint && !errors[f.name] && f.type !== "checkbox" && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                                        {errors[f.name] && <p className="text-xs text-destructive">{errors[f.name]}</p>}
                                    </div>
                                ))}
                            </div>
                            <DialogFooter className="border-t p-4">
                                <Button type="button" variant="outline" className="rounded-none" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
                                <Button type="submit" className="rounded-none" disabled={saving}>{saving && <Loader2 className="animate-spin" />}{editing ? "Save changes" : `Create ${p.entityName}`}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                </PermissionGate>
            )}

            {/* Details */}
            {p.detail && (
                <Sheet open={!!detailRow} onOpenChange={(o) => !o && setDetailId(null)}>
                    <SheetContent side="right" className="flex w-full flex-col gap-0 rounded-none p-0 sm:max-w-2xl">
                        <SheetHeader className="border-b">
                            <SheetTitle>{detailRow ? p.detail.title(detailRow) : ""}</SheetTitle>
                            <SheetDescription>{detailRow && p.detail.description ? p.detail.description(detailRow) : " "}</SheetDescription>
                        </SheetHeader>
                        <div className="min-h-0 flex-1 overflow-y-auto p-4">
                            {detailRow && p.detail.render(detailRow, { reload, close: () => setDetailId(null) })}
                        </div>
                    </SheetContent>
                </Sheet>
            )}

            {p.deletePermission && (
                <PermissionGate required={p.deletePermission}>
                    <ConfirmDelete
                        open={!!deleting}
                        onOpenChange={(o) => !o && setDeleting(null)}
                        title={`Delete this ${p.entityName}?`}
                        description={deleting && p.deleteWarning ? p.deleteWarning(deleting) : "This can’t be undone."}
                        busy={deleteBusy}
                        onConfirm={confirmDelete}
                    />
                </PermissionGate>
            )}
        </main>
    );
}