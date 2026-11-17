/** Hand-drawn-feeling vessel silhouettes used where there's no photo yet. */
const SHAPES = [
  // Moon jar
  "M60 18c-6 0-9 3-9 7v4C26 34 12 56 12 82c0 30 20 50 48 50s48-20 48-50c0-26-14-48-39-53v-4c0-4-3-7-9-7z",
  // Tall bottle
  "M53 10h14v26c18 8 30 30 30 56 0 26-16 40-37 40S23 118 23 92c0-26 12-48 30-56V10z",
  // Wide bowl
  "M8 62h104c0 34-24 58-52 58S8 96 8 62zm40 58h24v8H48z",
  // Jug
  "M42 16h40l-4 14c16 10 26 30 26 52 0 28-18 46-44 46S16 110 16 82c0-22 10-42 26-52l-6-8 6-6zm62 40c10 2 14 10 12 20-2 8-8 12-14 12",
];

export function Vessel({
  variant = 0,
  className,
  fill = "currentColor",
}: {
  variant?: number;
  className?: string;
  fill?: string;
}) {
  const d = SHAPES[variant % SHAPES.length];
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true">
      <path d={d} fill={fill} />
      {/* glaze line */}
      <path d={d} fill="none" stroke="#000" strokeOpacity=".08" strokeWidth="2" />
    </svg>
  );
}
