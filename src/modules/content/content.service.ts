import { getInsforgePublicClient } from "../../lib/insforge.js";
import { ApiError } from "../../utils/http.js";

function parseSiteValue(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function getPublicSiteContent() {
  const client = getInsforgePublicClient();
  const { data, error } = await client.from("site_settings").select("value").eq("key", "public_site").single();

  if (error) {
    throw new ApiError(500, "Could not load site settings", "site_settings_error", error);
  }

  return parseSiteValue(data?.value ?? null);
}

export async function getPublishedBlocks() {
  const client = getInsforgePublicClient();
  const { data, error } = await client
    .from("site_blocks")
    .select("*")
    .eq("status", "published")
    .order("display_order", { ascending: true });

  if (error) {
    throw new ApiError(500, "Could not load content blocks", "site_blocks_error", error);
  }

  return data ?? [];
}
