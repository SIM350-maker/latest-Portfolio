// AI Provider Abstraction
// Supports OpenAI-compatible /chat/completions endpoints

export interface AIProviderConfig {
  model: string;
  visionModel?: string;
  baseUrl?: string; // defaults to https://api.openai.com/v1
  apiKey: string;
  timeout?: number; // ms
  maxRetries?: number;
}

export interface AIProvider {
  name: string;
  config: AIProviderConfig;
  chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult>;
  structuredCompletion<T>(params: StructuredCompletionParams<T>): Promise<StructuredCompletionResult<T>>;
}

export interface ChatCompletionParams {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: 'text' | 'json_object';
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ChatContentPart[];
}

export interface ChatContentPart {
  type: 'text' | 'image_url' | 'file';
  text?: string;
  image_url?: { url: string; detail?: 'low' | 'high' | 'auto' };
  file?: { file_data: string; filename: string };
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  finishReason: string;
}

export interface StructuredCompletionParams<T> {
  messages: ChatMessage[];
  schema: JSONSchema;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface StructuredCompletionResult<T> {
  data: T;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
}

// Default OpenAI-compatible provider
export function createAIProvider(config: {
  name: string;
  model: string;
  visionModel?: string;
  baseUrl?: string;
  apiKey: string;
  timeout?: number;
  maxRetries?: number;
}): AIProvider {
  const providerConfig: AIProviderConfig = {
    model: config.model,
    visionModel: config.visionModel,
    baseUrl: config.baseUrl || 'https://api.openai.com/v1',
    apiKey: config.apiKey,
    timeout: config.timeout ?? 60000,
    maxRetries: config.maxRetries ?? 2,
  };

  return {
    name: config.name,
    config: providerConfig,
    async chatCompletion(params) {
      return chatCompletion(providerConfig, params);
    },
    async structuredCompletion(params) {
      return structuredCompletion(providerConfig, params);
    },
  };
}

async function chatCompletion(config: AIProviderConfig, params: ChatCompletionParams): Promise<ChatCompletionResult> {
  const url = `${config.baseUrl}/chat/completions`;
  const body = {
    model: params.model || config.model,
    messages: params.messages,
    max_tokens: params.maxTokens,
    temperature: params.temperature ?? 0.2,
    response_format: params.responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
  };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= (config.maxRetries ?? 2); attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      if (!choice?.message?.content) {
        throw new Error('Empty response from AI provider');
      }

      return {
        content: choice.message.content,
        model: data.model,
        usage: data.usage,
        finishReason: choice.finish_reason,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < (config.maxRetries ?? 2)) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // exponential backoff
      }
    }
  }

  throw lastError || new Error('AI provider failed after retries');
}

async function structuredCompletion<T>(config: AIProviderConfig, params: StructuredCompletionParams<T>): Promise<StructuredCompletionResult<T>> {
  const schemaPrompt = `\n\nYou must respond with valid JSON matching this schema:\n${JSON.stringify(params.schema, null, 2)}\n\nNo additional text, no markdown, just the JSON object.`;

  const messagesWithSchema: ChatMessage[] = [
    ...params.messages,
    { role: 'system', content: schemaPrompt },
  ];

  const result = await chatCompletion(config, {
    ...params,
    messages: messagesWithSchema,
    responseFormat: 'json_object',
  });

  try {
    const parsed = JSON.parse(result.content);
    return { data: parsed as T, model: result.model, usage: result.usage };
  } catch (e) {
    throw new Error(`Failed to parse structured output: ${e instanceof Error ? e.message : String(e)}. Raw: ${result.content.slice(0, 500)}`);
  }
}

// Mock provider for testing (no external API calls)
export function createMockAIProvider(): AIProvider {
  return {
    name: 'mock',
    config: { model: 'mock', apiKey: 'mock' },
    async chatCompletion(params) {
      const lastUserMsg = [...params.messages].reverse().find(m => m.role === 'user');
      const content = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '';

      // Simple heuristic responses for testing
      if (content.includes('vacancy') || content.includes('job advertisement') || content.includes('requirements')) {
        return {
          content: JSON.stringify({
            employer: 'Acme Corp',
            title: 'Senior Software Engineer',
            location: 'Remote',
            employment_type: 'Full-time',
            description: content.slice(0, 500),
            responsibilities: ['Design systems', 'Write code', 'Review PRs'],
            required_skills: ['TypeScript', 'React', 'PostgreSQL'],
            preferred_skills: ['GraphQL', 'Kubernetes'],
            experience_years: 5,
            qualifications: ['BS Computer Science'],
            certifications: [],
            application_email: 'jobs@acme.example',
            deadline: null,
            reference_number: null,
          }),
          model: 'mock',
          finishReason: 'stop',
        };
      }

      if (content.includes('match') || content.includes('evidence') || content.includes('candidate')) {
        return {
          content: JSON.stringify({
            matches: [
              { requirement: 'TypeScript', match_class: 'STRONG', source: 'skill:1', reason: '5+ years professional use' },
              { requirement: 'React', match_class: 'STRONG', source: 'skill:2', reason: 'Multiple production apps' },
              { requirement: 'GraphQL', match_class: 'PARTIAL', source: 'project:3', reason: 'Used in one project' },
            ],
          }),
          model: 'mock',
          finishReason: 'stop',
        };
      }

      if (content.includes('CV') || content.includes('curriculum vitae') || content.includes('resume')) {
        return {
          content: JSON.stringify({
            summary: 'Experienced software engineer with 7+ years building scalable web applications.',
            skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
            experience_highlights: ['Led team of 5', 'Reduced latency 40%', 'Migrated to microservices'],
          }),
          model: 'mock',
          finishReason: 'stop',
        };
      }

      if (content.includes('cover letter')) {
        return {
          content: 'Dear Hiring Manager,\n\nI am writing to express my interest in the Senior Software Engineer position at Acme Corp. With 7+ years of experience...',
          model: 'mock',
          finishReason: 'stop',
        };
      }

      if (content.includes('email') && content.includes('application')) {
        return {
          content: 'Subject: Application for Senior Software Engineer\n\nDear Hiring Manager,\n\nPlease find my application attached...\n\nSincerely,\nSimon Ipara',
          model: 'mock',
          finishReason: 'stop',
        };
      }

      return { content: 'Mock response for: ' + content.slice(0, 100), model: 'mock', finishReason: 'stop' };
    },
    async structuredCompletion(params) {
      const chatResult = await this.chatCompletion({ messages: params.messages });
      return { data: JSON.parse(chatResult.content), model: 'mock', usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 } };
    },
  };
}