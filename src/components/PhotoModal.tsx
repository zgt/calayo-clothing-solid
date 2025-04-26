import { createSignal } from "solid-js";
import { For, Portal, Show } from "solid-js/web";
import 'vidstack/bundle';
import 'vidstack/player/styles/base.css';
import 'vidstack/player';
import 'vidstack/player/ui';
import 'vidstack/icons';
import { isHLSProvider, type MediaCanPlayEvent, type MediaProviderChangeEvent } from 'vidstack';
import type { MediaPlayerElement } from 'vidstack/elements';



export default function PhotoModal(props: any) {
    const [numChildren, setNumChildren] = createSignal(props.instaChildren.length)
    console.log(props.instaChildren)
    return (
            <div class="mx-auto rounded-lg bg-[#003a2d] max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-12">
                <ul role="list" class= {numChildren() <= 5 ? "grid grid-cols-2 gap-x-4 gap-y-8 sm:col-start-auto sm:gap-x-6 lg:grid-cols-3 xl:gap-x-8" : "grid grid-cols-2 gap-x-4 gap-y-8 sm:col-start-auto sm:gap-x-6 lg:grid-cols-5 xl:gap-x-8"}>
                    <For each={props.instaChildren}>
                        {(item) =>(
                        <li>
                            <div>
                                <Show when={item.isImage}>
                                    <img src={item.mediaUrl} class="relative rounded-lg pointer-events-none aspect-[4/5] object-cover group-hover:opacity-75"></img>
                                </Show>
                                <Show when={item.isImage == false}>
                                    <media-player src={item.mediaUrl}  autoplay={true} muted={true} loop={true}>
                                        <media-provider/>
                                    </media-player>
                                    
                                </Show>

                            </div>
                        </li>
                        )}
                    </For>
                </ul>
            </div>
    )
}