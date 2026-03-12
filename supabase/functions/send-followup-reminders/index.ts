import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
    const cronSecret = Deno.env.get('CRON_SECRET');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const validTokens = [cronSecret, anonKey, serviceKey].filter(Boolean);
    if (!authToken || !validTokens.includes(authToken)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];

    // Query follow_ups with due_date = today, joined with contacts
    const { data: followUps, error: queryError } = await supabase
      .from('follow_ups')
      .select('id, follow_up_type, due_date, user_id, contact_id, interaction_id, contacts(first_name, last_name, company, email)')
      .eq('due_date', today)
      .eq('completed', false);

    if (queryError) throw queryError;

    if (!followUps || followUps.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No follow-ups due today' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch linked interactions for notes
    const interactionIds = followUps.map((f: any) => f.interaction_id).filter(Boolean);
    let interactionMap: Record<string, any> = {};
    if (interactionIds.length > 0) {
      const { data: interactions } = await supabase
        .from('interactions')
        .select('id, note')
        .in('id', interactionIds);
      if (interactions) {
        for (const i of interactions) {
          interactionMap[i.id] = i;
        }
      }
    }

    // Get user emails
    const userIds = [...new Set(followUps.map((f: any) => f.user_id))];
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const userEmailMap: Record<string, string> = {};
    for (const u of users.users) {
      if (userIds.includes(u.id) && u.email) {
        userEmailMap[u.id] = u.email;
      }
    }

    const appUrl = 'https://app.ozzo.work';
    let sent = 0;

    for (const fu of followUps as any[]) {
      const userEmail = userEmailMap[fu.user_id];
      if (!userEmail) continue;

      const contact = fu.contacts;
      const contactName = contact ? `${contact.first_name} ${contact.last_name}`.trim() : 'Unknown';
      const company = contact?.company ? ` (${contact.company})` : '';
      const linkedInteraction = fu.interaction_id ? interactionMap[fu.interaction_id] : null;
      const lastNote = linkedInteraction?.note || 'No notes recorded.';
      const deepLink = `${appUrl}/followup/${fu.id}`;

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'DM Sans', Arial, sans-serif; background: #f5f2ec; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
    <h2 style="color: #18181a; margin: 0 0 8px; font-size: 20px;">Follow-up reminder</h2>
    <p style="color: #6b6b6b; margin: 0 0 24px; font-size: 14px;">You have a follow-up scheduled for today.</p>
    
    <div style="background: #f5f2ec; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="color: #18181a; font-weight: 600; margin: 0 0 4px; font-size: 16px;">${contactName}${company}</p>
      <p style="color: #6b6b6b; margin: 0; font-size: 14px; line-height: 1.5;">${lastNote}</p>
    </div>
    
    <a href="${deepLink}" style="display: inline-block; background: #c8622a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 14px;">View Follow-up</a>
    
    <p style="color: #a0a0a0; font-size: 12px; margin: 24px 0 0;">Sent by ozzo</p>
  </div>
</body>
</html>`;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ozzo <onboarding@resend.dev>',
          to: [userEmail],
          subject: `Follow up with ${contactName} today`,
          html,
        }),
      });

      if (res.ok) {
        sent++;
      } else {
        console.error(`Failed to send to ${userEmail}:`, await res.text());
      }
    }

    return new Response(JSON.stringify({ sent, total: followUps.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-followup-reminders error:', e);
    return new Response(JSON.stringify({ error: 'Failed to send reminders' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
