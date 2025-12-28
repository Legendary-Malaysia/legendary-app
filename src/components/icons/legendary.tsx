import Image from "next/image";

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
    <Image
      src="/logo.png"
      alt="Legendary Logo"
      width={width}
      height={height}
      className={className}
    />
  );
}
