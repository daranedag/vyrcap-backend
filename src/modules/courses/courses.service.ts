import { getInsforgePublicClient } from "../../lib/insforge.js";
import { ApiError } from "../../utils/http.js";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  objective: string | null;
  contents: unknown;
  audience: string | null;
  modality: string | null;
  price_clp: number | null;
  duration_hours: number | null;
  thumbnail_url: string | null;
  moodle_course_url: string | null;
  status: string;
  display_order: number | null;
  metadata: unknown;
  created_at?: string;
  updated_at?: string;
};

export function mapCourseForFrontend(course: CourseRow) {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    shortDescription: course.short_description,
    description: course.description,
    objective: course.objective,
    contents: course.contents,
    audience: course.audience,
    modality: course.modality,
    priceClp: course.price_clp,
    durationHours: course.duration_hours,
    thumbnailUrl: course.thumbnail_url,
    moodleCourseUrl: course.moodle_course_url,
    status: course.status,
    displayOrder: course.display_order,
    metadata: course.metadata,
    createdAt: course.created_at,
    updatedAt: course.updated_at
  };
}

export async function getPublishedCourses() {
  const client = getInsforgePublicClient();
  const { data, error } = await client.from("courses").select("*").eq("status", "published").order("display_order", { ascending: true });

  if (error) {
    throw new ApiError(500, "Could not load courses", "courses_error", error);
  }

  return (data ?? []).map(mapCourseForFrontend);
}

export async function getPublishedCourseBySlug(slug: string) {
  const client = getInsforgePublicClient();
  const { data, error } = await client.from("courses").select("*").eq("slug", slug).eq("status", "published").single();

  if (error || !data) {
    throw new ApiError(404, "Course not found", "course_not_found");
  }

  return mapCourseForFrontend(data);
}

export async function getPublishedCourseById(courseId: string) {
  const client = getInsforgePublicClient();
  const { data, error } = await client.from("courses").select("*").eq("id", courseId).eq("status", "published").single();

  if (error || !data) {
    throw new ApiError(404, "Course not found", "course_not_found");
  }

  return data as CourseRow;
}
