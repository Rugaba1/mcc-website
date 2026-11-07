const items = [
  "Premium Quality Tiles",
  "Made in Rwanda",
  "Residential Projects",
  "Commercial Projects",
  "Industrial Projects",
  "Floor Tiles",
  "Wall Tiles",
  "Outdoor Tiles",
  "Custom Designs",
  "ISO 9001 Certified",
  "East Africa Delivery",
  "10-Year Warranty",
];

const Dot = () => (
  <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent/40 mx-5 align-middle" />
);

export default function Ticker() {
  return (
    <div
      className="ticker overflow-hidden border-y border-primary-foreground/20 bg-primary py-3.5"
      role="region"
      aria-label="Company highlights"
    >
      <div className="ticker-track flex w-max whitespace-nowrap">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="inline-flex shrink-0 items-center"
            aria-hidden={copy === 1}
          >
            {items.map((item) => (
              <span key={item} className="inline-flex items-center">
                <span className="text-sm font-semibold tracking-wide">{item}</span>
                <Dot />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
