import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <p>Sorry, something went wrong</p>
      <Link href="/">Go back to home</Link>
    </div>
  );
}
