/**
 * Unified LLM engine contract.
 * All providers implement this interface — consumers depend only on this,
 * never on a concrete provider class.
 *
 * Satisfies:
 *   - Dependency Inversion Principle: high-level modules depend on abstraction
 *   - Open/Closed Principle: new providers extend without modifying consumers
 *   - Strategy Pattern: provider is swapped at runtime via LLM_PROVIDER env var
 */
export interface LlmOptions {
  model?: string;
  temperature?: number;
  numCtx?: number;
  numPredict?: number;
}

export interface LlmDocumentAttachment {
  type:      'document' | 'image';
  mediaType: string;  // 'application/pdf', 'image/jpeg', etc.
  data:      string;  // base64 encoded content
}
export interface ILlmEngine {
  /**
   * Generates a plain text response.
   * Use for RAG chat, summaries, or any generation where structured output
   * is not required.
   */
  generate(prompt: string, options?: LlmOptions): Promise<string>;

  /**
   * Generates a structured, type-safe response constrained by a schema.
   * Uses LangChain's .withStructuredOutput() under the hood — no manual
   * JSON parsing required. The returned object is fully typed as T.
   *
   * @param prompt  The full prompt string
   * @param schema  A Zod schema or JSON Schema object describing the output shape
   */
  generateStructured<T>(prompt: string, schema: object, options?: LlmOptions, attachment?: LlmDocumentAttachment,): Promise<T>;
}

// injection token — used across all consumer modules
export const LLM_ENGINE = 'LLM_ENGINE';
export const EMBEDDING_ENGINE = 'EMBEDDING_ENGINE';