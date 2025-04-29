import { Motion } from "solid-motionone";

export default function About() {
  return (
    <main class="min-h-screen bg-gradient-to-b from-emerald-950 to-gray-950 py-16 px-4 sm:px-6">
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, easing: "ease-out" }}
        class="max-w-3xl mx-auto"
      >
        <div class="bg-gradient-to-br from-emerald-900/30 to-emerald-950/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-emerald-700/20">
          <h1 class="text-4xl font-bold text-white mb-6">About Me</h1>
          
          <div class="prose prose-emerald prose-invert max-w-none">
            <p class="text-emerald-100/90 mb-6 leading-relaxed">
              I'm a software developer with over 4 years of full stack experience, specializing in JavaScript and Java applications. 
              My technical expertise lies in modern JavaScript frameworks - I built this website using Solid.js, SolidStart, and Supabase, 
              after previously creating a version with React, Next.js, and MongoDB. I offer a strong background in creative problem-solving 
              and a proven ability to multi-task and prioritize in fast-paced, stressful environments.
            </p>
            
            <p class="text-emerald-100/90 mb-6 leading-relaxed">
              Beyond code, I'm a self-taught fashion designer who turned passion into practice. My journey began with a sewing machine 
              and countless YouTube tutorials, learning the craft stitch by stitch. Currently, I'm exploring Clo-3D to create my own 
              patterns—a perfect intersection of my technical skills and creative vision.
            </p>
            
            <p class="text-emerald-100/90 mb-6 leading-relaxed">
              Throughout my life, I've explored various creative outlets, but nothing resonated until I discovered fashion design. 
              It's become the canvas where my ideas finally take shape, allowing me to express myself in ways code alone never could.
            </p>
            
            <p class="text-emerald-100/90 leading-relaxed">
              My dual background gives me a unique perspective—I approach fashion with the precision of a developer and bring a 
              designer's creativity to my technical work.
            </p>
          </div>
          
          <div class="mt-12 border-t border-emerald-700/30 pt-8">
            <h2 class="text-2xl font-bold text-white mb-4">Technical Skills</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-semibold text-emerald-400 mb-3">Development</h3>
                <ul class="space-y-2">
                  <li class="flex items-center text-emerald-100/90">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    JavaScript/TypeScript
                  </li>
                  <li class="flex items-center text-emerald-100/90">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Solid.js/React
                  </li>
                  <li class="flex items-center text-emerald-100/90">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    SolidStart/Next.js
                  </li>
                  <li class="flex items-center text-emerald-100/90">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Java
                  </li>
                  <li class="flex items-center text-emerald-100/90">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Spring Framework
                  </li>
                  <li class="flex items-center text-emerald-100/90">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    SQL
                  </li>
                  <li class="flex items-center text-emerald-100/90">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Supabase/MongoDB
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 class="text-lg font-semibold text-emerald-400 mb-3">Design</h3>
                <ul class="space-y-2">
                  <li class="flex items-center text-emerald-100/90">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Fashion Design
                  </li>
                  <li class="flex items-center text-emerald-100/90">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Pattern Making
                  </li>
                  <li class="flex items-center text-emerald-100/90">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Clo-3D
                  </li>
                  <li class="flex items-center text-emerald-100/90">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Sewing/Construction
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="mt-12 text-center">
            <a 
              href="/commissions" 
              class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium rounded-lg shadow-lg shadow-emerald-900/30 transition-all duration-200 hover:shadow-emerald-800/40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              Request a Commission
            </a>
          </div>
        </div>
      </Motion.div>
    </main>
  );
}