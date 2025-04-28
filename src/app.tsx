import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Nav from "~/components/Nav";
import "./app.css";
import { createClient } from '@supabase/supabase-js';
import { SupabaseProvider } from 'solid-supabase';
import { AuthProvider } from "./context/auth";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);


export default function App() {
  return (
    <SupabaseProvider client={supabase}>
      <AuthProvider>   
        <Router
          root={props => (
            <>
              <Nav />
              <Suspense>{props.children}</Suspense>
            </>
          )}
        >
          <FileRoutes />
        </Router>
      </AuthProvider>
    </SupabaseProvider>
  );
}
