// src/rag/prompting/prompt.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { RankedResult,RagStructuredOutput } from '../types/rag-types';



@Injectable()
export class PromptService implements OnModuleInit {
  private readonly logger = new Logger(PromptService.name);

  // loaded from disk once at startup — not rebuilt on every request
  private promptTemplate: string = '';

  private readonly PROMPT_PATH = path.join(
    process.cwd(),
    'src/assets/prompts/rag-prompt.md',
  );

  // JSON schema passed to Ollama to constrain token generation
  // the model cannot return anything that does not match this shape
  readonly OUTPUT_SCHEMA = {
    type: 'object',
    properties: {
      reasoning: {
        type: 'string',
        description:
          'Step-by-step validation of each candidate against the conditions in the question.',
      },
      answer: {
        type: 'string',
        description:
          'Final candidate name(s). If no single candidate meets all conditions, write "No candidate satisfies all criteria."',
      },
      explanation: {
        type: 'string',
        description: 'One sentence summarizing why this conclusion was reached.',
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Confidence score between 0 and 1.',
      },
      sources: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of document references used to reach the answer.',
      },
    },
    required: [
      'reasoning',
      'answer',
      'explanation',
      'confidence',
      'sources',
    ],
  };

  // load the prompt template from disk once when the module initializes
  // storing it in memory avoids file I/O on every request
  onModuleInit() {
    try {
      this.promptTemplate = fs.readFileSync(this.PROMPT_PATH, 'utf-8');
      this.logger.log('RAG prompt template loaded from disk.');
    } catch (err: any) {
      this.logger.error(
        `Failed to load prompt template from ${this.PROMPT_PATH}: ${err.message}. ` +
        `Using minimal fallback.`,
      );
      // minimal fallback so the pipeline does not crash if the file is missing
      this.promptTemplate = 'FACTS:\n{context}\n\nQUESTION:\n{question}';
    }
  }

  build(question: string, chunks: RankedResult[]): string {
    // filter out any chunks with missing or empty text
    const validChunks = (chunks || []).filter(
      c =>
        c?.payload &&
        typeof c.payload.text === 'string' &&
        c.payload.text.trim().length > 0,
    );

    if (validChunks.length === 0) {
      this.logger.warn(
        `No valid chunks for query: "${question}" — LLM will receive empty context`,
      );
    }

    // include candidate name and section type in each doc header
    // this gives the LLM explicit attribution without relying on the chunk text alone
    const context = validChunks
      .map((c, i) => {
        const candidate = c.payload.full_name || 'Unknown';
        const section = c.payload.type || 'profile';
        return `[DOC ${i + 1}] (Candidat: ${candidate} | Section: ${section})\n${c.payload.text}`;
      })
      .join('\n\n');

    // replace placeholders in the externalized template
    return this.promptTemplate
      .replace('{context}', context)
      .replace('{question}', question);
  }
}