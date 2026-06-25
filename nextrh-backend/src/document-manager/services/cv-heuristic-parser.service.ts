import { Injectable, Logger } from '@nestjs/common';
import nlp from 'compromise';
import * as natural from 'natural';

@Injectable()
export class CvHeuristicParserService {
  private readonly logger = new Logger(CvHeuristicParserService.name);

  private readonly monthMap: Record<string, number> = {
    janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
    juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11
  };

  public parse(rawText: string, cvId: number = 42, userId: number = 13, filePath: string = '') {
    this.logger.log('Starting unified general NLP heuristic parsing pipeline...');

    const cleanedText = this.cleanRawText(rawText);
    const sections = this.segmentText(cleanedText);
    const contactInfo = this.extractContactInfo(cleanedText);

    return {
      cv_id: cvId,
      user_id: userId,
      file_path: filePath,
      format: 'pdf',
      generated: true,
      last_updated: new Date(),
      full_name: contactInfo.fullName,
      profession: contactInfo.profession,
      email: contactInfo.email,
      phone: contactInfo.phone,
      fax: contactInfo.fax,
      address: contactInfo.address,
      skills: this.extractSkills(cleanedText),
      certifications: this.extractCertifications(sections.certification || ''),
      education: this.extractEducation(sections.education || ''),
      projects: this.extractProjects(sections.projects || ''),
      experiences: this.extractExperiences(sections.experience || ''),
    };
  }

  private cleanRawText(text: string): string {
    return text
      .replace(/-- \d+ of \d+ --/g, '') 
      .replace(/([-–])\s*\n\s*/g, '$1 ') 
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n') 
      .replace(/---\s*Page\s*\d+\s*---/gi, '') 
      .replace(/Page\s*\d+\s*---/gi, '');       
  }

  public segmentText(text: string): Record<string, string> {
    const lines = text.split('\n');
    const sections: Record<string, string[]> = {
      header: [],
      experience: [],
      certification: [],
      education: [],
      projects: [],
    };

    const headingSynonyms = {
      experience: ['expérience professionnelle', 'experiences', 'work history', 'career history', 'parcours professionnel'],
      certification: ['certification', 'certifications', 'certificats', 'credentials'],
      education: ['formation académique', 'formations', 'éducation', 'education', 'cursus'],
      projects: ['projets', 'projects', 'réalisations', 'key projects'],
    };

    let currentSection = 'header';

    for (const line of lines) {
      const trimmedLine = line.trim().toLowerCase();
      if (trimmedLine.length === 0) continue;

      let matchedSection: string | null = null;

      if (trimmedLine.length < 40) {
        for (const [sectionKey, synonyms] of Object.entries(headingSynonyms)) {
          for (const synonym of synonyms) {
            const score = natural.JaroWinklerDistance(trimmedLine, synonym);
            if (score > 0.88) {
              matchedSection = sectionKey;
              break;
            }
          }
          if (matchedSection) break;
        }
      }

      if (matchedSection) {
        currentSection = matchedSection;
      } else {
        sections[currentSection].push(line);
      }
    }

    const finalSections: Record<string, string> = {};
    for (const [key, linesArr] of Object.entries(sections)) {
      finalSections[key] = linesArr.join('\n').trim();
    }
    return finalSections;
  }

  private parseMonthYearToDate(monthStr: string, yearStr: string): Date {
    const month = this.monthMap[monthStr.toLowerCase().trim()] ?? 0;
    const year = parseInt(yearStr, 10);
    return new Date(Date.UTC(year, month, 1));
  }

  private parseYearToEndDate(yearStr: string): Date {
    const year = parseInt(yearStr, 10);
    return new Date(Date.UTC(year, 11, 31));
  }

  private extractContactInfo(text: string) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let nameIdx = 0;
    while (nameIdx < lines.length && (lines[nameIdx].match(/^\d+$/) || lines[nameIdx].length <= 2)) {
      nameIdx++;
    }

    const fullName = lines[nameIdx] || 'Unknown';
    const profession = lines[nameIdx + 1] || '';

    const addressMatch = text.match(/Adresse[:\s]*(.+?)(?=\n|Expérience|Formation|Certification|Projet|$)/i);
    let address = addressMatch ? addressMatch[1].trim() : '';

