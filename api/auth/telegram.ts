import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const config = {
  // Use Node.js runtime to support standard crypto module
  runtime: "nodejs",
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { hash, ...data } = body;

    if (!hash) {
      return new Response(JSON.stringify({ error: "Missing hash" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Verify Telegram Hash
    const checkString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${(data as Record<string, any>)[key]}`)
      .join("\n");

    const secretKey = crypto.createHash("sha256").update(botToken).digest();
    const hmac = crypto
      .createHmac("sha256", secretKey)
      .update(checkString)
      .digest("hex");

    if (hmac !== hash) {
      return new Response(JSON.stringify({ error: "Invalid hash" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Hash is valid!
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const telegramId = (data as any).id.toString();
    const email = `${telegramId}@telegram.org`;
    const password = crypto
      .createHash("sha256")
      .update(telegramId + botToken)
      .digest("hex");

    // Try to create user
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        telegram_id: telegramId,
        full_name: `${(data as any).first_name}${
          (data as any).last_name ? " " + (data as any).last_name : ""
        }`,
        avatar_url: (data as any).photo_url,
        username: (data as any).username,
      },
    });

    // If user already exists, we ignore the error and proceed to sign in
    if (createError && !createError.message.includes("already registered")) {
      // Log unexpected errors but try to sign in anyway
      console.error("Create user error:", createError.message);
    }

    // Now sign in the user to get a session
    const { data: sessionData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      return new Response(JSON.stringify({ error: signInError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ session: sessionData.session }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
