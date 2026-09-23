import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type SchoolContext = {
  userId: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  role: string;
  membershipId: string;
};

/**
 * Returns the primary (or first) school context for the current user.
 * Redirects to /school/setup if the user has no school membership.
 */
export async function getSchoolContext(): Promise<SchoolContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("school_memberships")
    .select(
      `
      id,
      role,
      is_primary,
      school:schools (
        id,
        name,
        code
      )
    `
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership || !membership.school) {
    redirect("/school/setup");
  }

  // school can be object or array depending on relation; normalize
  const school = Array.isArray(membership.school)
    ? membership.school[0]
    : membership.school;

  if (!school) {
    redirect("/school/setup");
  }

  return {
    userId: user.id,
    schoolId: school.id,
    schoolName: school.name,
    schoolCode: school.code,
    role: membership.role,
    membershipId: membership.id,
  };
}
