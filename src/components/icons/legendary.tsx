export function LegendaryLogo({
  className,
  width,
  height,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <img
      src="logo.png"
      alt="Legendary Logo"
      width={width}
      height={height}
      className={className}
    />
  );
}