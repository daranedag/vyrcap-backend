import { mapCourseForFrontend } from "../courses/courses.service.js";
import { getInsforgeServiceClient } from "../../lib/insforge.js";
import { ApiError } from "../../utils/http.js";

type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  enrolled_at: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function getOwnEnrollments(userId: string) {
  const client = getInsforgeServiceClient();
  const { data, error } = await client
    .from("enrollments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ApiError(500, "Could not load enrollments", "enrollments_error", error);
  }

  const enrollments = (data ?? []) as EnrollmentRow[];
  const courseIds = [...new Set(enrollments.map((item) => item.course_id))];

  let coursesById = new Map<string, unknown>();
  if (courseIds.length > 0) {
    const { data: coursesData, error: coursesError } = await client.from("courses").select("*").in("id", courseIds);
    if (coursesError) {
      throw new ApiError(500, "Could not load enrollment courses", "enrollment_courses_error", coursesError);
    }

    coursesById = new Map((coursesData ?? []).map((course: any) => [course.id, mapCourseForFrontend(course)]));
  }

  return enrollments.map((item) => ({
    id: item.id,
    status: item.status,
    enrolledAt: item.enrolled_at,
    courseId: item.course_id,
    course: coursesById.get(item.course_id) ?? null,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
}
