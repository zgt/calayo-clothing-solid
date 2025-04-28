import { createSignal, createEffect } from "solid-js";
import { For, Portal, Show } from "solid-js/web";
import { Motion } from "solid-motionone";
import 'vidstack/bundle';
import 'vidstack/player/styles/base.css';
import 'vidstack/player';
import 'vidstack/player/ui';
import 'vidstack/icons';

export default function PhotoModal(props: any) {
    const [numChildren, setNumChildren] = createSignal(props.instaChildren.length);
    const [selectedIndex, setSelectedIndex] = createSignal(-1);
    
    // Handle close when ESC key is pressed
    createEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && props.onClose) {
                props.onClose();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    return (
        <Portal>
            <div class="fixed inset-0 z-50 overflow-y-auto">
                <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                    {/* Backdrop with blur effect */}
                    <div 
                        class="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                        onClick={props.onClose}
                    ></div>
                    
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, easing: "ease-out" }}
                        class="relative w-full max-w-7xl transform overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/95 to-emerald-950/95 p-6 text-left shadow-xl transition-all sm:p-8"
                    >
                        {/* Header area */}
                        <div class="mb-6 flex items-center justify-between border-b border-emerald-700/30 pb-4">
                            <h3 class="text-2xl font-bold text-emerald-100">
                                {props.title || "Photo Gallery"}
                            </h3>
                            
                            <button
                                onClick={props.onClose}
                                class="rounded-full p-2 text-emerald-400 hover:bg-emerald-800/30 hover:text-emerald-200 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Gallery */}
                        <div class="px-2">
                            <ul role="list" 
                                class={numChildren() <= 4 
                                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                                    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6"
                                }
                            >
                                <For each={props.instaChildren}>
                                    {(item, index) => (
                                        <li>
                                            <div class="group relative overflow-hidden rounded-xl shadow-md shadow-emerald-900/50 ring-1 ring-emerald-700/20 transition-all hover:ring-2 hover:ring-emerald-500/40 cursor-pointer"
                                                 onClick={() => setSelectedIndex(index())}>
                                                <div class="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                                                
                                                <Show when={item.isImage}>
                                                    <img 
                                                        src={item.mediaUrl} 
                                                        class="aspect-[4/5] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        alt={item.caption || "Gallery image"}
                                                    />
                                                </Show>
                                                
                                                <Show when={item.isImage === false}>
                                                    <div class="aspect-[4/5] overflow-hidden">
                                                        <media-player 
                                                            class="h-full w-full" 
                                                            src={item.mediaUrl} 
                                                            autoplay={true} 
                                                            muted={true} 
                                                            loop={true}
                                                        >
                                                            <media-provider />
                                                        </media-player>
                                                    </div>
                                                </Show>
                                                
                                                {/* Optional caption overlay */}
                                                <Show when={item.caption}>
                                                    <div class="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-emerald-950/80 to-transparent p-3 text-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p class="text-sm">{item.caption}</p>
                                                    </div>
                                                </Show>
                                            </div>
                                        </li>
                                    )}
                                </For>
                            </ul>
                        </div>
                        
                        {/* Optional footer */}
                        <Show when={props.footerText}>
                            <div class="mt-6 border-t border-emerald-700/30 pt-4 text-center text-sm text-emerald-300/70">
                                {props.footerText}
                            </div>
                        </Show>
                        
                        {/* Fullscreen preview modal */}
                        <Show when={selectedIndex() >= 0}>
                            <div 
                                class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
                                onClick={() => setSelectedIndex(-1)}
                            >
                                <Motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    class="relative max-h-[90vh] max-w-[90vw] overflow-hidden"
                                >
                                    <Show when={props.instaChildren[selectedIndex()]?.isImage}>
                                        <img 
                                            src={props.instaChildren[selectedIndex()]?.mediaUrl} 
                                            class="max-h-[90vh] max-w-[90vw] object-contain"
                                            alt="Full view"
                                        />
                                    </Show>
                                    
                                    <Show when={props.instaChildren[selectedIndex()]?.isImage === false}>
                                        <div class="max-h-[90vh] max-w-[90vw]">
                                            <media-player 
                                                class="h-full w-full" 
                                                src={props.instaChildren[selectedIndex()]?.mediaUrl} 
                                                autoplay={true} 
                                                controls={true}
                                                loop={true}
                                            >
                                                <media-provider />
                                            </media-player>
                                        </div>
                                    </Show>
                                    
                                    {/* Navigation arrows */}
                                    <button 
                                        class="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-emerald-900/80 p-3 text-white hover:bg-emerald-700/80 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedIndex(prev => (prev - 1 + numChildren()) % numChildren());
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    
                                    <button 
                                        class="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-emerald-900/80 p-3 text-white hover:bg-emerald-700/80 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedIndex(prev => (prev + 1) % numChildren());
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                    
                                    <button 
                                        class="absolute right-4 top-4 rounded-full bg-emerald-900/80 p-2 text-white hover:bg-emerald-700/80 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedIndex(-1);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </Motion.div>
                            </div>
                        </Show>
                    </Motion.div>
                </div>
            </div>
        </Portal>
    );
}