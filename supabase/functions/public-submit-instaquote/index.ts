import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { buildCorsHeaders, jsonResponse, rejectMissingOrDisallowedOrigin } from "../_shared/security.ts";

type CustomerInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
};

type PropertyInput = {
  bedrooms?: string;
  bathrooms?: string;
  sqft?: string;
  notes?: string;
};

type QuoteItemInput = {
  serviceId?: string;
  quantity?: number;
};

type BookingInput = {
  businessId?: string;
  serviceType?: string;
  category?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  sqft?: string;
  bedrooms?: string;
  bathrooms?: string;
  preferredDate?: string;
  preferredTime?: string;
  extras?: string[];
  notes?: string;
  estimatedTotal?: number;
  leadScore?: number;
  isHighValue?: boolean;
};

const cleanText = (value: unknown, max = 255) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const parsePositiveInt = (value: unknown) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const blocked = rejectMissingOrDisallowedOrigin(req);
  if (blocked) return blocked;

  try {
    if (req.method !== "POST") {
      return jsonResponse(req, { error: "Method not allowed" }, 405);
    }

    const body = await req.json();

    if (body?.kind === "booking_request") {
      const booking = (body?.booking || {}) as BookingInput;
      const businessId = cleanText(booking.businessId, 80);
      const serviceType = cleanText(booking.serviceType, 80);
      const category = cleanText(booking.category, 40) || "residential";
      const name = cleanText(booking.name, 160);
      const email = cleanText(booking.email, 255).toLowerCase();
      const phone = cleanText(booking.phone, 40);
      const address = cleanText(booking.address, 300);
      const city = cleanText(booking.city, 120);
      const state = cleanText(booking.state, 40);
      const zip = cleanText(booking.zip, 20);
      const preferredDate = cleanText(booking.preferredDate, 20);
      const preferredTime = cleanText(booking.preferredTime, 40);
      const notes = cleanText(booking.notes, 1500);
      const estimatedTotal = Math.max(0, Number(booking.estimatedTotal) || 0);
      const extras = Array.isArray(booking.extras)
        ? booking.extras.map((item) => cleanText(item, 120)).filter(Boolean).slice(0, 50)
        : [];

      if (!businessId) return jsonResponse(req, { error: "Missing booking link" }, 400);
      if (!name || !email || !address) {
        return jsonResponse(req, { error: "Missing required booking details" }, 400);
      }
      if (!isEmail(email)) return jsonResponse(req, { error: "Invalid email address" }, 400);
      if (!serviceType) return jsonResponse(req, { error: "Please select a cleaning service" }, 400);

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } },
      );

      const { data: business, error: businessError } = await supabaseAdmin
        .from("businesses")
        .select("id, slug")
        .eq("id", businessId)
        .maybeSingle();

      if (businessError) throw businessError;
      if (!business?.id || !business.slug) return jsonResponse(req, { error: "Business not found" }, 404);

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("cleaning_booking_requests")
        .insert({
          business_id: business.id,
          category: category === "commercial" || category === "post_construction" ? "commercial" : "residential",
          cleaning_type: serviceType,
          name,
          email,
          phone: phone || null,
          address,
          city: city || null,
          state: state || null,
          zip: zip || null,
          property_sqft: parsePositiveInt(booking.sqft),
          bedrooms: parsePositiveInt(booking.bedrooms),
          bathrooms: parsePositiveInt(booking.bathrooms),
          preferred_date: preferredDate || null,
          preferred_time: preferredTime || null,
          extras,
          notes: notes || null,
          estimated_total: estimatedTotal,
          lead_score: Math.max(0, Math.min(100, Number(booking.leadScore) || 55)),
          is_high_value: Boolean(booking.isHighValue),
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Also save/update the lead in the CRM (customers table) so it shows up
      // alongside manually-added customers. Non-fatal if this fails.
      try {
        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts[0] || name;
        const lastName = nameParts.slice(1).join(" ") || "-";

        const { data: existing } = await supabaseAdmin
          .from("customers")
          .select("id")
          .eq("business_id", business.id)
          .eq("email", email)
          .maybeSingle();

        const customerPayload = {
          business_id: business.id,
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zip: zip || null,
          notes: notes || null,
        };

        if (existing?.id) {
          await supabaseAdmin
            .from("customers")
            .update(customerPayload)
            .eq("id", existing.id);
        } else {
          await supabaseAdmin.from("customers").insert(customerPayload);
        }
      } catch (crmError) {
        console.error("public-submit-instaquote CRM sync failed:", crmError);
      }

      return jsonResponse(req, {
        success: true,
        bookingId: inserted.id,
        total: estimatedTotal,
      });
    }

    const slug = cleanText(body?.slug, 120);
    const customer = (body?.customer || {}) as CustomerInput;
    const property = (body?.property || {}) as PropertyInput;
    const items = Array.isArray(body?.items) ? (body.items as QuoteItemInput[]) : [];

    const firstName = cleanText(customer.firstName, 80);
    const lastName = cleanText(customer.lastName, 80);
    const email = cleanText(customer.email, 255).toLowerCase();
    const phone = cleanText(customer.phone, 40);
    const address = cleanText(customer.address, 300);

    if (!slug) return jsonResponse(req, { error: "Missing booking link" }, 400);
    if (!firstName || !lastName || !email || !address) {
      return jsonResponse(req, { error: "Missing required contact details" }, 400);
    }
    if (!isEmail(email)) return jsonResponse(req, { error: "Invalid email address" }, 400);
    if (items.length === 0 || items.length > 20) {
      return jsonResponse(req, { error: "Please select at least one service" }, 400);
    }

    const serviceIds = [...new Set(items.map((item) => cleanText(item.serviceId, 80)).filter(Boolean))];
    if (serviceIds.length === 0) return jsonResponse(req, { error: "Invalid service selection" }, 400);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("id, name, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (businessError) throw businessError;
    if (!business?.id || !business.slug) return jsonResponse(req, { error: "Business not found" }, 404);

    const { data: services, error: servicesError } = await supabaseAdmin
      .from("services")
      .select("id, name, default_price")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .in("id", serviceIds);

    if (servicesError) throw servicesError;
    if (!services || services.length !== serviceIds.length) {
      return jsonResponse(req, { error: "One or more selected services are unavailable" }, 400);
    }

    const servicesById = new Map(services.map((service) => [service.id, service]));
    const quoteItems = items.map((item, index) => {
      const serviceId = cleanText(item.serviceId, 80);
      const service = servicesById.get(serviceId);
      if (!service) throw new Error("Invalid service selection");
      const quantity = Math.min(Math.max(Number(item.quantity) || 1, 1), 20);
      const unitPrice = Number(service.default_price || 0);
      return {
        service_id: service.id,
        description: service.name,
        quantity,
        unit_price: unitPrice,
        total: unitPrice * quantity,
        sort_order: index,
      };
    });

    const subtotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
    const quoteNumber = `IQ-${Date.now().toString().slice(-6)}`;
    const notes = cleanText(
      property.notes ||
        `InstaQuote: ${cleanText(property.bedrooms, 10) || "N/A"} bed / ${cleanText(property.bathrooms, 10) || "N/A"} bath, ${cleanText(property.sqft, 20) || "N/A"} sqft`,
      1000,
    );

    // Dedupe by (business_id, email) so widget-submitted quotes attach to
    // the existing CRM customer instead of creating duplicates.
    let customerId: string;
    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("business_id", business.id)
      .eq("email", email)
      .maybeSingle();

    if (existingCustomer?.id) {
      customerId = existingCustomer.id;
      await supabaseAdmin
        .from("customers")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          address,
        })
        .eq("id", customerId);
    } else {
      const { data: createdCustomer, error: customerError } = await supabaseAdmin
        .from("customers")
        .insert({
          business_id: business.id,
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
          address,
        })
        .select("id")
        .single();
      if (customerError) throw customerError;
      customerId = createdCustomer.id;
    }

    const { data: createdQuote, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .insert({
        business_id: business.id,
        customer_id: customerId,
        quote_number: quoteNumber,
        status: "sent",
        subtotal,
        tax_rate: 0,
        tax_amount: 0,
        total: subtotal,
        notes,
      })
      .select("id, quote_number")
      .single();

    if (quoteError) throw quoteError;

    const { error: itemsError } = await supabaseAdmin
      .from("quote_items")
      .insert(quoteItems.map((item) => ({ ...item, quote_id: createdQuote.id })));

    if (itemsError) throw itemsError;

    return jsonResponse(req, {
      success: true,
      quoteId: createdQuote.id,
      quoteNumber: createdQuote.quote_number,
      total: subtotal,
    });
  } catch (error) {
    console.error("public-submit-instaquote error:", error);
    const message = error instanceof Error ? error.message : "Unable to submit quote";
    return jsonResponse(req, { error: message }, 500);
  }
});