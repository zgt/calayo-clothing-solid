import { A, RouteDefinition } from "@solidjs/router";
import { fetchUserMedia } from "~/api/instagram/fetchUserMedia";
import { fetchMedia } from "~/api/instagram/fetchMedia";
import { fetchChildrenIds } from "~/api/instagram/fetchChildrenIds";
import { fetchChildrenMedia } from "~/api/instagram/fetchChildrenMedia";
import { query, createAsync } from "@solidjs/router";
import { createSignal, For, Show, createEffect } from "solid-js";
import { Portal } from "solid-js/web";
import { Motion } from "solid-motionone";
import PhotoModal from "./PhotoModal";
import Dialog from '@corvu/dialog';
import LoadingAnimation from "./LoadingAnimation";

export interface InstaItem {
  permalink: string;
  mediaUrl: string;
  parentId: string;
  children: InstaChild[];
  caption?: string;
}

export interface InstaChild {
  mediaUrl: string;
  parentId: string;
  isImage: boolean;
  caption?: string;
}

const getInstaItems = query(async () => {
  const json = await fetchUserMedia();
  const fetchedItems: InstaItem[] = [];

  for (let i = 0; i < json.length; i++) {
    const item = json[i];
    const itemId = item.id;
    const instaItem = await (fetchMedia(itemId));
    const childrenIds = await (fetchChildrenIds(itemId));
    const childrenMedia = await (fetchChildrenMedia(childrenIds));

    instaItem.children = childrenMedia;
    fetchedItems.push(instaItem);
  }

  return fetchedItems;
}, "fetchedItems");

export const route = {
  preload: () => getInstaItems(),
} satisfies RouteDefinition;

export default function PhotoGrid() {
  const fetchedItems = createAsync(() => getInstaItems());
  const [selectedItem, setSelectedItem] = createSignal<InstaItem | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  
  // Simulate loading time if needed
  createEffect(() => {
    if (fetchedItems()) {
      setTimeout(() => setIsLoading(false), 500);
    }
  });
  
  return (
    <Motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      class="relative w-full"
    >
      <div class="absolute inset-0 bg-gradient-to-b from-emerald-950 to-gray-950 -z-10"></div>
      
      {/* 70% width container with centering */}
      <div class="w-[70%] -mt-80 mx-auto px-4 py-8">
        
        <Show when={!isLoading()} fallback={<LoadingAnimation />}>
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            class="rounded-xl bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm p-4 sm:p-6 shadow-xl border border-emerald-700/20"
          >
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
              <For each={fetchedItems()}>
                {(item, index) => (
                  <Motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index() }}
                  >
                    <Dialog>
                      <Dialog.Trigger>
                        <button 
                          class="w-full text-left" 
                          onClick={() => setSelectedItem(item)}
                        >
                          <div class="group relative cursor-pointer overflow-hidden rounded-lg shadow-md shadow-emerald-950/50 ring-1 ring-emerald-700/30 transition-all hover:shadow-lg hover:shadow-emerald-900/30 hover:ring-emerald-500/40">
                            <div class="aspect-[4/5] w-full overflow-hidden">
                              <img
                                src={item.mediaUrl}
                                alt={item.caption || "Gallery image"}
                                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div class="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              
                              {/* View overlay */}
                              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div class="rounded-full bg-emerald-600/80 p-2 backdrop-blur-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            
                            {/* Media type indicator */}
                            <Show when={item.children && item.children.length > 1}>
                              <div class="absolute top-2 right-2 bg-emerald-700/80 rounded-md px-1.5 py-0.5 backdrop-blur-sm">
                                <div class="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2-1h10a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" clip-rule="evenodd" />
                                    <path d="M6 7h8v2H6V7zm0 4h8v2H6v-2z" />
                                  </svg>
                                  <span class="ml-0.5 text-xs font-medium text-white">{item.children.length}</span>
                                </div>
                              </div>
                            </Show>
                          </div>
                        </button>
                      </Dialog.Trigger>
                      
                      <Dialog.Portal>
                        <Dialog.Overlay class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
                        <Dialog.Content class="fixed left-1/2 top-1/2 z-50 w-full max-w-7xl -translate-x-1/2 -translate-y-1/2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-top-4 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:slide-out-to-top-4">
                          <Show when={selectedItem()}>
                            <PhotoModal 
                              instaChildren={selectedItem()?.children || []} 
                              title={selectedItem()?.caption || "Photo Gallery"}
                              onClose={() => {
                                setSelectedItem(null);
                                // Close the Dialog when needed
                              }}
                            />
                          </Show>
                        </Dialog.Content>
                      </Dialog.Portal>
                    </Dialog>
                  </Motion.div>
                )}
              </For>
            </div>
          </Motion.div>
        </Show>
      </div>
    </Motion.main>
  );
}