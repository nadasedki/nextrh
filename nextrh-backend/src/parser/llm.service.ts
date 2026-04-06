import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LlmService {
  async extractCertificate(fullText: string) {
    const prompt = `
Extract certificate data from this text as JSON. 
Use the exact certificate title (do not invent generic names).
Return ONLY valid JSON.

Fields:
- certificate_name
- certificate_holder
- provider
- date_of_obtention
- date_of_expiration (null if missing)

Text:
"""${fullText}"""
`;

   const response = await axios.post('http://localhost:11434/api/chat', {
  model: 'qwen2.5:3b-instruct-q4_K_M',
  messages: [
    {
      role: 'user',
      content: prompt,
    },
  ],
   stream: false, 
});

const raw = response.data.message.content;

console.log("RAW LLM OUTPUT:", raw);

// Clean markdown if present
const cleaned = raw.replace(/```json|```/g, '').trim();

try {
  console.error("llm clean output :", cleaned);
  return JSON.parse(cleaned);
} catch (err) {
  console.error("JSON PARSE ERROR:", err);
  return { error: "Invalid JSON from LLM", raw };
}
}
}