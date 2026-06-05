/**
 * Seed Script: Create test tenant + test accounts for automated testing.
 *
 * Creates:
 *   - Tenant:    slug="test-corp"  (id fixed at 00000000-0000-0000-0000-000000000099)
 *   - Manager:   manager@test-corp.local / Test@12345
 *   - Employee:  employee@test-corp.local / Test@12345
 *   - Department: "Engineering" inside test-corp
 *   - Position:  "Software Engineer" assigned to the employee
 *   - Project:   "Test Project Alpha" (for API + performance tests)
 *   - Conversation: "General Chat" (for WebSocket tests)
 *
 * Usage:
 *   node tests/setup/seed-test-data.js
 *
 * Requirements:
 *   npm install @supabase/supabase-js   (already in package.json root)
 */

const SUPABASE_URL    = "https://jtoibkbaomzqmseveplp.supabase.co";
const SERVICE_ROLE_KEY = "sb_secret_A2CzoDxkrulVLVBMuzsFZg_vrzpbJRd";

const TEST_TENANT_ID   = "00000000-0000-0000-0000-000000000099";
const TEST_TENANT_SLUG = "test-corp";

const MANAGER_EMAIL    = "manager@test-corp.local";
const EMPLOYEE_EMAIL   = "employee@test-corp.local";
const TEST_PASSWORD    = "Test@12345";

// Fixed UUIDs so cleanup is deterministic
const MANAGER_ID       = "00000000-0000-0000-0000-000000000101";
const EMPLOYEE_ID      = "00000000-0000-0000-0000-000000000102";
const DEPT_ID          = "00000000-0000-0000-0000-000000000201";
const POSITION_ID      = "00000000-0000-0000-0000-000000000301";
const PROJECT_ID       = "00000000-0000-0000-0000-000000000401";
const CONVERSATION_ID  = "00000000-0000-0000-0000-000000000501";

async function main() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("\n🧪 ONFIS — Seed Test Data");
  console.log("═".repeat(50));

  // ── 1. Tenant ─────────────────────────────────────────────────────────────
  console.log("\n[1/8] Ensuring test tenant exists...");
  const { error: tenantErr } = await supabase.from("tenants").upsert({
    id: TEST_TENANT_ID,
    name: "Test Corp",
    slug: TEST_TENANT_SLUG,
    status: "ACTIVE",
    setup_completed: true,
  }, { onConflict: "id" });
  if (tenantErr) { console.error("❌ Tenant:", tenantErr.message); process.exit(1); }
  console.log("   ✅ Tenant test-corp ready");

  // ── 2. Auth user — Manager ────────────────────────────────────────────────
  console.log("\n[2/8] Creating auth user: Manager...");
  await upsertAuthUser(supabase, MANAGER_ID, MANAGER_EMAIL, TEST_PASSWORD, "MANAGER");

  // ── 3. Auth user — Employee ───────────────────────────────────────────────
  console.log("\n[3/8] Creating auth user: Employee...");
  await upsertAuthUser(supabase, EMPLOYEE_ID, EMPLOYEE_EMAIL, TEST_PASSWORD, "EMPLOYEE");

  // ── 4. user_profiles ─────────────────────────────────────────────────────
  console.log("\n[4/8] Inserting user_profiles...");
  await supabase.from("user_profiles").upsert([
    { user_id: MANAGER_ID,  tenant_id: TEST_TENANT_ID },
    { user_id: EMPLOYEE_ID, tenant_id: TEST_TENANT_ID },
  ], { onConflict: "user_id" });
  console.log("   ✅ user_profiles ready");

  // ── 5. Department ─────────────────────────────────────────────────────────
  console.log("\n[5/8] Inserting department...");
  const { error: deptErr } = await supabase.from("departments").upsert({
    id: DEPT_ID,
    tenant_id: TEST_TENANT_ID,
    name: "Engineering",
    description: "Test department",
  }, { onConflict: "id" });
  if (deptErr) console.warn("   ⚠️  Department:", deptErr.message);
  else console.log("   ✅ Department ready");

  // ── 6. Position (assigned to employee) ───────────────────────────────────
  console.log("\n[6/8] Inserting position...");
  const { error: posErr } = await supabase.from("positions").upsert({
    id: POSITION_ID,
    tenant_id: TEST_TENANT_ID,
    title: "Software Engineer",
    department_id: DEPT_ID,
    parent_id: null,
  }, { onConflict: "id" });
  if (posErr) console.warn("   ⚠️  Position:", posErr.message);
  else console.log("   ✅ Position ready");

  // Assign position to employee
  const { error: posAssignErr } = await supabase.from("users")
    .update({ position_id: POSITION_ID, first_name: "Test", last_name: "Employee" })
    .eq("id", EMPLOYEE_ID);
  if (posAssignErr) console.warn("   ⚠️  Assign position:", posAssignErr.message);

  // Set manager name
  await supabase.from("users")
    .update({ first_name: "Test", last_name: "Manager" })
    .eq("id", MANAGER_ID);

  // ── 7. Project ────────────────────────────────────────────────────────────
  console.log("\n[7/8] Inserting test project...");
  const { error: projErr } = await supabase.from("projects").upsert({
    id: PROJECT_ID,
    tenant_id: TEST_TENANT_ID,
    name: "Test Project Alpha",
    slug: "test-project-alpha",
    description: "Automated test project — do not modify manually",
    status: "IN_PROGRESS",
    priority: "HIGH",
    progress: 0,
    manager_id: MANAGER_ID,
    created_by: MANAGER_ID,
  }, { onConflict: "id" });
  if (projErr) console.warn("   ⚠️  Project:", projErr.message);
  else console.log("   ✅ Project ready");

  // Add both users as project members
  await supabase.from("project_members").upsert([
    { project_id: PROJECT_ID, user_id: MANAGER_ID,  role: "LEAD" },
    { project_id: PROJECT_ID, user_id: EMPLOYEE_ID, role: "DEVELOPER" },
  ], { onConflict: "project_id,user_id" });

  // ── 8. Conversation (for WebSocket test) ─────────────────────────────────
  console.log("\n[8/8] Inserting test conversation...");
  const { error: convErr } = await supabase.from("conversations").upsert({
    id: CONVERSATION_ID,
    tenant_id: TEST_TENANT_ID,
    name: "Test General Chat",
    type: "public_group",
  }, { onConflict: "id" });
  if (convErr) console.warn("   ⚠️  Conversation:", convErr.message);
  else console.log("   ✅ Conversation ready");

  await supabase.from("conversation_members").upsert([
    { conversation_id: CONVERSATION_ID, user_id: MANAGER_ID,  role: "ADMIN" },
    { conversation_id: CONVERSATION_ID, user_id: EMPLOYEE_ID, role: "MEMBER" },
  ], { onConflict: "conversation_id,user_id" });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(50));
  console.log("✅ Seed complete! Save these values for test scripts:\n");
  console.log(`  TENANT_ID:       ${TEST_TENANT_ID}`);
  console.log(`  TENANT_SLUG:     ${TEST_TENANT_SLUG}`);
  console.log(`  MANAGER_ID:      ${MANAGER_ID}  (${MANAGER_EMAIL})`);
  console.log(`  EMPLOYEE_ID:     ${EMPLOYEE_ID}  (${EMPLOYEE_EMAIL})`);
  console.log(`  PASSWORD:        ${TEST_PASSWORD}`);
  console.log(`  PROJECT_ID:      ${PROJECT_ID}`);
  console.log(`  CONVERSATION_ID: ${CONVERSATION_ID}`);
  console.log(`  DEPT_ID:         ${DEPT_ID}`);
  console.log(`  POSITION_ID:     ${POSITION_ID}`);
  console.log("\n📌 Run cleanup when done:  node tests/setup/cleanup-test-data.js\n");
}

