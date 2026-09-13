import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    "https://kcvpmllxroxhnrhyhxfp.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdnBtbGx4cm94aG5yaHloeGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMzc2MTYsImV4cCI6MjEwNDgxMzYxNn0.imBL795spt4-Xxf35ugtNOo1wwkAclRsQ9CY4L9AAaI",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
          }
        },
      },
    }
  );
}
