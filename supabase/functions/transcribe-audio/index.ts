import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio');
    if (!audioFile || !(audioFile instanceof File)) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Step 1: Transcribe with Whisper
    const whisperForm = new FormData();
    whisperForm.append('file', audioFile, 'audio.webm');
    whisperForm.append('model', 'whisper-1');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: whisperForm,
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      console.error('Whisper error:', err);
      return new Response(JSON.stringify({ error: 'Transcription failed', details: err }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { text: transcript } = await whisperRes.json();

    if (!transcript || transcript.trim().length === 0) {
      return new Response(JSON.stringify({ transcript: '', summary: '' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Summarize with Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      // Fall back to returning just the transcript
      return new Response(JSON.stringify({ transcript, summary: transcript }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const summaryRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: 'You summarize sales call notes into 1-2 crisp sentences. Be factual and direct. No filler.',
          },
          { role: 'user', content: transcript },
        ],
      }),
    });

    if (!summaryRes.ok) {
      console.error('Summary error:', await summaryRes.text());
      // Return transcript as fallback
      return new Response(JSON.stringify({ transcript, summary: transcript }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const summaryData = await summaryRes.json();
    const summary = summaryData.choices?.[0]?.message?.content || transcript;

    return new Response(JSON.stringify({ transcript, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('transcribe-audio error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
