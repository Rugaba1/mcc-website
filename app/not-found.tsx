import localFont from "next/font/local";
import "./globals.css";
const centuryGothic = localFont({
  src: [
    { path: "../public/fonts/century/centurygothic.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/century/centurygothic_bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-century-gothic",
  display: "swap",
});

const glovar = localFont({
  src: [
    { path: "../public/fonts/glovar/glovar.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/glovar/glovar.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-glovar",
  display: "swap",
})

export default function NotFound() {
  return (
    <html lang="en" className={`${centuryGothic.variable} ${glovar.variable}`}>
      <body className="font-sans antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-20 text-center">
          <p className="font-serif text-[10rem] font-bold leading-none text-foreground sm:text-[12rem]">
            404
          </p>
          <div className="mx-auto mt-2 h-px w-24 bg-primary" />

          <h1 className="mt-8 text-2xl font-bold text-foreground sm:text-3xl">
            Page not found
          </h1>
          <p className="mt-3 max-w-md text-base text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href="/"
              className=" bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go home
            </a>
            <a
              href="/sermons"
              className="border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Sermons
            </a>
            <a
              href="/contact"
              className="border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Contact
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
