import { getInsforgeServiceClient } from "../../lib/insforge.js";
import { ApiError } from "../../utils/http.js";

type ProfileUpdateInput = {
  fullName?: string | undefined;
  rut?: string | undefined;
  phone?: string | undefined;
  metadata?: unknown;
};

export async function getOwnProfile(userId: string) {
  const client = getInsforgeServiceClient();
  const { data, error } = await client.from("profiles").select("*").eq("user_id", userId).single();

  if (error || !data) {
    throw new ApiError(404, "Profile not found", "profile_not_found");
  }

  return data;
}

export async function updateOwnProfile(userId: string, payload: ProfileUpdateInput) {
  const client = getInsforgeServiceClient();

  const updates = {
    full_name: payload.fullName,
    rut: payload.rut,
    phone: payload.phone,
    metadata: payload.metadata
  };

  const { data, error } = await client.from("profiles").update(updates).eq("user_id", userId).select("*").single();

  if (error || !data) {
    throw new ApiError(500, "Could not update profile", "profile_update_error", error);
  }

  return data;
}
