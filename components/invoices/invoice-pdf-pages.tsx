"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";

 
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const Spinner = () => (
  <div className="flex items-center justify-center py-24 text-muted-foreground">
    <Loader2 className="size-6 animate-spin" />
  </div>
);

interface Props {
  file: Blob;
  scale: number;
}

export default function InvoicePdfPages({ file, scale }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full">
      <Document
        file={file}
        loading={<Spinner />}
        error={
          <p className="py-24 text-center text-sm text-destructive">
            This PDF could not be displayed.
          </p>
        }
        onLoadSuccess={({ numPages }) => setPages(numPages)}
      >
        {/* w-max + min-w-full keeps zoomed pages scrollable instead of clipped */}
        <div className="flex w-max min-w-full flex-col items-center gap-4">
          {width > 0 &&
            Array.from({ length: pages }, (_, i) => (
              <Page
                key={i + 1}
                pageNumber={i + 1}
                width={Math.floor(width * scale)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="overflow-hidden"
                loading={<Spinner />}
              />
            ))}
        </div>
      </Document>
    </div>
  );
}
