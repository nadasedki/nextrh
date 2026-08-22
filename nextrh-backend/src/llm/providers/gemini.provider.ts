import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ILlmEngine,LlmDocumentAttachment, LlmOptions  } from '../llm.interface';
import { HumanMessage } from 'node_modules/@langchain/core/dist/messages/human.cjs';

export class GeminiProvider implements ILlmEngine {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly model: ChatGoogleGenerativeAI;

  constructor(configService: ConfigService) {
    this.model = new ChatGoogleGenerativeAI({
      apiKey:      configService.get<string>('GEMINI_API_KEY'),
      model:       configService.get<string>('GEMINI_MODEL', 'gemini-1.5-flash'),
      temperature: configService.get<number>('GEMINI_TEMPERATURE', 0),
    });

    this.logger.log(
      `GeminiProvider initialized — model: ${configService.get('GEMINI_MODEL', 'gemini-1.5-flash')}`,
    );
  }

  async generate(prompt: string): Promise<string> {
    try {
      const response = await this.model.invoke(prompt);
      return response.content as string;
    } catch (err: any) {
      this.logger.error(`Gemini generate failed: ${err.message}`);
      throw err;
    }
  }
  async generateStructured<T>(
    prompt: string,
    schema: object,
    options?: LlmOptions,
    attachment?: LlmDocumentAttachment,
  ): Promise<T> {
    try {
      const structured = this.model.withStructuredOutput(schema as any);

      if (attachment) {
        // multimodal message — text prompt + document/image attachment
        const message = new HumanMessage({
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type:       attachment.type === 'image' ? 'image_url' : 'media',
              mimeType:   attachment.mediaType,
              data:       attachment.data,
            },
          ],
        });
        const response = await structured.invoke([message]);
        return response as T;
      }

      // text-only path — existing behavior unchanged
      const response = await structured.invoke(prompt);
      return response as T;

    } catch (err: any) {
      this.logger.error(`Gemini generateStructured failed: ${err.message}`);
      throw err;
    }
  }
  /*async generateStructured<T>(prompt: string, schema: object): Promise<T> {
    try {
      const structured = this.model.withStructuredOutput(schema as any);
      const response   = await structured.invoke(prompt);
      return response as T;
    } catch (err: any) {
      this.logger.error(`Gemini generateStructured failed: ${err.message}`);
      throw err;
    }
  }*/
}