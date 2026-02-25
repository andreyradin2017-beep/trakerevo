import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = req.query.code as string;
  const error = req.query.error as string;

  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  const host = req.headers.host;
  const protocol = host?.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  try {
    const clientId = process.env.YANDEX_CLIENT_ID || "a435e9a8c56b467498ea2964a9c00d5a";
    const clientSecret = process.env.YANDEX_CLIENT_SECRET || "787769ff679d48ecaebc5744898f782f";
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("Yandex OAuth: Starting. supabaseUrl exists:", !!supabaseUrl, "serviceKey exists:", !!supabaseServiceKey);

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration on server");
    }

    // 1. Exchange code for access token
    const tokenResponse = await axios.post(
      "https://oauth.yandex.ru/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const yandexAccessToken = tokenResponse.data.access_token;
    console.log("Yandex OAuth: Got access token");

    // 2. Fetch user info from Yandex
    const userResponse = await axios.get("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${yandexAccessToken}` },
    });

    const userData = userResponse.data;
    const yandexId = String(userData.id);
    const email = userData.default_email || `${yandexId}@yandex.ru`;
    const fullName = userData.real_name || userData.display_name || "";
    const avatarUrl = userData.default_avatar_id
      ? `https://avatars.yandex.net/get-yapic/${userData.default_avatar_id}/islands-200`
      : null;

    console.log("Yandex OAuth: Got user info, email:", email);

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 3. Upsert user (create or update metadata)
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { yandex_id: yandexId, full_name: fullName, avatar_url: avatarUrl },
    });

    if (createError && !createError.message.includes("already registered")) {
      console.error("Yandex OAuth: createUser error (non-fatal):", createError.message);
    }

    // 4. Generate a magic link OTP (no password needed!)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${origin}/auth/callback` },
    });

    if (linkError) {
      throw new Error(`generateLink failed: ${linkError.message}`);
    }

    // 5. Extract the OTP token from the link and send it to our callback page
    // This way the frontend handles the session verification natively
    const actionLink = linkData.properties.action_link;
    const linkUrl = new URL(actionLink);
    const otpToken = linkUrl.searchParams.get("token");

    if (!otpToken) {
      throw new Error("Could not extract token from magic link");
    }

    console.log("Yandex OAuth: Generated OTP token, redirecting to callback");

    // Redirect to our page with OTP token + email for verifyOtp
    const params = new URLSearchParams({
      token: otpToken,
      email,
      type: "magiclink",
    });

    return res.redirect(`${origin}/auth/callback?${params.toString()}`);
  } catch (err: any) {
    console.error("Yandex Auth Error:", err.message);
    return res.redirect(`${origin}/auth/callback?error=${encodeURIComponent(err.message)}`);
  }
}
