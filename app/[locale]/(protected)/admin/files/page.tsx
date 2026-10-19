"use client";

import { FileManager } from "@/components/admin/file-manager";

export default function AdminFilesPage() {
    return (
        <main className="flex flex-1 flex-col space-y-5 p-4 md:p-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight">Files</h1>
                <p className="text-sm text-muted-foreground">Everything you upload lives here. Copy a link and use it anywhere.</p>
            </header>
            <FileManager mode="manage" />
        </main>
    );
}