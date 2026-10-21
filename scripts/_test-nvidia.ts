import { createAIProvider } from "@/lib/career/services/ai-provider";

async function main() {
  try {
    const provider = createAIProvider({ 
      name: 'nvidia', 
      model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct', 
      baseUrl: process.env.NVIDIA_BASE_URL, 
      apiKey: process.env.NVIDIA_API_KEY 
    });
    const result = await provider.chatCompletion({ 
      messages: [{ role: 'user', content: 'Say hello in one word' }], 
      maxTokens: 10 
    });
    console.log('NVIDIA Test SUCCESS:', result.content);
    console.log('Model used:', result.model);
  } catch (e) {
    console.error('NVIDIA Test FAILED:', e instanceof Error ? e.message : String(e));
  }
}

main();