import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: Missing environment variables");
  console.error(
    "Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser(
  email,
  password,
  username,
  fullName,
  role = "staff",
) {
  console.log(`\n🔄 Creating admin user: ${email} with role: ${role}\n`);

  if (!["staff", "manager"].includes(role)) {
    console.error('❌ Error: Role must be either "staff" or "manager"');
    process.exit(1);
  }

  try {
    console.log("1️⃣  Creating user in auth...");
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: role,
          username: username,
          full_name: fullName,
        },
      });

    if (authError) {
      console.error("❌ Auth error:", authError.message);
      process.exit(1);
    }

    console.log("✅ User created in auth.users");
    console.log(`   User ID: ${authUser.user.id}`);

    console.log("\n2️⃣  Setting profile fields...");
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: authUser.user.id,
        role: role,
        username: username,
        full_name: fullName,
        avatar_url: null,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    );

    if (profileError) {
      console.error("❌ Profile error:", profileError.message);
      console.log("⚠️  User created in auth but profile update failed");
      console.log(
        "   You may need to manually set the role in the profiles table",
      );
      process.exit(1);
    }

    console.log("✅ Profile fields set");

    console.log("\n3️⃣  Verifying profile...");
    const { data: profile, error: verifyError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.user.id)
      .single();

    if (verifyError) {
      console.error("❌ Verification error:", verifyError.message);
    } else {
      console.log("✅ Profile verified");
      console.log(`   Role: ${profile.role}`);
      console.log(`   Username: ${profile.username}`);
      console.log(`   Full name: ${profile.full_name}`);
      console.log(`   Onboarding completed: ${profile.onboarding_completed}`);
    }

    console.log("\n✨ Success! Admin user created:\n");
    console.log(`   Email: ${email}`);
    console.log(`   Username: ${username}`);
    console.log(`   Full name: ${fullName}`);
    console.log(`   Role: ${role}`);
    console.log(`   User ID: ${authUser.user.id}`);
    console.log(
      `\n   The user can now log in at: http://localhost:3000/auth/login\n`,
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
    process.exit(1);
  }
}

const args = process.argv.slice(2);

if (args.length < 4) {
  console.log(
    "\n📝 Usage: node scripts/create-admin.js <email> <password> <username> <full_name> [role]\n",
  );
  console.log("Arguments:");
  console.log("  email       - Email address for the admin user");
  console.log("  password    - Password (min 8 characters)");
  console.log("  username    - Unique username (e.g., john.doe)");
  console.log('  full_name   - Full name (e.g., "John Doe")');
  console.log('  role        - Either "staff" or "manager" (default: staff)\n');
  console.log("Examples:");
  console.log(
    '  node scripts/create-admin.js admin@example.com SecurePass123! john.doe "John Doe"',
  );
  console.log(
    '  node scripts/create-admin.js manager@example.com SecurePass123! jane.smith "Jane Smith" manager\n',
  );
  process.exit(1);
}

const [email, password, username, fullName, role = "staff"] = args;

if (!email.includes("@")) {
  console.error("❌ Error: Invalid email address");
  process.exit(1);
}

if (password.length < 8) {
  console.error("❌ Error: Password must be at least 8 characters");
  process.exit(1);
}

if (username.length < 3) {
  console.error("❌ Error: Username must be at least 3 characters");
  process.exit(1);
}

createAdminUser(email, password, username, fullName, role);
