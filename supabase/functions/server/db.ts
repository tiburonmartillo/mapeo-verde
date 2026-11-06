import { createClient } from "jsr:@supabase/supabase-js@2";

let cachedClient: ReturnType<typeof createClient> | null = null;

const getClient = () => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing Supabase credentials");
  }
  // Reuse a single client (connection pooling) instead of one per request.
  if (!cachedClient) {
    cachedClient = createClient(url, key);
  }
  return cachedClient;
};

export const healthCheck = async () => {
  const supabase = getClient();
  // Verify DB connectivity against an existing table.
  const { error } = await supabase.from("events").select("id").limit(1);
  if (error) throw error;
  return true;
};

export const getByPrefix = async (prefix: string) => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("kv_store_183eaf28")
    .select("key, value")
    .like("key", prefix + "%");
  
  if (error) throw error;
  return data?.map((d: any) => d.value) ?? [];
};

export const mset = async (keys: string[], values: any[]) => {
  const supabase = getClient();
  const upserts = keys.map((k, i) => ({ key: k, value: values[i] }));
  const { error } = await supabase.from("kv_store_183eaf28").upsert(upserts);
  if (error) throw error;
};

export const set = async (key: string, value: any) => {
  const supabase = getClient();
  const { error } = await supabase.from("kv_store_183eaf28").upsert({ key, value });
  if (error) throw error;
};

export const get = async (key: string) => {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("kv_store_183eaf28")
    .select("value")
    .eq("key", key)
    .maybeSingle();
    
  if (error) throw error;
  return data?.value;
};