/**
 * Creates or updates a Supabase auth user and the corresponding public.users row.
 * Always uses the fixed UUID (userId) so cleanup is deterministic.
 *
 * Strategy:
 *  1. If a user with the correct UUID already exists → refresh password + email_confirm.
 *  2. If a user exists with this email but a different UUID → delete it first.
 *  3. Create auth user with the fixed UUID via the admin API `id` override.
 */
async function upsertAuthUser(supabase, userId, email, password, role) {
  // 1. Check by fixed UUID first
  const { data: byId } = await supabase.auth.admin.getUserById(userId);

  if (byId?.user) {
    console.log(`   [i]  Auth user ${email} already has correct UUID — refreshing password.`);
    await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true });
    console.log(`   [OK] Auth user updated: ${email}`);
  } else {
    // 2. Find any stale user with this email (wrong UUID from a previous seed run)
    const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const stale = list?.users?.find((u) => u.email === email);
    if (stale) {
      console.log(`   [i]  Found stale auth user ${email} (id=${stale.id}). Deleting…`);
      const { error: delErr } = await supabase.auth.admin.deleteUser(stale.id);
      if (delErr) console.warn(`   [WARN] Delete stale: ${delErr.message}`);
    }

    // 3. Create with our fixed UUID
    const { error } = await supabase.auth.admin.createUser({
      id: userId,           // <-- deterministic UUID
      email,
      password,
      email_confirm: true,
      user_metadata: { tenant_id: TEST_TENANT_ID, role },
    });

    if (error) {
      console.error(`   [ERR] Auth create failed for ${email}: ${error.message}`);
      process.exit(1);
    }
    console.log(`   [OK] Auth user created: ${email} (${userId})`);
  }

  // Ensure public.users row exists with correct values (trigger fires on INSERT,
  // but upsert here guards against trigger not running or partial failures).
  const { error: userErr } = await supabase.from("users").upsert({
    id: userId,
    tenant_id: TEST_TENANT_ID,
    username: email.split("@")[0],
    email,
    role,
    is_active: true,
  }, { onConflict: "id" });
  if (userErr) console.warn(`   [WARN] public.users upsert: ${userErr.message}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
