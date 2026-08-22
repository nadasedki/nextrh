// src/rag/retrieval/query-preprocessor.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// known HR/IT acronym expansions for the CV domain
// expanding acronyms before embedding helps the model find
// relevant chunks that use the full term rather than the abbreviation
const ACRONYM_MAP: Record<string, string> = {
  'ccnp':   'Cisco Certified Network Professional',
  'ccna':   'Cisco Certified Network Associate',
  'ccie':   'Cisco Certified Internetwork Expert',
  'mcsa':   'Microsoft Certified Solutions Associate',
  'mcse':   'Microsoft Certified Solutions Expert',
  'rhce':   'Red Hat Certified Engineer',
  'rhcsa':  'Red Hat Certified System Administrator',
  'aws':    'Amazon Web Services',
  'gcp':    'Google Cloud Platform',
  'azure':  'Microsoft Azure',
  'devops': 'development operations',
  'rh':     'ressources humaines',
  'si':     'système information',
  'lan':    'local area network',
  'wan':    'wide area network',
  'vpn':    'virtual private network',
  'ids':    'intrusion detection system',
  'ips':    'intrusion prevention system',
  'siem':   'security information event management',
  'pki':    'public key infrastructure',
  'ad':     'active directory',
  'erp':    'enterprise resource planning',
  'crm':    'customer relationship management',
};

@Injectable()
export class QueryPreprocessorService implements OnModuleInit {
  private readonly logger = new Logger(QueryPreprocessorService.name);

  // reuse the same stop-word list as the reranker for consistency
  private stopWords: Set<string> = new Set();

  private readonly STOP_WORDS_PATH = path.join(
    process.cwd(),
    'src/rag/reranking/config/stop-words.json',
  );

  onModuleInit() {
    try {
      const raw = fs.readFileSync(this.STOP_WORDS_PATH, 'utf-8');
      const config = JSON.parse(raw);
      this.stopWords = new Set<string>(config.words);
      this.logger.log(`Stop-words loaded for query preprocessing: ${this.stopWords.size} words`);
    } catch (error) {
      this.logger.error(
        `Could not load stop-words file: ${error.message}. Preprocessing without filtering.`
      );
    }
  }

  /**
   * Preprocesses the raw user query before embedding:
   * 1. Lowercase and strip punctuation
   * 2. Expand known acronyms to their full form
   * 3. Remove stop-words from the token list
   * 4. Rejoin into a clean query string
   *
   * The preprocessed query is more semantically dense —
   * it gives the embedding model a better signal with less noise.
   */
  preprocess(question: string): { cleaned: string; expandedTerms: string[] } {
    const original = question.trim();

    // normalize
    const normalized = original
      .toLowerCase()
      .replace(/[^a-zàâçéèêëîïôûùüÿñæœ0-9\s]/gi, '')
      .trim();

    const tokens = normalized.split(/\s+/).filter(t => t.length > 0);

    const expandedTerms: string[] = [];
    const processedTokens: string[] = [];

    for (const token of tokens) {
      // expand acronym if known — keep both the acronym and expansion
      // so the embedding covers both the short and long form
      if (ACRONYM_MAP[token]) {
        expandedTerms.push(ACRONYM_MAP[token]);
        processedTokens.push(token);           // keep original token
        processedTokens.push(ACRONYM_MAP[token]); // add expansion
        this.logger.debug(`Expanded acronym: "${token}" → "${ACRONYM_MAP[token]}"`);
      } else if (!this.stopWords.has(token)) {
        // keep non-stop-word tokens as-is
        processedTokens.push(token);
      }
    }

    // if stop-word removal left us with nothing, fall back to full query
    const cleaned = processedTokens.length > 0
      ? processedTokens.join(' ')
      : original;

    this.logger.debug(`Query preprocessed: "${original}" → "${cleaned}"`);

    return { cleaned, expandedTerms };
  }

  /**
   * Returns only the meaningful tokens from a query —
   * used by the retrieval service to build keyword filters.
   */
  getMeaningfulTokens(question: string): string[] {
    const { cleaned } = this.preprocess(question);
    return cleaned.split(/\s+/).filter(t => t.length > 1);
  }
}