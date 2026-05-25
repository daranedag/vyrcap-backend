import { getInsforgePublicClient } from "../../lib/insforge.js";
import { ApiError } from "../../utils/http.js";

type TestimonialRow = {
  id: string;
  slug: string;
  quote: string;
  author_name: string | null;
  author_role: string | null;
  photo_url: string | null;
  status: string;
  display_order: number | null;
  metadata: unknown;
};

function mapTestimonialForFrontend(testimonial: TestimonialRow) {
  return {
    id: testimonial.id,
    slug: testimonial.slug,
    quote: testimonial.quote,
    name: testimonial.author_name,
    role: testimonial.author_role,
    photoUrl: testimonial.photo_url,
    status: testimonial.status,
    displayOrder: testimonial.display_order,
    metadata: testimonial.metadata
  };
}

export async function getPublishedTestimonials() {
  const client = getInsforgePublicClient();
  const { data, error } = await client.from("testimonials").select("*").eq("status", "published").order("display_order", { ascending: true });

  if (error) {
    throw new ApiError(500, "Could not load testimonials", "testimonials_error", error);
  }

  return (data ?? []).map(mapTestimonialForFrontend);
}
