import { Injectable } from '@nestjs/common';
import nlp from 'compromise';
import { ContactInfo } from '../interfaces/cv-extraction.types';

@Injectable()
export class ContactInfoExtractorService {
  public extract(text: string): ContactInfo {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let nameIdx = 0;
    while (
      nameIdx < lines.length &&
      (lines[nameIdx].match(/^\d+$/) || lines[nameIdx].length <= 2)
    ) {
      nameIdx++;
    }

    const fullName = lines[nameIdx] ?? 'Unknown';
    const profession = lines[nameIdx + 1] ?? '';

    const addressMatch = text.match(
      /Adresse[:\s]*(.+?)(?=\n|Expérience|Formation|Certification|Projet|$)/i,
    );
    let address = addressMatch ? addressMatch[1].trim() : '';

    if (!address) {
      const places = nlp(text).places().out('array') as string[];
      address = places.length > 0 ? [...new Set(places)].join(', ') : '';
    }

    // Advanced fallbacks if labels are completely absent
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})/i;
    const phoneRegex = /([\+\d\s]{8,})/i;

    const emailLabelMatch = text.match(/Email\s*:\s*(.+?)(?=\n|$)/i);
    const email = emailLabelMatch 
      ? emailLabelMatch[1].trim().match(emailRegex)?.[0] ?? ''
      : text.match(emailRegex)?.[0] ?? '';

    const phoneLabelMatch = text.match(/Tél\s*:\s*(.+?)(?=\n|$)/i);
    const phone = phoneLabelMatch
      ? phoneLabelMatch[1].trim().match(phoneRegex)?.[0] ?? ''
      : text.match(phoneRegex)?.[0] ?? '';

    // FIXED: Explicitly declared the fax variable to resolve TS18004 shorthand scope error
    const fax = text.match(/Fax\s*:\s*([\+\d\s]{8,})/i)?.[1].trim() ?? '';

    return {
      fullName,
      profession,
      phone,
      fax,
      email,
      address: address || 'Not specified',
    };
}}