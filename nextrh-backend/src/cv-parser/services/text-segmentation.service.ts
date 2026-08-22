import { Injectable, Logger } from '@nestjs/common';
import * as natural from 'natural';
import { HEADING_SYNONYMS } from '../constants/cv-parser.constants';
import { cleanRawText } from '../utils/text-cleaning.util';

@Injectable()
export class TextSegmentationService {
  private readonly logger = new Logger(TextSegmentationService.name);

  public segmentText(text: string): Record<string, string> {
    const cleaned = cleanRawText(text);
    const lines = cleaned.split('\n');
    const sections: Record<string, string[]> = {
      header: [], experience: [], certification: [], education: [], projects: [], skills: [],
    };

    let currentSection = 'header';

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.length === 0) continue;

      let matched: string | null = null;

      if (trimmed.length < 40) {
        outer: for (const [key, synonyms] of Object.entries(HEADING_SYNONYMS)) {
          for (const synonym of synonyms) {
            if (natural.JaroWinklerDistance(trimmed, synonym) > 0.88) {
              matched = key;
              break outer;
            }
          }
        }
      }

      if (matched) {
        currentSection = matched;
      } else {
        sections[currentSection].push(line);
      }
    }

    const result: Record<string, string> = {};
    for (const [key, sectionLines] of Object.entries(sections)) {
      result[key] = sectionLines.join('\n').trim();
    }
    return result;
  }
}