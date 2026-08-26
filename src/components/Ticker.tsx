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
  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0f1117]/40 mx-5 align-middle" />
);

export default function Ticker() {
  const content = items.map((item, i) => (
    <span key={i} className="inline-flex items-center">
      <span className="text-[#0f1117] font-semibold text-sm tracking-wide">{item}</span>
      <Dot />
    </span>
  ));

  return (
    <div className="bg-[#c9a84c] py-3.5 overflow-hidden border-y border-[#a07830]/40">
      <div className="flex whitespace-nowrap animate-ticker">
        <span className="inline-flex items-center">{content}</span>
        <span className="inline-flex items-center">{content}</span>
        <span className="inline-flex items-center">{content}</span>
      </div>
    </div>
  );
}
