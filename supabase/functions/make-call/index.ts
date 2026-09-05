/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { buildCorsHeaders, jsonResponse, rejectMissingOrDisallowedOrigin } from "../_shared/security.ts";
import { getAuthedUser, userHasBusinessAccess } from "../_shared/auth.ts";

import { getBusinessClient } from "../_shared/twilio/business.ts";
import { canMakeCall, incrementVoiceMinutes } from "../_shared/twilio/usage.ts";

// Only allow Twilio webhook URLs pointing at our own Supabase functions.
const FUNCTIONS_BASE_URL = `${new URL(Deno.env.get("SUPABASE_URL")!).origin}/functions/v1/`;

interface CallRequest {
  businessId: string;
  toPhone: string;
  webhookUrl: string;
}

function validate(input: unknown): CallRequest | null {
  if (!input || typeof input !== "object") return null;

  const obj = input as Record<string, unknown>;

  if (typeof obj.businessId !== "string") return null;
  if (typeof obj.toPhone !== "string") return null;
  if (typeof obj.webhookUrl !== "string") return null;

  return {
    businessId: obj.businessId,
    toPhone: obj.toPhone,
    webhookUrl: obj.webhookUrl,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: buildCorsHeaders(req) });
  }

  const blocked = rejectMissingOrDisallowedOrigin(req);

  if (blocked) return blocked;

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  const user = await getAuthedUser(req);
  if (!user) {
    return jsonResponse(req, { error: "Unauthorized" }, 401);
  }

  const payload = validate(await req.json());

  if (!payload) {
    return jsonResponse(req, { error: "Invalid request" }, 400);
  }

  const { businessId, toPhone, webhookUrl } = payload;

  if (!webhookUrl.startsWith(FUNCTIONS_BASE_URL)) {
    return jsonResponse(req, { error: "webhookUrl not allowed" }, 400);
  }

  const hasAccess = await userHasBusinessAccess(user.userId, businessId);
  if (!hasAccess) {
    return jsonResponse(req, { error: "Forbidden" }, 403);
  }

  const allowed = await canMakeCall(businessId);

  if (!allowed) {
    return jsonResponse(
      req,
      {
        error: "Voice minutes exceeded",
      },
      402,
    );
  }

  const { client, fromNumber } = await getBusinessClient(businessId);

  const call = await client.calls.create({
    to: toPhone,

    from: fromNumber,

    url: webhookUrl,
  });

  await incrementVoiceMinutes(businessId, 1, call.sid);

  return jsonResponse(req, {
    success: true,

    sid: call.sid,

    status: call.status,
  });
});
