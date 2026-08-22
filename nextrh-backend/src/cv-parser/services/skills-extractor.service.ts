import { Injectable } from '@nestjs/common';
import { ISectionExtractor } from '../interfaces/section-extractor.interface';
import { SKILL_STOP_WORDS, TECH_KEYWORDS } from '../constants/cv-parser.constants';
import { isSkillsSectionValid } from '../utils/validation.util';

@Injectable()
export class SkillsExtractorService implements ISectionExtractor<string> {
  
  /**
   * Extracts both known IT keywords and dynamically segments layout patterns
   * into clean, standardized skills.
   * 
   * FIXED: Restored 'fullTextFallback' as an optional second parameter to support 
   * full-CV scanning if the segmented section is empty [2].
   */
  public extract(sectionText: string, fullTextFallback?: string): string[] {
    const matchedSkills = new Set<string>();

    const sectionHasContent = sectionText && sectionText.trim().length > 0;
    
    // Safety net: if no Skills section header was found, use the full CV text fallback
    const targetText = sectionHasContent ? sectionText : (fullTextFallback ?? '');

    if (!targetText || targetText.trim().length === 0) {
      return [];
    }

    // Layer 1: Gazette Matching (Restricted to the targetText to avoid full-CV false positives)
    for (const kw of TECH_KEYWORDS) {
      const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      if (new RegExp(`\\b${escaped}\\b`, 'i').test(targetText)) {
        matchedSkills.add(kw);
      }
    }

    // Layer 2: Parse Dynamically using layout patterns (Only executed if the section actually exists)
    if (sectionHasContent) {
      const dynamicTokens = this.segmentSkillsSection(sectionText);

      for (const token of dynamicTokens) {
        if (this.shouldKeepSkillToken(token)) {
          const formatted = this.formatSkillToken(token);
          matchedSkills.add(formatted);
        }
      }
    }

    return Array.from(matchedSkills);
  }

  /**
   * Splits the isolated skills block into clean tokens using structural layout patterns.
   */
  private segmentSkillsSection(sectionText: string): string[] {
    const cleanText = sectionText
      .replace(/^(Compétence[s]?\s*(?:supplémentaire[s]?)?|Skills)[:\s\-\–\.]*/i, '')
      .trim();

    const lines = cleanText.split(/[\n;•●▪\*\|\r:\/]/);
    const rawTokens: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0) continue;

      if (trimmedLine.includes(',')) {
        const commaTokens = trimmedLine.split(',').map(t => t.trim());
        rawTokens.push(...commaTokens);
      } else {
        rawTokens.push(trimmedLine);
      }
    }

    return rawTokens;
  }

  // Delegated Quality Gate check
  public isValid(data: string[]): boolean {
    return isSkillsSectionValid(data);
  }

  /**
   * Standardizes capitalizations of newly discovered skills.
   */
  private formatSkillToken(str: string): string {
    const clean = str.replace(/^[-\–\.\*•●▪\s\(\)]+|[-\–\.\*•●▪\s\(\)]+$/g, '').trim();
    
    if (clean === clean.toUpperCase()) return clean;

    return clean
      .split(/\s+/)
      .map(word => {
        if (SKILL_STOP_WORDS.has(word.toLowerCase())) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  /**
   * Filter: Evaluates if a raw text token is structurally acceptable to be kept as a skill.
   */
  private shouldKeepSkillToken(token: string): boolean {
    const cleanToken = token.replace(/^[-\–\.\*•●▪\s\(\)]+|[-\–\.\*•●▪\s\(\)]+$/g, '').trim();

    // Filter out empty or excessively long segments
    if (cleanToken.length < 2 || cleanToken.length > 40) return false;

    // Filter out sentences (more than 4 words)
    const words = cleanToken.split(/\s+/);
    if (words.length > 4) return false;

    // Filter out pure numbers and years
    if (/^\d+$/.test(cleanToken) || /^\d{4}/.test(cleanToken)) return false;

    // Filter out single generic stop-words
    if (words.length === 1 && SKILL_STOP_WORDS.has(cleanToken.toLowerCase())) {
      return false;
    }

    // Ensure the token has some alphabetic character (filters out pure punctuation/symbols)
    if (!/[a-zA-Zà-ÿ]/i.test(cleanToken)) return false;

    return true;
  }
}