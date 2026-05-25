import * as InsforgeSDK from "@insforge/sdk";
import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";

export type InsforgeClient = any;

let publicClient: InsforgeClient | null = null;
let serviceClient: InsforgeClient | null = null;

function resolveCreateClient() {
  const sdk = InsforgeSDK as any;
  return sdk.createClient ?? sdk.createInsforgeClient ?? sdk.default?.createClient;
}

function buildClient(apiKey: string): InsforgeClient {
  const createClient = resolveCreateClient();

  if (typeof createClient !== "function") {
    throw new ApiError(500, "Could not initialize Insforge SDK client");
  }

  return createClient(env.INSFORGE_URL, apiKey);
}

export function getInsforgePublicClient(): InsforgeClient {
  if (!publicClient) {
    publicClient = buildClient(env.INSFORGE_ANON_KEY);
  }

  return publicClient;
}

export function getInsforgeServiceClient(): InsforgeClient {
  if (!serviceClient) {
    serviceClient = buildClient(env.INSFORGE_SERVICE_KEY);
  }

  return serviceClient;
}
