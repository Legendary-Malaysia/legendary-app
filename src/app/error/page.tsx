import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <p>Sorry, something went wrong</p>
      <Link href="/">Go back to home</Link>
    </div>
  );
}
