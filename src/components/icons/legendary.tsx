import Image from "next/image";

export function LegendaryLogo({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <Image
      src="/logo.png"
      alt="Legendary Logo"
      width={width}
      height={height}
    />
  );
}
