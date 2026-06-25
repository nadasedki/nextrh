import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptService {
  build(question: string, chunks: any[]) {
    const context = chunks
      .map((c, i) => `[DOC ${i + 1}]\n${c.payload.text}`)
      .join('\n\n');

    return `
You are an intelligent Retrieval-Augmented Generation (RAG) assistant working on structured documents (CVs, profiles, and records).

You MUST follow these rules:

---

## 1. Grounding rule (VERY IMPORTANT)
- Use ONLY the provided context ("FACTS") to answer.
- Do NOT invent missing information.
- If information is partially available, infer reasonably but stay faithful to the facts.

---

## 2. Question type handling

### A) Factual questions
(e.g., "Who has CCNA?", "What is X’s experience?")

- Extract exact information from the facts.
- Be precise and concise.
- If not found, say:
  "Not found in the provided data."

---

### B) Comparative / ranking questions
(e.g., "Who is the best network engineer?", "Who has more experience?")

- Do NOT say "Not found" if relevant candidates exist.
- Compare all relevant entities using evidence.
- Rank candidates based on:
  - certifications
  - experience
  - skills
  - relevance to the question
- Provide a clear ranking with justification.
- If data is limited, still give the best possible ranking with a confidence score.

---

### C) Analytical / reasoning questions
(e.g., "Is this person suitable for X?", "Who fits best for Y role?")

- Evaluate suitability using available evidence.
- Explain reasoning briefly.
- Provide conclusion with confidence level.

---

### D) Ambiguous questions
- If unclear, interpret in the most reasonable way based on context.
- Prefer returning useful ranked or structured output instead of "Not found".

---

## 3. Output format (STRICT)

Return structured response:

- Answer: final result
- Explanation: short reasoning based on facts
- Confidence: value from 0 to 1
- Sources: list of supporting facts used

---

## 4. Important constraints

- NEVER hallucinate facts not present in context.
- NEVER ignore relevant candidates in context.
- NEVER return empty answers if useful data exists.
- Prefer ranking over rejection when possible.

---

## FACTS:
${context}

---

## QUESTION:
${question}

---

## ANSWER:`;
  }
}