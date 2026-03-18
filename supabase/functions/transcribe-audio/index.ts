import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio');
    if (!audioFile || !(audioFile instanceof File)) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (audioFile.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum 25MB.' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ALLOWED_TYPES = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/mp4'];
    if (audioFile.type && !ALLOWED_TYPES.includes(audioFile.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Use audio formats only.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Debug: estimated duration from file size (~4000 bytes/sec at 32kbps webm)
    const estimatedDurationSec = audioFile.size / 4000;
    console.log('[transcribe-audio] file size:', audioFile.size, 'bytes, estimated duration:', estimatedDurationSec.toFixed(1), 'seconds');

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

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
      return new Response(JSON.stringify({ error: 'Transcription failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { text: transcript } = await whisperRes.json();
    console.log('[transcribe-audio] raw Whisper transcript:', transcript);

    if (!transcript || transcript.trim().length === 0) {
      return new Response(JSON.stringify({ transcript: '', summary: '', isRawTranscript: false, estimatedDuration: estimatedDurationSec }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Duration gate: skip Gemini for recordings >30s
    if (estimatedDurationSec > 30) {
      console.log('[transcribe-audio] duration >30s, skipping Gemini, returning raw transcript');
      return new Response(JSON.stringify({ transcript, summary: transcript, isRawTranscript: true, estimatedDuration: estimatedDurationSec }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.log('[transcribe-audio] no LOVABLE_API_KEY, returning raw transcript');
      return new Response(JSON.stringify({ transcript, summary: transcript, isRawTranscript: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let isRawTranscript = false;

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
            content: `You are a note-taking assistant helping professionals keep track of conversations.
Clean up the following voice note transcript into 1-3 clear, factual sentences.
Preserve all specific details exactly as spoken: names, places, numbers, dates,
dollar amounts, and any other specifics — do not paraphrase, generalize, or
replace specific terms with generic ones.
Do not add, invent, or infer any information not present in the transcript.
If the transcript is unclear or very short, return it as-is with minimal cleanup.`,
          },
          { role: 'user', content: `Transcript: ${transcript}` },
        ],
      }),
    });

    let summary: string;

    if (!summaryRes.ok) {
      console.error('Summary error:', await summaryRes.text());
      summary = transcript;
      isRawTranscript = true;
    } else {
      const summaryData = await summaryRes.json();
      summary = summaryData.choices?.[0]?.message?.content || transcript;
      if (!summaryData.choices?.[0]?.message?.content) {
        isRawTranscript = true;
      }
    }

    console.log('[transcribe-audio] final summary:', summary, '| isRawTranscript:', isRawTranscript);

    return new Response(JSON.stringify({ transcript, summary, isRawTranscript, estimatedDuration: estimatedDurationSec }), {
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
