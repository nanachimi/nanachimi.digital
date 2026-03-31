import { NextResponse } from "next/server";
import {
  addPageView,
  updatePageView,
  addOnboardingEvent,
  addConversionEvent,
} from "@/lib/analytics";
import { getExcludedIps } from "@/lib/excluded-ips";
export const dynamic = "force-dynamic";

function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  // Check common proxy headers (Hetzner / reverse proxy)
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    ""
  );
}

/** Extract geo info from proxy/CDN headers or Accept-Language */
function getGeoInfo(request: Request): { country?: string; city?: string } {
  const headers = new Headers(request.headers);
  // Cloudflare headers (if behind CF)
  const cfCountry = headers.get("cf-ipcountry");
  const cfCity = headers.get("cf-ipcity"); // CF Enterprise only
  if (cfCountry && cfCountry !== "XX") {
    return { country: cfCountry.toUpperCase(), city: cfCity || undefined };
  }
  // Vercel / generic headers
  const xCountry = headers.get("x-vercel-ip-country") || headers.get("x-country-code");
  const xCity = headers.get("x-vercel-ip-city") || headers.get("x-city");
  if (xCountry) {
    return { country: xCountry.toUpperCase(), city: xCity || undefined };
  }
  // Fallback: infer from Accept-Language (rough approximation)
  const lang = headers.get("accept-language")?.split(",")[0]?.trim();
  if (lang) {
    const region = lang.match(/-([A-Z]{2})$/)?.[1];
    if (region) return { country: region };
  }
  return {};
}

export async function POST(request: Request) {
  try {
    // Skip tracking for excluded IPs (admin-managed via DB)
    const excludedIps = await getExcludedIps();
    if (excludedIps.size > 0) {
      const clientIp = getClientIp(request);
      if (clientIp && excludedIps.has(clientIp)) {
        return new NextResponse(null, { status: 204 });
      }
    }

    const clientIp = getClientIp(request);
    const geo = getGeoInfo(request);
    const body = await request.json();
    const { type, ...data } = body;

    switch (type) {
      case "pageview":
        await addPageView({
          id: data.id ?? crypto.randomUUID(),
          visitorId: data.visitorId ?? "",
          ip: clientIp || undefined,
          country: geo.country,
          city: geo.city,
          path: data.path ?? "/",
          referrer: data.referrer ?? "",
          utmSource: data.utmSource,
          utmMedium: data.utmMedium,
          utmCampaign: data.utmCampaign,
          timestamp: new Date().toISOString(),
        });
        break;

      case "pageview_update":
        await updatePageView(data.id, {
          timeOnPage: data.timeOnPage,
          scrollDepth: data.scrollDepth,
        });
        break;

      case "onboarding":
        await addOnboardingEvent({
          id: crypto.randomUUID(),
          visitorId: data.visitorId ?? "",
          ip: clientIp || undefined,
          sessionId: data.sessionId ?? "",
          step: data.step ?? 0,
          stepName: data.stepName ?? "",
          type: data.eventType ?? "step_enter",
          duration: data.duration,
          timestamp: new Date().toISOString(),
        });
        break;

      case "conversion":
        await addConversionEvent({
          id: crypto.randomUUID(),
          visitorId: data.visitorId ?? "",
          ip: clientIp || undefined,
          type: data.conversionType ?? "cta_click",
          ctaId: data.ctaId,
          conversionPath: data.conversionPath,
          page: data.page ?? "/",
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 }); // Never fail client-side tracking
  }
}
