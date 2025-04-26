import { createSignal, For, Suspense } from "solid-js"
import PhotoGrid from "~/components/PhotoGrid";


export default function Home() {

  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <PhotoGrid/>
      </Suspense>
    </main>
  );
}
