# AI Provider Architecture Guide

Your chatbot SaaS uses a **Hybrid (Decoupled) Architecture** for maximum efficiency and stability.

## How It Works

### 1. Embeddings (Fixed)
The embedding system (which converts text into searchable database vectors) is **permanently fixed to OpenAI's `text-embedding-3-small`**. 
- **Reason:** Ensuring all Pinecone vectors are exactly 1536 dimensions. This prevents database corruption when users switch chat bots and avoids the need to re-upload documents.
- **Requirement:** A valid `OPENAI_API_KEY` must always be present in your `.env` file.

### 2. Chat Generation (Dynamic)
The generation system (which actually talks to the user) is **dynamic per Tenant**.
- **Reason:** Allows tenants to "Bring Your Own Key" (BYOK) and choose their preferred model (GPT, Gemini, Llama) through the Dashboard without affecting the main database.
- **Default:** Controlled by `AI_PROVIDER` in `.env`.
- **Tenant Override:** Can be overridden via the `chatConfig` JSON in the PostgreSQL `Tenant` table.

---

## Modifying the Default Chat Provider

Edit `apps/api/.env`:

```env
# Default Chat Provider (fallback if tenant has no config)
AI_PROVIDER=ollama

# REQUIRED for Embeddings (Global)
OPENAI_API_KEY="sk-..."
```

---

## Tenant Configuration (Dashboard API)

The `ChatService` automatically reads the `Tenant.chatConfig` field from the database.
If a tenant provides their own API key and model choice, it bypasses the `.env` settings for chat generation!

Example `chatConfig` JSON format:
```json
{
  "activeProvider": "openai",
  "providers": {
    "openai": {
      "model": "gpt-4o",
      "apiKey": "sk-tenant-personal-key"
    },
    "gemini": {
      "model": "gemini-1.5-pro",
      "apiKey": "AIzaSy..."
    }
  }
}
```

## Pinecone Configuration
- You no longer need to worry about changing index dimensions.
- The dimension is hardcoded to **1536** to match OpenAI.
- Use `npm run create-index` to set it up initially.
