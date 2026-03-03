

## Update OpenAI API Key

The edge function logs confirm the current `OPENAI_API_KEY` secret is invalid. Since you generated a new key, we just need to update the stored secret.

### What needs to happen

1. **Update the `OPENAI_API_KEY` secret** with your new OpenAI API key using the secrets tool. No code changes are needed — the `transcribe-audio` edge function already reads from `Deno.env.get('OPENAI_API_KEY')` and will pick up the new value automatically.

That's it — one secret update, zero code changes.

