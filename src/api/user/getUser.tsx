import { useSupabase } from 'solid-supabase';

export async function getUser(){
    const supabase = useSupabase(); 

    const { data: { user } } = await supabase.auth.getUser()
    return user
  }