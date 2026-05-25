import { env } from "../config/env.js";

type MoodleProfileInput = {
  email?: string;
  fullName?: string | null;
  phone?: string | null;
};

type MoodleEnrollmentInput = {
  userId: string;
  courseId: string;
};

function isMoodleEnabled() {
  return Boolean(env.MOODLE_BASE_URL && env.MOODLE_TOKEN && env.MOODLE_SERVICE);
}

export async function createOrFindMoodleUser(_profile: MoodleProfileInput) {
  if (!isMoodleEnabled()) {
    return null;
  }

  return null;
}

export async function enrollUserInCourse(_input: MoodleEnrollmentInput) {
  if (!isMoodleEnabled()) {
    return null;
  }

  return null;
}
