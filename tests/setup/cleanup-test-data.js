/**
 * Cleanup Script: Remove ALL data created by seed-test-data.js.
 *
 * Deletes rows scoped to tenant_id = 00000000-0000-0000-0000-000000000099
 * and removes the two test auth users from Supabase Auth.
 *
 * Usage:
 *   node tests/setup/cleanup-test-data.js
 *
 * Safe to re-run. Does NOT touch any other tenant's data.
 */

const SUPABASE_URL     = "https://jtoibkbaomzqmseveplp.supabase.co";
const SERVICE_ROLE_KEY = "sb_secret_A2CzoDxkrulVLVBMuzsFZg_vrzpbJRd";

const TEST_TENANT_ID   = "00000000-0000-0000-0000-000000000099";
const MANAGER_ID       = "00000000-0000-0000-0000-000000000101";
const EMPLOYEE_ID      = "00000000-0000-0000-0000-000000000102";
const PROJECT_ID       = "00000000-0000-0000-0000-000000000401";
const CONVERSATION_ID  = "00000000-0000-0000-0000-000000000501";

// Tables WITH tenant_id — deleted in FK dependency order
const TENANT_SCOPED_TABLES = [
  "announcement_comment_likes",
  "announcement_likes",
  "announcement_comments",
  "attachments",
  "task_activities",
  "task_comments",
  "task_reviews",
  "task_subtasks",
  // task_assignees / task_dependencies handled separately (no tenant_id)
  "tasks",
  "workflow_stages",
  "project_milestones",
  "project_favorites",
  // project_members handled separately (no tenant_id)
  "projects",
  // messages / conversation_members handled separately (no tenant_id)
  "conversations",
  "announcements",
  "meetings",
  "user_profiles",
  "users",
  "positions",
  "departments",
  "tenants",
];

async function main() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("\n🧹 ONFIS — Cleanup Test Data");
  console.log("═".repeat(50));
  console.log(`   Tenant ID: ${TEST_TENANT_ID}\n`);

  // ── 1a. Junction tables without tenant_id — delete via FK ────────────────
  // project_members
  await deleteByCol(supabase, "project_members",       "project_id",      PROJECT_ID);
  // conversation_members and messages
  await deleteByCol(supabase, "conversation_members",  "conversation_id", CONVERSATION_ID);
  await deleteByCol(supabase, "messages",              "conversation_id", CONVERSATION_ID);

  // task_assignees and task_dependencies — need to resolve task IDs first
  const { data: taskRows } = await supabase
    .from("tasks")
    .select("id")
    .eq("tenant_id", TEST_TENANT_ID);
  const taskIds = (taskRows ?? []).map((t) => t.id);
  if (taskIds.length > 0) {
    await deleteByIds(supabase, "task_assignees",   "task_id", taskIds);
    await deleteByIds(supabase, "task_dependencies","task_id", taskIds);
  } else {
    console.log("   [--] task_assignees: no tasks found (skip)");
    console.log("   [--] task_dependencies: no tasks found (skip)");
  }

  // ── 1b. Tenant-scoped rows ────────────────────────────────────────────────
  for (const table of TENANT_SCOPED_TABLES) {
    const filterCol = table === "tenants" ? "id" : "tenant_id";
    const { error, count } = await supabase
      .from(table)
      .delete({ count: "exact" })
      .eq(filterCol, TEST_TENANT_ID);

    if (error) {
      console.warn(`   [WARN] ${table}: ${error.message}`);
    } else {
      console.log(`   [OK]  ${table}: ${count ?? 0} row(s) deleted`);
    }
  }

  // ── 2. Delete Supabase Auth users ─────────────────────────────────────────
  console.log("\n[Auth] Removing auth users...");
  for (const uid of [MANAGER_ID, EMPLOYEE_ID]) {
    const { error } = await supabase.auth.admin.deleteUser(uid);
    if (error) console.warn(`   [WARN] Auth delete ${uid}: ${error.message}`);
    else console.log(`   [OK]  Auth user ${uid} deleted`);
  }

  console.log("\n[DONE] Cleanup complete. Database is clean for next test run.\n");
}

async function deleteByCol(supabase, table, col, value) {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .eq(col, value);
  if (error) console.warn(`   [WARN] ${table}: ${error.message}`);
  else console.log(`   [OK]  ${table}: ${count ?? 0} row(s) deleted`);
}

async function deleteByIds(supabase, table, col, ids) {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .in(col, ids);
  if (error) console.warn(`   [WARN] ${table}: ${error.message}`);
  else console.log(`   [OK]  ${table}: ${count ?? 0} row(s) deleted`);
}

main().catch((e) => { console.error(e); process.exit(1); });