    if (!address) {
      const doc = nlp(text);
      const places = doc.places().out('array');
      address = places.length > 0 ? Array.from(new Set(places)).join(', ') : '';
    }

    const phoneMatch = text.match(/Tél\s*:\s*([\+\d\s]{8,})/i);
    const faxMatch = text.match(/Fax\s*:\s*([\+\d\s]{8,})/i);
    const emailMatch = text.match(/Email\s*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})/i);

    return {
      fullName,
      profession,
      phone: phoneMatch ? phoneMatch[1].trim() : '',
      fax: faxMatch ? faxMatch[1].trim() : '',
      email: emailMatch ? emailMatch[1].trim() : '',
      address: address || 'Not specified',
    };
  }

  private extractSkills(text: string): string[] {
    const skillsIndex = text.search(/Compétence[s]?\s*(?:supplémentaire[s]?)?|Skills/i);
    const searchBlock = skillsIndex !== -1 ? text.substring(skillsIndex) : text;
    const matchedSkills = new Set<string>();
    
    const techKeywords = [
      'LAN', 'WLAN', 'WAN', 'Ethernet', 'EIGRP', 'OSPF', 'RIP', 'Firewall', 'UTM', 
      'Web Application Firewall', 'Supervision', 'Monitoring', 'GSM', 'Linux', 
      'Windows', 'Android', 'Java', 'C++', 'SQL', 'PHP', 'Cisco', 'HP', 'Sophos', 
      'Solarwinds', 'Veeam', 'vSphere', 'Microsoft'
    ];

    for (const kw of techKeywords) {
      const escapedKw = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKw}\\b`, 'i');
      if (regex.test(searchBlock)) {
        matchedSkills.add(kw);
      }
    }
    return Array.from(matchedSkills);
  }

  private extractCertifications(section: string) {
    const rawLines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const combinedCerts: string[] = [];
    let buffer = '';

    const monthEndingRegex = /(Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+\d{4}\s*$/i;

    for (const line of rawLines) {
      if (line.match(/^\s*Certificat[s]?\s+Date\s+d’obtention\s*$/i)) continue;
      if (line.match(/^\d+$/)) continue;

      if (buffer === '') {
        buffer = line;
      } else {
        buffer += ' ' + line;
      }

      if (monthEndingRegex.test(line)) {
        combinedCerts.push(buffer);
        buffer = '';
      }
    }
    if (buffer !== '') combinedCerts.push(buffer);

    const certifications = [];
    const certParserRegex = /^(.+?)\s+(Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+(\d{4})\s*$/i;

    const knownProviders = ['Cisco', 'Fortinet', 'Sophos', 'Microsoft', 'Dell', 'HP', 'IBM', 'VMware', 'Barracuda', 'Forcepoint'];

    for (const certLine of combinedCerts) {
      const match = certLine.match(certParserRegex);
      if (match) {
        const certName = match[1].replace(/^(Certificat|Certification)\s+/gi, '').trim();
        
        // Recherche intelligente du provider n'importe où dans la ligne
        const foundProvider = knownProviders.find(p => new RegExp(p, 'i').test(certName));
        const provider = foundProvider ? foundProvider : 'Professional Issuer';

        certifications.push({
          cert_name: certName,
          provider,
          date: `${match[2]} ${match[3]}`,
          issue_date: this.parseMonthYearToDate(match[2], match[3]),
          expiry_date: null,
        });
      }
    }

    // Extraction adaptative de secours (Sans date explicite)
    if (certifications.length === 0) {
      const joinedCerts: string[] = [];
      for (const line of rawLines) {
        if (line.match(/^\s*Certificat[s]?\s+Date\s+d’obtention\s*$/i) || line.match(/^\d+$/)) continue;
        const cleanLine = line.replace(/^[:\s\-\–\.\*•]+/, '').trim();

        const matchKnownProvider = knownProviders.some(p => new RegExp(`^${p}`, 'i').test(cleanLine));
        if (matchKnownProvider || joinedCerts.length === 0) {
          joinedCerts.push(cleanLine);
        } else {
          joinedCerts[joinedCerts.length - 1] += ' ' + cleanLine;
        }
      }

      for (const certLine of joinedCerts) {
        if (certLine.length > 3) {
          const foundProvider = knownProviders.find(p => new RegExp(p, 'i').test(certLine));
          certifications.push({
            cert_name: certLine,
            provider: foundProvider ? foundProvider : 'Professional Issuer',
            date: null,
            issue_date: null,
            expiry_date: null,
          });
        }
      }
    }
    return certifications;
  }

  private extractEducation(section: string) {
    const rawLines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const education = [];
    let currentYearStr = '';
    let blockLines: string[] = [];

    for (const line of rawLines) {
      if (line.match(/^\s*(Année|Période)\s+Institution\s+Diplôme\s*$/i)) continue;

      const yearMatch = line.match(/^(\d{4}(?:\s*[-–]\s*\d{4})?)\b\s*(.*)$/);
      if (yearMatch) {
        if (currentYearStr !== '' && blockLines.length > 0) {
          education.push(this.parseEducationBlock(currentYearStr, blockLines));
        }
        currentYearStr = yearMatch[1].trim();
        blockLines = [];
        if (yearMatch[2].trim().length > 0) blockLines.push(yearMatch[2].trim());
      } else {
        blockLines.push(line);
      }
    }

    if (currentYearStr !== '' && blockLines.length > 0) {
      education.push(this.parseEducationBlock(currentYearStr, blockLines));
    }
    return education;
  }

  private parseEducationBlock(yearStr: string, lines: string[]) {
    const fullBlockText = lines.join(' ').replace(/\s+/g, ' ').trim();
    const degreeMarkerRegex = /\b(Diplôme|Licence|Baccalauréat|Classes préparatoires|Classes|Ingénieur|Master|Doctorat|Option|Technicien)\b/i;
    const match = fullBlockText.match(degreeMarkerRegex);

    let institution = '';
    let degree = '';

    if (match && match.index !== undefined) {
      institution = fullBlockText.substring(0, match.index).trim();
      degree = fullBlockText.substring(match.index).trim();
    } else {
      institution = fullBlockText;
    }

    institution = institution.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();
    degree = degree.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();

    let startYear: number | null = null;
    let endYear = 2026;
    const rangeParts = yearStr.split(/[-–]/);

    if (rangeParts.length >= 2) {
      startYear = parseInt(rangeParts[0].trim(), 10);
      endYear = parseInt(rangeParts[1].trim(), 10);
    } else {
      endYear = parseInt(yearStr, 10);
    }

    return {
      degree,
      institution,
      year: yearStr,
      start_year: startYear,
      end_year: endYear,
    };
  }

  private extractProjects(section: string) {
    const rawLines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const combinedLines: string[] = [];

    const projectDateRegex = /^(?:(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+\d{4}(?:\s*[-–]\s*(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+\d{4})?|\d{4}(?:\s*[-–]\s*\d{4})?)\b/i;

    // Accumulation des lignes multi-lignes pour les projets
    for (const line of rawLines) {
      if (line.match(/^\s*Année\s+Client\s+Projet\s*$/i)) continue;
      if (line.match(/Compétence[s]?\s*(?:supplémentaire[s]?)?|Skills/i)) break;

      if (line.match(projectDateRegex)) {
        combinedLines.push(line);
      } else {
        if (combinedLines.length > 0) {
          combinedLines[combinedLines.length - 1] += ' ' + line;
        } else {
          combinedLines.push(line);
        }
      }
    }

    const projects = [];
    const actionKeywords = [
      'Mise en place', 'Mise à niveau', 'Mise a niveau', 'Migration', 
      'Réalisation', 'Implémentation', 'Audit', 'Conception', 
      'Livraison', 'Installation', 'Acquisition', 'Renouvellement', 
      'Fourniture', 'la fourniture', 'Location', 'Câblage', 'Mise en service'
    ];
    const splitRegex = new RegExp(`\\b(${actionKeywords.join('|')})\\b`, 'i');

    for (const line of combinedLines) {
      const yearMatch = line.match(projectDateRegex);
      if (yearMatch) {
        const dateStr = yearMatch[0].trim();
        const textPayload = line.substring(dateStr.length).trim();

        let startYear = 2026;
        let endYear = 2026;
        const yearsFound = dateStr.match(/\b\d{4}\b/g);

        if (yearsFound) {
          if (yearsFound.length >= 2) {
            startYear = parseInt(yearsFound[0], 10);
            endYear = parseInt(yearsFound[1], 10);
          } else {
            startYear = parseInt(yearsFound[0], 10);
            endYear = startYear;
          }
        }

        const endDate = this.parseYearToEndDate(endYear.toString());
        let client = textPayload;
        let description = '';

        const actionMatch = textPayload.match(splitRegex);
        if (actionMatch && actionMatch.index !== undefined) {
          client = textPayload.substring(0, actionMatch.index).trim();
          description = textPayload.substring(actionMatch.index).trim();
        } else {
          const words = textPayload.split(/\s+/);
          if (words.length > 3) {
            client = words.slice(0, 3).join(' ');
            description = words.slice(3).join(' ');
          }
        }

        client = client.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();
        description = description.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();

        projects.push({
          name: client || 'Client Inconnu',
          client: client || 'Client Inconnu',
          role: 'Consultant / Intervenant',
          description: description || client,
          end_date: endDate,
          start_date: null,
          year: dateStr,
        });
      }
    }
    return projects;
  }

  private extractExperiences(section: string) {
    const rawLines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const combinedLines: string[] = [];
    
    const dateStartRegex = /^(Depuis|Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|\b[a-zA-Zà-ÿ]+\s+\d{4}|\b\d{4}\s*[-–]\s*\d{4}|\b\d{4}\b)/i;

    for (const line of rawLines) {
      if (line.match(/^\s*Période\s+Organisme\s+Fonction\s+occupée\s*$/i)) continue;
      if (dateStartRegex.test(line)) {
        combinedLines.push(line);
      } else {
        if (combinedLines.length > 0) {
          combinedLines[combinedLines.length - 1] += ' ' + line;
        } else {
          combinedLines.push(line);
        }
      }
    }

    const experiences = [];
    const dateRangeRegex = /^((?:Depuis\s+)?[a-zA-Zà-ÿ]+\s+\d{4}(?:\s*[-–]\s*[a-zA-Zà-ÿ]+\s+\d{4})?|\b\d{4}\s*[-–]\s*\d{4}\b|\b\d{4}\b)\s+(.+)$/i;

    for (const line of combinedLines) {
      const match = line.match(dateRangeRegex);
      if (match) {
        const dateRangeStr = match[1].trim();
        const remaining = match[2].trim();

        let company = 'Inconnu';
        let role = remaining;

        const parts = remaining.split(/\t|\s{2,}/).map(p => p.trim()).filter(p => p.length > 0);
        if (parts.length >= 2) {
          company = parts[0];
          role = parts.slice(1).join(' ');
        } else {
          const words = remaining.split(/\s+/);
          company = words.slice(0, 2).join(' ');
          role = words.slice(2).join(' ');
        }

        let start_date: Date | null = null;
        let end_date: Date | null = null;

        if (dateRangeStr.toLowerCase().startsWith('depuis')) {
          const parts = dateRangeStr.replace(/depuis/i, '').trim().split(/\s+/);
          if (parts.length >= 2) start_date = this.parseMonthYearToDate(parts[0], parts[1]);
        } else {
          const parts = dateRangeStr.split(/[-–]/);
          if (parts.length >= 2) {
            const startParts = parts[0].trim().split(/\s+/);
            const endParts = parts[1].trim().split(/\s+/);
            
            if (startParts.length === 1 && startParts[0].match(/^\d{4}$/)) {
              start_date = this.parseYearToEndDate(startParts[0]);
            } else if (startParts.length >= 2) {
              start_date = this.parseMonthYearToDate(startParts[0], startParts[1]);
            }

            if (endParts.length === 1 && endParts[0].match(/^\d{4}$/)) {
              end_date = this.parseYearToEndDate(endParts[0]);
            } else if (endParts.length >= 2) {
              end_date = this.parseMonthYearToDate(endParts[0], endParts[1]);
            }
          } else {
            const singleParts = dateRangeStr.trim().split(/\s+/);
            if (singleParts.length === 1 && singleParts[0].match(/^\d{4}$/)) {
              start_date = this.parseYearToEndDate(singleParts[0]);
            } else if (singleParts.length >= 2) {
              start_date = this.parseMonthYearToDate(singleParts[0], singleParts[1]);
            }
          }
        }

        experiences.push({
          company,
          role,
          period: dateRangeStr,
          start_date,
          end_date,
          description: role,
        });
      }
    }
    return experiences;
  }
}