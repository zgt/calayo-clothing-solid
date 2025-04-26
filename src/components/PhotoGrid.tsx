import { A, RouteDefinition } from "@solidjs/router";
import { fetchUserMedia } from "~/api/instagram/fetchUserMedia";
import { fetchMedia } from "~/api/instagram/fetchMedia";
import { fetchChildrenIds } from "~/api/instagram/fetchChildrenIds";
import { fetchChildrenMedia } from "~/api/instagram/fetchChildrenMedia";
import { query, createAsync } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js"
import { Portal } from "solid-js/web";
import PhotoModal from "./PhotoModal";
import Dialog from '@corvu/dialog'


export interface InstaItem {
    permalink: string;
    mediaUrl: string;
    parentId: string;
    children: InstaChild[];
}

export interface InstaChild {
    mediaUrl: string;
    parentId: string;
    isImage: boolean;
}

const getInstaItems = query(async () => {
    const json = await fetchUserMedia();
    const fetchedItems: InstaItem[] = [];

    for(let i = 0; i<json.length; i++){
        const item = json[i];
        const itemId = item.id;
        const instaItem = await(fetchMedia(itemId))
        const childrenIds = await(fetchChildrenIds(itemId))
        const childrenMedia = await(fetchChildrenMedia(childrenIds))

        instaItem.children = childrenMedia
        fetchedItems.push(instaItem)
    }

    return fetchedItems;
}, "fetchedItems")

export const route = {
    preload: () => getInstaItems(),
} satisfies RouteDefinition;

export default function PhotoGrid() {
    const fetchedItems = createAsync(()=> getInstaItems());
    const [isOpen, setIsOpen] = createSignal("");
    const handleClose = () => setIsOpen("");
    const handleOpen = (id: string) => setIsOpen(id);



  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <div class="mx-auto rounded-lg bg-[#003a2d] max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <ul role="list" class="grid grid-cols-2 gap-x-4 gap-y-8 sm:col-start-auto sm:gap-x-6 lg:grid-cols-3 xl:gap-x-8">
          <For each={fetchedItems()}>
            {(item) =>(
                <div>
                    <li>
                        <Dialog>
                            <Dialog.Trigger>
                                <img src={item.mediaUrl} class="relative rounded-lg pointer-events-none aspect-[4/5] object-cover group-hover:opacity-75"></img>
                            </Dialog.Trigger>
                            <Dialog.Portal>
                                <Dialog.Content class="fixed left-1/2 top-1/2 z-50 min-w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg  border-corvu-400 bg-corvu-100 px-6 py-5 data-open:animate-in data-open:fade-in-0% data-open:zoom-in-95% data-open:slide-in-from-top-10% data-closed:animate-out data-closed:fade-out-0% data-closed:zoom-out-95% data-closed:slide-out-to-top-10%">
                                    <PhotoModal instaChildren={item.children}/>
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog>
                    </li>
                </div>
            )}
          </For>
        </ul>
      </div>
    </main>
  );
}
