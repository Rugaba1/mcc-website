"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const mapEmbedUrl =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.108191352513!2d29.7292651758785!3d-2.111935437087791!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dccbc038607527%3A0xec52b44cf553d0fe!2sMOUNTAIN%20CERAMICS%20CO.%20LTD.!5e0!3m2!1sen!2srw!4v1792857616824!5m2!1sen!2srw";

export function GoogleMapEmbed() {
  const t = useTranslations("contactPage");
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <section className="mt-16 border border-border bg-muted">
      <div className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold">{t("mapEmbedHeading")}</h2>
          {!isLoaded && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {t("mapEmbedNotice")}
            </p>
          )}
        </div>
        {!isLoaded && (
          <Button
            type="button"
            onClick={() => setIsLoaded(true)}
            className="shrink-0"
          >
            {t("mapEmbedButton")}
          </Button>
        )}
      </div>
      {isLoaded && (
        <div className="aspect-4/3 w-full border-t border-border">
          <iframe
            src={mapEmbedUrl}
            title={t("mapEmbedTitle")}
            width="600"
            height="450"
            className="h-full w-full"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
    </section>
  );
}
