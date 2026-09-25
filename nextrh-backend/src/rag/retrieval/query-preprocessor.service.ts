import { Injectable, Logger } from '@nestjs/common';

// Dictionnaire d'expansion des acronymes IT et RH
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
export class QueryPreprocessorService {
  private readonly logger = new Logger(QueryPreprocessorService.name);

  /**
   * Prétraite la requête utilisateur brute avant vectorisation :
   * 1. Passage en minuscules et suppression de la ponctuation / caractères spéciaux
   * 2. Expansion des acronymes connus (conserve le terme court + la version développée)
   * 3. Reconstitution d'une chaîne nettoyée et enrichie
   */
  preprocess(question: string): { cleaned: string; expandedTerms: string[] } {
    const original = question?.trim() || '';
    if (!original) {
      return { cleaned: '', expandedTerms: [] };
    }

    // Normalisation : minuscules et suppression des caractères non alphanumériques
    const normalized = original
      .toLowerCase()
      .replace(/[^a-zàâçéèêëîïôûùüÿñæœ0-9\s]/gi, ' ')
      .trim();

    const tokens = normalized.split(/\s+/).filter((t) => t.length > 0);

    const expandedTerms: string[] = [];
    const processedTokens: string[] = [];

    for (const token of tokens) {
      // Si le mot est un acronyme connu, on garde à la fois l'acronyme et sa forme développée
      if (ACRONYM_MAP[token]) {
        expandedTerms.push(ACRONYM_MAP[token]);
        processedTokens.push(token);             // Terme original (ex: 'aws')
        processedTokens.push(ACRONYM_MAP[token]); // Forme développée (ex: 'Amazon Web Services')
        this.logger.debug(`Expanded acronym: "${token}" → "${ACRONYM_MAP[token]}"`);
      } else {
        processedTokens.push(token);
      }
    }

    const cleaned = processedTokens.length > 0 ? processedTokens.join(' ') : original;

    this.logger.debug(`Query preprocessed: "${original}" → "${cleaned}"`);

    return { cleaned, expandedTerms };
  }

  /**
   * Retourne les tokens nettoyés ayant une longueur > 1
   */
  getMeaningfulTokens(question: string): string[] {
    const { cleaned } = this.preprocess(question);
    return cleaned.split(/\s+/).filter((t) => t.length > 1);
  }
}