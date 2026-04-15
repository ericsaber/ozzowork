import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const subjects: Record<string, string> = {
  signup: "Confirm your email",
  magiclink: "Your login link",
  recovery: "Reset your password",
  email_change: "Confirm your email change",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json();
    console.log("Received auth hook payload:", JSON.stringify(payload, null, 2));

    const { user, email_data } = payload;

    if (!user?.email || !email_data) {
      console.error("Invalid payload: missing user.email or email_data");
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { token_hash, redirect_to, email_action_type, site_url } = email_data;

    const subject = subjects[email_action_type] || "Notification";
    const confirmation_url = `${site_url}/auth/v1/verify?token_hash=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || site_url)}`;

    console.log("Sending email:", { to: user.email, type: email_action_type, subject });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ozzo <noreply@mail.ozzo.work>",
        to: [user.email],
        subject,
        html: `
          <div style="font-family: 'Outfit', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
            <h2 style="font-family: 'Crimson Pro', Georgia, serif; font-size: 24px; margin-bottom: 16px;">${subject}</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #444;">
              Click the link below to continue:
            </p>
            <p style="margin: 24px 0;">
              <a href="${confirmation_url}" style="display: inline-block; background: #c8622a; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 15px;">
                ${email_action_type === "recovery" ? "Reset Password" : email_action_type === "magiclink" ? "Log In" : "Confirm Email"}
              </a>
            </p>
            <p style="font-size: 13px; color: #999; margin-top: 32px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    });

    const result = await res.json();
    console.log("Resend response:", JSON.stringify(result));

    if (!res.ok) {
      console.error("Resend API error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Auth email hook error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
