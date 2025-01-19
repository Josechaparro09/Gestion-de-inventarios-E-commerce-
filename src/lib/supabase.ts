//src\lib\supabase.ts
import { createClient } from '@supabase/supabase-js';

console.log('🌐 Supabase Initialization');
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key Present:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function signIn(email: string, password: string) {
  localStorage.removeItem('store');
  localStorage.removeItem('stores');
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  localStorage.removeItem('user');
  localStorage.removeItem('stores');
  return supabase.auth.signOut();
}