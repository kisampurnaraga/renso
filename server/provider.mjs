// Fixed provider origins prevent credentials being sent to arbitrary URLs.
export function providerConfig(env) {
  const name = env.AI_PROVIDER?.trim() || 'openai';
  if (!['openai', 'groq'].includes(name)) throw new Error('AI_PROVIDER must be openai or groq');
  const prefix = name === 'groq' ? 'GROQ' : 'OPENAI';
  const key = env[`${prefix}_API_KEY`]?.trim();
  const model = env[`${prefix}_MODEL`]?.trim();
  const transcriptionModel = env[`${prefix}_TRANSCRIPTION_MODEL`]?.trim() || (name === 'openai' ? 'whisper-1' : '');
  return { name, key, model, transcriptionModel, live: !!(key && model), voiceInput: !!(key && transcriptionModel), baseUrl: name === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1' };
}

export class ProviderError extends Error {
  constructor(status) { super('AI provider unavailable'); this.status = status; }
}

export function createProvider(config, providerFetch = fetch) {
  async function request(path, body, json = false) {
    const result = await providerFetch(`${config.baseUrl}${path}`, {
      method: 'POST', signal: AbortSignal.timeout(25000),
      headers: { Authorization: `Bearer ${config.key}`, ...(json ? { 'Content-Type': 'application/json' } : {}) },
      body: json ? JSON.stringify(body) : body,
    });
    if (!result.ok) throw new ProviderError(result.status);
    return result.json();
  }
  return {
    async chat(messages) {
      // GPT-OSS shares its generation budget with internal reasoning. Keep
      // the final reply available while asking the provider to omit reasoning.
      const groqOss = config.name === 'groq' && ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'].includes(config.model);
      const data = await request('/chat/completions', { model: config.model, max_completion_tokens: groqOss ? 1200 : 400, ...(groqOss ? { reasoning_effort: 'low', include_reasoning: false } : {}), messages }, true);
      const text = data.choices?.[0]?.message?.content;
      if (typeof text !== 'string' || !text.trim()) throw new ProviderError(502);
      return text;
    },
    async transcribe(audio, type) {
      const form = new FormData();
      form.append('file', new Blob([audio], { type }), `voice.${type.split('/')[1]}`);
      form.append('model', config.transcriptionModel); form.append('language', 'id');
      const data = await request('/audio/transcriptions', form);
      if (typeof data.text !== 'string' || !data.text.trim()) throw new ProviderError(502);
      return data.text.slice(0, 2000);
    },
  };
}
