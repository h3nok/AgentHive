import { Suspense } from "react";
import dynamic from "next/dynamic";

const HoneyHero = dynamic(() => import("../components/HoneyHero"), {
  ssr: false,
  loading: () => <div className="h-[60vh] flex items-center justify-center">Loading…</div>,
});

export default async function LandingPage() {
  return (
    <main>
      <Suspense>
        <HoneyHero />
      </Suspense>
    </main>
  );
}
