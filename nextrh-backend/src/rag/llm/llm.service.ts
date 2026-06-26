import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmService {
  private chatModel: ChatOllama;

  constructor(private configService: ConfigService) {
    this.chatModel = new ChatOllama({
      baseUrl: this.configService.get<string>('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
      model: this.configService.get<string>('OLLAMA_MODEL', 'qwen2.5:7b'),
    });
  }

  async generate(prompt: string): Promise<string> {
    try {
      const response = await this.chatModel.invoke(prompt);
      return response.content as string;
    } catch (error) {
      throw new ServiceUnavailableException('The AI Inference engine is currently unreachable. Please try again.');
    }
  }
}