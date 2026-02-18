# AI Provider Switching Guide

Your chatbot now supports **3 AI providers** that can be switched instantly!

## Quick Switch

Edit `apps/api/.env`:

```env
# Choose one:
AI_PROVIDER=ollama   # ✅ Currently Active (FREE, Local)
# AI_PROVIDER=openai  # Paid, High Quality
# AI_PROVIDER=gemini  # FREE, Google Cloud
```

Then restart the API server.

---

## Provider Details

### 1. Ollama (Current) 🆓
- **Cost:** FREE
- **Models:** llama3.2 (chat), nomic-embed-text (embeddings)
- **Vector Dimensions:** 768
- **Requirements:** 
  - Ollama installed locally
  - Models pulled: `ollama pull llama3.2` & `ollama pull nomic-embed-text`
- **Pros:** No API costs, fully offline, no rate limits
- **Cons:** Requires local resources (8GB+ RAM recommended)

### 2. OpenAI 💰
- **Cost:** Paid (requires billing setup)
- **Models:** gpt-4o-mini (chat), text-embedding-3-small (embeddings)
- **Vector Dimensions:** 1536
- **Requirements:** 
  - Valid `OPENAI_API_KEY` with billing
  - **Pinecone index MUST be 1536d** (recreate if switching)
- **Pros:** High quality, fast, reliable
- **Cons:** Costs money, rate limits on free tier

### 3. Google Gemini 🆓
- **Cost:** FREE
- **Models:** gemini-1.5-flash (chat), gemini-embedding-001 (embeddings)
- **Vector Dimensions:** 3072
- **Requirements:** 
  - Valid `GOOGLE_API_KEY`
  - **Pinecone index MUST be 3072d** (recreate if switching)
- **Pros:** Free, good quality
- **Cons:** API availability may vary

---

## Switching Steps

### From Ollama → OpenAI:
1. Edit `.env`: `AI_PROVIDER=openai`
2. Ensure `OPENAI_API_KEY` is valid and has billing
3. **Recreate Pinecone index** (768d → 1536d):
   ```bash
   cd apps/api
   npx tsx create_pinecone_index.ts
   ```
4. Restart server: `npm run dev`

### From Ollama → Gemini:
1. Edit `.env`: `AI_PROVIDER=gemini`
2. **Recreate Pinecone index** (768d → 3072d):
   ```bash
   cd apps/api
   npx tsx create_pinecone_index.ts
   ```
3. Restart server: `npm run dev`

---

## Note on Pinecone Index Dimensions

⚠️ **CRITICAL:** Each provider has different vector dimensions. When switching:
- The dimensions in `create_pinecone_index.ts` will **auto-adjust** based on `AI_PROVIDER`
- You MUST recreate the index when switching providers
- Old vectors will be deleted

The system is smart - it reads `AI_PROVIDER` and sets the correct dimensions automatically!
