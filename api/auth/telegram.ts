import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { hash, ...data } = req.body;

    if (!hash) {
      return res.status(400).json({ error: "Missing hash" });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: "Server configuration error" });
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
      return res.status(401).json({ error: "Invalid hash" });
    }

    // Hash is valid!
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Supabase configuration error" });
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
      console.error("Create user error:", createError.message);
    }

    // Now sign in the user to get a session
    const { data: sessionData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      return res.status(500).json({ error: signInError.message });
    }

    return res.status(200).json({ session: sessionData.session });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
