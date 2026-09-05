import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export function serviceRoleClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
}

export interface AuthedUser {
  userId: string;
  email?: string;
  role: string;
}

/**
 * Validates the Authorization: Bearer <jwt> header and returns the user claims.
 * Returns null for anonymous / missing / invalid JWTs.
 */
export async function getAuthedUser(req: Request): Promise<AuthedUser | null> {
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  if (!token) return null;

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  try {
    const { data, error } = await client.auth.getClaims(token);
    if (error || !data?.claims?.sub) return null;
    const role = String(data.claims.role ?? "");
    if (role === "anon" || !role) return null;
    return {
      userId: String(data.claims.sub),
      email: data.claims.email ? String(data.claims.email) : undefined,
      role,
    };
  } catch {
    return null;
  }
}

/**
 * Confirms the given user is the owner of the business or an active team member.
 */
export async function userHasBusinessAccess(userId: string, businessId: string): Promise<boolean> {
  const admin = serviceRoleClient();

  const { data: biz } = await admin
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .maybeSingle();
  if (biz?.owner_id === userId) return true;

  const { data: member } = await admin
    .from("team_members")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  return !!member;
}
