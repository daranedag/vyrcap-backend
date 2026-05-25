import { getInsforgeServiceClient } from "../../lib/insforge.js";
import { ApiError } from "../../utils/http.js";
import type { ContactInput } from "./contact.schema.js";

export async function createContactMessage(input: ContactInput) {
  const client = getInsforgeServiceClient();
  const payload = {
    full_name: input.name,
    email: input.email,
    phone: input.phone || null,
    message: input.message,
    source: "public_site",
    status: "new"
  };

  const { error } = await client.from("contact_messages").insert(payload);
  if (error) {
    throw new ApiError(500, "Could not create contact message", "contact_insert_error", error);
  }
}
