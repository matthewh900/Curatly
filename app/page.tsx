// app/page.tsx (this is a server component by default)
import { Suspense } from "react";
import HomePage from "@/lib/components/homepage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePage />
    </Suspense>
  );
}
