import express from 'express';

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT || 8080);
const BACKEND_BASE = process.env.BACKEND_BASE || 'http://project-backend:5000';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2-vision';
const OLLAMA_TIMEOUT = Number(process.env.OLLAMA_TIMEOUT || 120000);
const FETCH_IMG_TIMEOUT = Number(process.env.FETCH_IMG_TIMEOUT || 20000);

function toAbsolute(url, base) {
  if (!url) return url;
  if (/^https?:/i.test(url)) return url;
  const backend = base || BACKEND_BASE;
  return url.startsWith('/') ? backend + url : `${backend}/${url}`;
}

function normalizeBase64(s) {
  if (!s) return '';
  return String(s).replace(/^data:.*?;base64,/, '').trim();
}

async function fetchImageAsBase64(absUrl) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_IMG_TIMEOUT);

  const r = await fetch(absUrl, { signal: controller.signal });
  clearTimeout(t);

  if (!r.ok) throw new Error(`fetch image failed: ${r.status}`);
  const ab = await r.arrayBuffer();
  const b64 = Buffer.from(ab).toString('base64');
  return normalizeBase64(b64);
}

function stripCodeFence(s) {
  return String(s || '')
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();
}

// 提取第一个 JSON 对象或数组
function extractFirstJson(text) {
  const s = stripCodeFence(text);
  const startObj = s.indexOf('{');
  const startArr = s.indexOf('[');
  const start = (startObj === -1) ? startArr : (startArr === -1 ? startObj : Math.min(startObj, startArr));
  if (start === -1) return '';

  const open = s[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === open) depth++;
    else if (ch === close) depth--;
    if (depth === 0) return s.slice(start, i + 1);
  }
  return '';
}

function normalizeTagsFromObj(obj) {
  if (!obj) return [];
  if (Array.isArray(obj.tags)) return obj.tags;
  if (typeof obj.tags === 'string') return obj.tags.split(/[,，\s]+/).filter(Boolean);
  if (typeof obj.tag === 'string') return [obj.tag];
  if (typeof obj.text === 'string') return [obj.text];
  if (Array.isArray(obj.text)) return obj.text;
  const kv = Object.keys(obj).filter(k => /^tag\d+$/i.test(k));
  if (kv.length) {
    kv.sort((a,b)=> Number(a.replace(/\D/g,'')) - Number(b.replace(/\D/g,'')));
    return kv.map(k => obj[k]);
  }
  if (Array.isArray(obj)) return obj;
  return [];
}

function extractTagsEvenIfTruncated(content) {
  const s = String(content || '');
  const k = s.indexOf('"tags"');
  if (k < 0) return [];
  const lb = s.indexOf('[', k);
  if (lb < 0) return [];

  const part = s.slice(lb + 1);
  const out = [];
  const re = /"([^"]*)"/g;
  let m;
  while ((m = re.exec(part)) !== null) {
    out.push(m[1]);
    if (out.length >= 50) break;
  }
  return out;
}


async function ollamaChatWithImage(imageBase64, pass = 1) {
  const prompt = `
只输出 JSON，禁止输出其它任何文字。
必须返回：{"tags":["唯美","CG",...]} 的格式，tags 必须是数组，元素是中文短词（2~6字），前两个元素可根据实际情况修改。
`.trim();

  const body = {
    model: OLLAMA_MODEL,
    stream: false,
    format: 'json',
    keep_alive: '10m',
    messages: [
      {
        role: 'user',
        content: prompt,
        images: [normalizeBase64(imageBase64)]
      }
    ],
    options: {
      temperature: pass === 1 ? 0.3 : 0.1,
      top_p: 0.9,
      num_predict: 256
    }
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT);

  const r = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal
  }).catch((e) => {
    clearTimeout(t);
    throw e;
  });

  clearTimeout(t);

  const raw = await r.text();
  if (!r.ok) throw new Error(`ollama chat failed: ${r.status} ${raw}`);

  const data = JSON.parse(raw);
  const content = data?.message?.content ?? '';

  // 调试日志
  console.log(`[tagger] ollama ok pass=${pass} content.len=${content.length} head=${JSON.stringify(content.slice(0, 120))}`);

  let obj = {};
  try {
    obj = JSON.parse(stripCodeFence(content));
  } catch {
    const jsonLike = extractFirstJson(content);
    if (jsonLike) {
      try { obj = JSON.parse(jsonLike); } catch { obj = {}; }
    }
  }

  let tags = normalizeTagsFromObj(obj);
  if (!tags.length) {
    tags = extractTagsEvenIfTruncated(content); // 非常规提取
  }

  // 清洗 + 去重 + 限长
  const cleaned = [];
  const seen = new Set();
  for (const x of tags) {
    const s = String(x || '').trim();
    if (!s) continue;
    if (s.length > 10) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    cleaned.push(s);
    if (cleaned.length >= 12) break;
  }

  if (!cleaned.length && pass === 1) {
    console.warn('[tagger] empty tags, retry with strict prompt');
    return await ollamaChatWithImage(imageBase64, 2);
  }

  return cleaned;
}

app.get('/health', async (req, res) => {
  try {
    const r = await fetch(`${OLLAMA_URL}/`);
    if (!r.ok) throw new Error(`ollama not ready: ${r.status}`);
    res.json({ ok: true, model: OLLAMA_MODEL });
  } catch (e) {
    res.status(503).json({ ok: false, error: String(e) });
  }
});

app.post('/tags', async (req, res) => {
  try {
    const { imageUrl, backendBase } = req.body || {};
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ message: 'imageUrl 必填' });
    }

    const abs = toAbsolute(imageUrl, backendBase);
    const b64 = await fetchImageAsBase64(abs);

    const tags = await ollamaChatWithImage(b64);
    console.log('[tagger] tags=', tags);
    return res.json({ tags });
  } catch (e) {
    console.error('tagger error:', e);
    return res.status(500).json({ message: 'tagger failed', error: String(e) });
  }
});

app.listen(PORT, () => console.log(`AI tagger (ollama) on :${PORT}`));
