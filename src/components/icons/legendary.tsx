import Image from "next/image";

export function LegendaryLogo({
  width,
  height,
  darkMode = false,
}: {
  width: number;
  height: number;
  darkMode: boolean;
}) {
  return (
    <Image
      src={darkMode ? "/logo-white.png" : "/logo.png"}
      alt="Legendary Logo"
      width={width}
      height={height}
    />
  );
}
