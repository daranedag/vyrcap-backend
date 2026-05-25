import { getInsforgePublicClient, getInsforgeServiceClient } from "../../lib/insforge.js";
import { ApiError } from "../../utils/http.js";
import type { LoginInput, SignupInput } from "./auth.schema.js";

type AuthUser = {
  id: string;
  email?: string | null;
};

function extractUser(payload: any): AuthUser | null {
  const user = payload?.data?.user ?? payload?.user ?? null;
  if (!user?.id) {
    return null;
  }

  return {
    id: String(user.id),
    email: user.email ?? null
  };
}

export async function signup(input: SignupInput) {
  const client = getInsforgePublicClient();
  const auth = client.auth as any;

  const signupFn = auth?.signUp ?? auth?.signup ?? auth?.register;
  if (typeof signupFn !== "function") {
    throw new ApiError(500, "Insforge auth signUp method is not available");
  }

  const result = await signupFn({
    email: input.email,
    password: input.password
  });

  if (result?.error) {
    throw new ApiError(400, result.error.message ?? "Could not create account", "auth_signup_error", result.error);
  }

  const user = extractUser(result);
  if (!user) {
    throw new ApiError(500, "Sign up did not return a user", "auth_signup_no_user");
  }

  const serviceClient = getInsforgeServiceClient();
  const { error: profileError } = await serviceClient.from("profiles").upsert(
    {
      user_id: user.id,
      full_name: input.fullName ?? null,
      phone: input.phone ?? null,
      role: "student"
    },
    { onConflict: "user_id" }
  );

  if (profileError) {
    throw new ApiError(500, "Account created but profile could not be saved", "profile_upsert_error", profileError);
  }

  return result?.data ?? result;
}

export async function login(input: LoginInput) {
  const client = getInsforgePublicClient();
  const auth = client.auth as any;

  const loginFn = auth?.signInWithPassword ?? auth?.signIn ?? auth?.login;
  if (typeof loginFn !== "function") {
    throw new ApiError(500, "Insforge auth login method is not available");
  }

  const result = await loginFn({
    email: input.email,
    password: input.password
  });

  if (result?.error) {
    throw new ApiError(401, result.error.message ?? "Invalid credentials", "auth_login_error");
  }

  return result?.data ?? result;
}

export async function logout(token?: string) {
  const client = getInsforgePublicClient();
  const auth = client.auth as any;
  const logoutFn = auth?.signOut ?? auth?.logout;

  if (typeof logoutFn === "function") {
    await logoutFn(token ? { token } : undefined);
  }

  return { ok: true };
}

export async function resolveUserFromToken(token: string): Promise<AuthUser | null> {
  const serviceClient = getInsforgeServiceClient();
  const auth = serviceClient.auth as any;

  const candidates: Array<() => Promise<any>> = [];

  if (typeof auth?.getUser === "function") {
    candidates.push(() => auth.getUser(token));
  }

  if (typeof auth?.getUserByToken === "function") {
    candidates.push(() => auth.getUserByToken(token));
  }

  if (typeof auth?.api?.getUser === "function") {
    candidates.push(() => auth.api.getUser(token));
  }

  for (const candidate of candidates) {
    try {
      const result = await candidate();
      if (result?.error) {
        continue;
      }

      const user = extractUser(result);
      if (user) {
        return user;
      }
    } catch {
      continue;
    }
  }

  return null;
}
