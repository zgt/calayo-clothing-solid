import { createSignal, For, Suspense } from "solid-js";
import PhotoGrid from "~/components/PhotoGrid";
import LoadingAnimation from "~/components/LoadingAnimation";

export default function Home() {
  return (
    <main class="min-h-screen bg-gradient-to-b from-emerald-950 to-gray-950 flex flex-col justify-center p-4">
      <Suspense fallback={<LoadingAnimation />}>
        <PhotoGrid />
      </Suspense>
    </main>
  );
}