import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LlmService {
  async generate(prompt: string) {
    const res = await axios.post('http://127.0.0.1:11434/api/chat', {
      model: 'qwen2.5:7b',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    return res.data.message.content;
  }
}