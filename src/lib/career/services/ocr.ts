// OCR Service - Provider abstraction for image text extraction
// Supports: AI vision models (OpenAI GPT-4o, etc.) via AI provider interface

import type { AIProvider } from "./ai-provider";

export interface OCRResult {
  text: string;
  confidence: number;
  provider: string;
  metadata: Record<string, any>;
}

export interface OCRServiceConfig {
  aiProvider?: AIProvider;
  fallbackToTextLayer?: boolean; // for PDFs with existing text layer
}

export class OCRService {
  private config: OCRServiceConfig;

  constructor(config: OCRServiceConfig = {}) {
    this.config = config;
  }

  async extractTextFromImage(imageBytes: Buffer, mimeType: string): Promise<OCRResult> {
    if (!this.config.aiProvider) {
      throw new Error('OCR not configured: no AI provider available. Set AI_PROVIDER env var or configure in settings.');
    }

    // Convert image to base64
    const base64 = imageBytes.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const prompt = `Extract all text from this image. Return only the extracted text, preserving layout and structure as much as possible. Do not add commentary.`;

    try {
      const response = await this.config.aiProvider.chatCompletion({
        messages: [
          { role: 'system', content: 'You are an OCR engine. Extract text accurately.' },
          { role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: dataUrl } }] },
        ],
        model: this.config.aiProvider.config.visionModel || this.config.aiProvider.config.model,
        maxTokens: 4000,
        temperature: 0,
      });

      return {
        text: response.content,
        confidence: 0.9, // AI vision models don't typically return confidence
        provider: this.config.aiProvider.name,
        metadata: { model: response.model },
      };
    } catch (error) {
      throw new Error(`OCR extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async extractTextFromPDFWithOCR(pdfBytes: Buffer): Promise<OCRResult> {
    // For scanned PDFs: render each page to image then OCR
    // This is a placeholder - full implementation would use pdf2pic or similar
    // For now, we require the AI provider to handle PDF directly if it supports it
    if (!this.config.aiProvider) {
      throw new Error('OCR not configured');
    }

    const base64 = pdfBytes.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;

    const prompt = `Extract all text from this PDF document. Return only the extracted text.`;

    try {
      const response = await this.config.aiProvider.chatCompletion({
        messages: [
          { role: 'system', content: 'You are an OCR engine for PDF documents.' },
          { role: 'user', content: [{ type: 'text', text: prompt }, { type: 'file', file: { file_data: dataUrl, filename: 'document.pdf' } }] },
        ],
        model: this.config.aiProvider.config.visionModel || this.config.aiProvider.config.model,
        maxTokens: 8000,
        temperature: 0,
      });

      return {
        text: response.content,
        confidence: 0.85,
        provider: this.config.aiProvider.name,
        metadata: { model: response.model },
      };
    } catch (error) {
      throw new Error(`PDF OCR failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  isConfigured(): boolean {
    return !!this.config.aiProvider;
  }
}

// Factory for creating OCR service from settings
import { getAutomationSettings } from "../automation-settings";
import { createAIProvider } from "./ai-provider";

export async function createOCRServiceFromSettings(ownerId: number): Promise<OCRService> {
  const settings = await getAutomationSettings(ownerId);
  if (!settings?.ai_provider) {
    return new OCRService({});
  }
  const aiProvider = createAIProvider({
    name: settings.ai_provider,
    model: settings.ai_model || 'gpt-4o',
    baseUrl: settings.ai_base_url || undefined,
    apiKey: process.env[`${settings.ai_provider.toUpperCase()}_API_KEY`] || process.env.OPENAI_API_KEY || '',
  });
  return new OCRService({ aiProvider });
}