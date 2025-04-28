import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Nav from "~/components/Nav";
import "./app.css";
import { createClient } from '@supabase/supabase-js';
import { SupabaseProvider } from 'solid-supabase';
import { AuthProvider } from "./context/auth";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);


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
