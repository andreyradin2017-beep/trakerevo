import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
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

  try {
    const clientId = process.env.YANDEX_CLIENT_ID || "a435e9a8c56b467498ea2964a9c00d5a";
    const clientSecret = process.env.YANDEX_CLIENT_SECRET || "787769ff679d48ecaebc5744898f782f";
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
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
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. Fetch user information
    const userResponse = await axios.get("https://login.yandex.ru/info?format=json", {
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    });

    const userData = userResponse.data;
    const yandexId = userData.id;
    const email = userData.default_email || `${yandexId}@yandex.ru`;
    
    // Create a stable password from Yandex ID and client secret
    const password = crypto
      .createHash("sha256")
      .update(yandexId + clientSecret)
      .digest("hex");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 3. Sync user with Supabase
    // Try to create user if they don't exist
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        yandex_id: yandexId,
        full_name: userData.real_name || userData.display_name,
        avatar_url: userData.default_avatar_id 
          ? `https://avatars.yandex.net/get-yapic/${userData.default_avatar_id}/islands-200` 
          : null,
      },
    });

    // Ignore "already registered" error
    if (createError && !createError.message.includes("already registered")) {
      console.error("Supabase createUser error:", createError.message);
    }

    // 4. Generate a magic link for the user to sign in automatically
    // This is the most reliable way as Supabase handles the session persistence natively
    const host = req.headers.host;
    const protocol = host?.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: origin,
      }
    });

    if (linkError) {
      console.error("Supabase generateLink error:", linkError.message);
      throw linkError;
    }

    // 5. Redirect the user to the generated link
    // Supabase will handle the login and then redirect them back to our origin
    return res.redirect(linkData.properties.action_link);
  } catch (err: any) {
    console.error("Yandex Auth Error:", err.message);
    return res.redirect(`/?error=auth_failed&message=${encodeURIComponent(err.message)}`);
  }
}
