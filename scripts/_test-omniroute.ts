import { createAIProvider } from "@/lib/career/services/ai-provider";

async function main() {
  try {
    const provider = createAIProvider({ 
      name: 'omniroute', 
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini', 
      baseUrl: process.env.OPENAI_BASE_URL, 
      apiKey: process.env.OPENAI_API_KEY 
    });
    const result = await provider.chatCompletion({ 
      messages: [{ role: 'user', content: 'Say hello in one word' }], 
      maxTokens: 10 
    });
    console.log('AI Test SUCCESS:', result.content);
    console.log('Model used:', result.model);
  } catch (e) {
    console.error('AI Test FAILED:', e instanceof Error ? e.message : String(e));
  }
}

main();