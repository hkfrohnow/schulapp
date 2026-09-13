import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      "https://kcvpmllxroxhnrhyhxfp.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdnBtbGx4cm94aG5yaHloeGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMzc2MTYsImV4cCI6MjEwNDgxMzYxNn0.imBL795spt4-Xxf35ugtNOo1wwkAclRsQ9CY4L9AAaI"
    );
  }
  return client;
}
