import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.mjs';
import { providerConfig } from './provider.mjs';
import { systemPrompt } from './agents.mjs';

const origin = 'http://localhost:5173';
const groqEnv = { AI_PROVIDER: 'groq', GROQ_API_KEY: 'fixture-groq-key', GROQ_MODEL: 'fixture-chat-model' };
async function fixture(t, providerFetch, env = {}) {
  const app = await buildApp({ env: { APP_ORIGIN: origin, DAILY_CHAT_LIMIT: '1', ...groqEnv, ...env }, providerFetch });
  t.after(() => app.close());
  const session = await app.inject({ method: 'POST', url: '/api/session', headers: { origin } });
  const headers = { origin, cookie: session.headers['set-cookie'].split(';')[0] };
  return { app, headers, chat: body => app.inject({ method: 'POST', url: '/api/chat', headers, payload: body || { agent: 'spark', mood: 'red', message: 'Lagi desain' } }) };
}

test('provider selection is explicit; unknown providers fail instead of using another key', () => {
  assert.equal(providerConfig({ GROQ_API_KEY: 'fixture' }).name, 'openai');
  assert.equal(providerConfig({ AI_PROVIDER: 'groq', OPENAI_API_KEY: 'fixture', OPENAI_MODEL: 'fixture' }).live, false);
  assert.throws(() => providerConfig({ AI_PROVIDER: 'unknown' }), /AI_PROVIDER/);
});

test('Groq chat forwards bounded history and the selected persona to the official endpoint', async t => {
  let call;
  const { app, chat } = await fixture(t, async (url, options) => {
    call = { url, options };
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'Ayo mulai satu warna.' } }] }) };
  });
  const history = [{ role: 'user', content: 'Aku malas' }, { role: 'assistant', content: 'Lagi mengerjakan apa?' }];
  const response = await chat({ agent: 'spark', mood: 'red', message: 'Lagi desain', history });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().mode, 'live');
  assert.equal(call.url, 'https://api.groq.com/openai/v1/chat/completions');
  const body = JSON.parse(call.options.body);
  assert.equal(body.model, 'fixture-chat-model');
  assert.equal(body.max_completion_tokens, 400);
  assert.deepEqual(body.messages, [{ role: 'system', content: systemPrompt('spark', 'red') }, ...history, { role: 'user', content: 'Lagi desain' }]);
  assert.ok(call.options.signal instanceof AbortSignal);
  const status = await app.inject('/api/status');
  assert.equal(status.json().provider, 'groq');
  assert.equal(status.json().voiceInput, false);
  assert.ok(!status.body.includes('fixture-groq-key'));
});

test('Groq voice requires a separate transcription model and uses Indonesian multipart audio', async t => {
  let call;
  const { app, headers } = await fixture(t, async (url, options) => {
    call = { url, options };
    return { ok: true, json: async () => ({ text: 'Aku mau mulai desain' }) };
  }, { GROQ_TRANSCRIPTION_MODEL: 'whisper-large-v3-turbo' });
  assert.equal((await app.inject('/api/status')).json().voiceInput, true);
  const response = await app.inject({ method: 'POST', url: '/api/transcribe', headers: { ...headers, 'content-type': 'audio/webm;codecs=opus' }, payload: Buffer.alloc(200) });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().text, 'Aku mau mulai desain');
  assert.equal(call.url, 'https://api.groq.com/openai/v1/audio/transcriptions');
  assert.equal(call.options.body.get('model'), 'whisper-large-v3-turbo');
  assert.equal(call.options.body.get('language'), 'id');
  assert.equal(call.options.body.get('file').name, 'voice.webm');
  assert.equal(call.options.body.get('file').size, 200);
  assert.equal(call.options.headers['Content-Type'], undefined);
});

test('Groq GPT-OSS returns only the final answer with a budget for internal reasoning', async t => {
  for (const model of ['openai/gpt-oss-20b', 'openai/gpt-oss-120b']) {
    let body;
    const { chat } = await fixture(t, async (_url, options) => {
      body = JSON.parse(options.body);
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Pilih satu langkah kecil.', reasoning: 'fixture-internal-reasoning' } }] }) };
    }, { GROQ_MODEL: model });
    const response = await chat();
    assert.equal(response.statusCode, 200);
    assert.equal(body.max_completion_tokens, 1200);
    assert.equal(body.reasoning_effort, 'low');
    assert.equal(body.include_reasoning, false);
    assert.equal(body.reasoning_format, undefined);
    assert.deepEqual(response.json(), { reply: 'Pilih satu langkah kecil.', mode: 'live' });
    assert.ok(!response.body.includes('fixture-internal-reasoning'));
  }
});

test('OpenAI and generic Groq models do not receive Groq GPT-OSS parameters', async t => {
  for (const env of [{ GROQ_MODEL: 'fixture-generic' }, { AI_PROVIDER: 'openai', OPENAI_API_KEY: 'fixture-openai-key', OPENAI_MODEL: 'openai/gpt-oss-20b' }]) {
    let body;
    const { chat } = await fixture(t, async (_url, options) => {
      body = JSON.parse(options.body);
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Halo.' } }] }) };
    }, env);
    assert.equal((await chat()).statusCode, 200);
    assert.equal(body.max_completion_tokens, 400);
    assert.equal(body.reasoning_effort, undefined);
    assert.equal(body.include_reasoning, undefined);
  }
});

test('missing Groq voice configuration does not send audio upstream', async t => {
  const { app, headers } = await fixture(t, async () => { assert.fail('must not transmit audio'); });
  const response = await app.inject({ method: 'POST', url: '/api/transcribe', headers: { ...headers, 'content-type': 'audio/webm' }, payload: Buffer.alloc(200) });
  assert.equal(response.statusCode, 503);
});

test('upstream quota errors refund reservations and never return demo replies', async t => {
  const { chat } = await fixture(t, async () => ({ ok: false, status: 429, json: async () => { assert.fail('do not expose provider body'); } }));
  for (let i = 0; i < 2; i++) {
    const response = await chat();
    assert.equal(response.statusCode, 429);
    assert.match(response.json().error, /Layanan AI/);
    assert.equal(response.json().reply, undefined);
  }
});

test('provider timeout aborts requests, refunds quota and remains sanitized', async t => {
  const timeout = AbortSignal.timeout.bind(AbortSignal);
  t.mock.method(AbortSignal, 'timeout', milliseconds => { assert.equal(milliseconds, 25000); return timeout(2); });
  const { chat } = await fixture(t, async (_url, { signal }) => new Promise((resolve, reject) => {
    const guard = setTimeout(() => reject(new Error('abort did not fire')), 100);
    signal.addEventListener('abort', () => { clearTimeout(guard); reject(signal.reason); }, { once: true });
  }));
  for (let i = 0; i < 2; i++) {
    const response = await chat();
    assert.equal(response.statusCode, 503);
    assert.equal(response.json().reply, undefined);
    assert.ok(!response.body.includes('TimeoutError'));
  }
});

test('empty upstream output fails without consuming a daily allowance', async t => {
  const { chat } = await fixture(t, async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: ' ' } }] }) }));
  assert.equal((await chat()).statusCode, 503);
  assert.equal((await chat()).statusCode, 503);
});
