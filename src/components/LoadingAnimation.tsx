import { Motion } from "solid-motionone";

export default function LoadingAnimation() {
  return (
    <div class="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <Motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{ duration: 2, repeat: Infinity, easing: "ease-in-out" }}
        class="relative"
      >
        {/* Outer glow */}
        <div class="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl transform scale-150"></div>
        
        {/* Spinner container */}
        <div class="relative flex items-center justify-center h-24 w-24">
          {/* Spinner circles */}
          <Motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, easing: "linear" }}
            class="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 border-b-emerald-400/60"
          ></Motion.div>
          
          <Motion.div
            animate={{ rotate: -180 }}
            transition={{ duration: 1.5, repeat: Infinity, easing: "linear" }}
            class="absolute inset-2 rounded-full border-4 border-transparent border-l-emerald-500 border-r-emerald-500/60"
          ></Motion.div>
          
          {/* Center circle with icon */}
          <div class="absolute inset-6 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full shadow-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </Motion.div>
      
      {/* Loading text */}
      <Motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, easing: "ease-in-out" }}
        class="mt-8 text-emerald-300"
      >
        <h3 class="text-xl font-medium text-center">Loading Photos</h3>
        <div class="mt-2 flex justify-center space-x-1">
          <Motion.div
            animate={{ y: [-3, 0, -3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0, easing: "ease-in-out" }}
            class="h-2 w-2 rounded-full bg-emerald-400"
          ></Motion.div>
          <Motion.div
            animate={{ y: [-3, 0, -3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.2, easing: "ease-in-out" }}
            class="h-2 w-2 rounded-full bg-emerald-400"
          ></Motion.div>
          <Motion.div
            animate={{ y: [-3, 0, -3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4, easing: "ease-in-out" }}
            class="h-2 w-2 rounded-full bg-emerald-400"
          ></Motion.div>
        </div>
      </Motion.div>
    </div>
  );
}