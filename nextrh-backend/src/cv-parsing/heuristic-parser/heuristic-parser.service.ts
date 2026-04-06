import { Injectable } from '@nestjs/common';

@Injectable()
export class HeuristicParserService {
    
   extractContactInfo(header: string, fullText: string) {
  let cleanHeader = header
    .replace(/^[\d\s\W]+/, '') 
    .replace(/\s+/g, ' ')
    .trim();

  // EMAIL
  let email = '';
  const emailRegex = /([a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,4})\b/i;
  const emailMatch = fullText.match(emailRegex);

  if (emailMatch) {
    email = emailMatch[1].replace(/\s+/g, '').toLowerCase();
  }

  if (!email) {
    const compressed = fullText.replace(/\s+/g, '');
    const matchCompressed = compressed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}/i);
    if (matchCompressed) email = matchCompressed[0].toLowerCase();
  }
  email = email.replace(/(adresse|tél|fax|exp|form).*$/i, '');

  // NUMEROS
  const extractNum = (reg: RegExp) => {
    const m = fullText.match(reg);
    return m ? m[1].replace(/[^\d+]/g, '').trim() : ''; 
  };
  const rawPhone = extractNum(/(?:Tél|Tel|Port)[:\s]*([\+\d\s]{8,})/i);
  const rawFax = extractNum(/Fax[:\s]*([\+\d\s]{8,})/i);

  // NOM & PROFESSION
  let nameProfPart = cleanHeader.split(/Tél|Email|Fax|Adresse/i)[0].trim();
  const profKeywords = /(Diplôme|Chef|Ingénieur|Manager|Consultant|Architecte|Directeur|Contract|Expert|Analyste|Technicien|Responsable|Licence|Baccalauréat)/i;
  let name = nameProfPart;
  let profession = "";
  const splitMatch = nameProfPart.match(new RegExp(`^(.*?)\\s*(${profKeywords.source}.*)$`, 'i'));
  if (splitMatch) {
    name = splitMatch[1].trim();
    profession = splitMatch[2].trim();
  }

  name = name.replace(/^([A-Z])\s([a-z])/, '$1$2');
  profession = profession.replace(/\s(et|de|en|–|-)$/i, '').trim();

  const formatTn = (num: string) => {
    if (num.length < 8) return num;
    if (num.includes('216')) return num.replace(/(\+?216)(\d{2})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    return num.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  };

  return {
    name: name.replace(/\s{2,}/g, ' ').trim(),
    profession: profession.replace(/^[–\-\s]+/, '').trim(),
    phone: formatTn(rawPhone),
    fax: formatTn(rawFax),
    email: email,
    address: fullText.match(/Adresse[:\s]*(.+?)(?=\n|Expérience|Formation|Certification|Projet|$)/i)?.[1]?.trim() || '',
  };
}

 extractExperience(section: string) {
  if (!section) return [];

  // 1. RECOLLER LES DATES CASSÉES (ex: "20 20" -> "2020")
  // Cette regex cherche 2 chiffres, un espace, et 2 chiffres pour les transformer en année
  let normalizedSection = section.replace(/(\b[12]\d)\s+(\d{2}\b)/g, '$1$2');

  const months = "Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre";

  // 2. REGEX GÉNÉRALISÉE (Mois, Années, Depuis, etc.)
  const dateRegex = new RegExp(
    `(` +
    `(?:Depuis\\s+)?(?:(?:${months})\\s+)?\\d{4}(?:\\s*[-–]\\s*(?:(?:${months})\\s+)?(?:\\d{4}|Présent|Aujourd'hui))?` +
    `|` +
    `\\b\\d{4}\\s*[-–]\\s*\\d{4}\\b` +
    `)`,
    'gi'
  );

  // Nettoyage des en-têtes
  normalizedSection = normalizedSection.replace(/Expérience[s]?|Période|Organisme|Fonction occupée/gi, '').trim();

  const matches = Array.from(normalizedSection.matchAll(dateRegex));
  const experiences = [];

  for (let i = 0; i < matches.length; i++) {
    const period = matches[i][0].trim();
    const startPos = matches[i].index || 0;
    const nextMatchPos = matches[i + 1] ? matches[i + 1].index : normalizedSection.length;

    // Bloc de texte après la date
    const block = normalizedSection.substring(startPos + period.length, nextMatchPos).trim();

    if (block.length < 2) continue;

    // 3. SÉPARATION INTELLIGENTE ENTREPRISE / RÔLE
    let company = "Inconnu";
    let role = block;

    // Liste des entreprises connues pour aider le découpage (optionnel mais efficace)
    const knownCompanies = ["Next Step IT", "S2I", "WAYCON", "Ooredoo", "Tunisie Telecom"];
    const foundCompany = knownCompanies.find(c => block.toLowerCase().includes(c.toLowerCase()));

    if (block.includes("  ")) {
      // Priorité aux doubles espaces (colonnes)
      const parts = block.split(/\s{2,}/).filter(p => p.trim().length > 0);
      company = parts[0];
      role = parts.slice(1).join(' ');
    } else if (foundCompany) {
      // Si une entreprise connue est détectée sans double espace
      company = foundCompany;
      role = block.replace(new RegExp(foundCompany, 'i'), '').trim();
    } else {
      // Fallback : on prend les deux premiers mots comme entreprise
      const words = block.split(' ');
      company = words.slice(0, 2).join(' ');
      role = words.slice(2).join(' ');
    }

    experiences.push({
      period: period,
      company: company.trim(),
      role: role.replace(/\s+/g, ' ').trim() || company.trim()
    });
  }

  return experiences;
}
 extractCertifications(section: string) {
  if (!section) return [];

  // 1. Nettoyage initial
  let content = section
    .replace(/\bCertification[s]?\b/gi, '')
    .replace(/Certificat[s]?/gi, '')
    .replace(/Date d’obtention/gi, '')
    .trim();

  const months = "Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre";
  const dateRegex = new RegExp(`((?:${months})\\s+\\d{4})`, 'gi');
  const matches = Array.from(content.matchAll(dateRegex));
  const certs = [];

  if (matches.length > 0) {
    // --- MODE DATE (Anouar, Eya) : Inchangé car il fonctionne bien ---
    let lastIndex = 0;
    for (let i = 0; i < matches.length; i++) {
      const dateStr = matches[i][0];
      const datePos = matches[i].index || 0;
      let certName = content.substring(lastIndex, datePos).trim();
      certName = certName.replace(/^(Certificat|Date d’obtention)\s+/gi, '').replace(/^[:\s\-\–\d\.\*•]+/, '').trim();
      if (certName.length > 2) certs.push({ certName, date: dateStr });
      lastIndex = datePos + dateStr.length;
    }
  } else {
    // --- MODE LISTE (Jazil) : Logique de détection par "Début de ligne" ---
    
    // 1. On définit ce qui ressemble à un DEBUT de certification
    // - Un code technique (ex: IMHV0409WBTT)
    // - Un mot-clé fort (Associate, DELL, HP, IBM, Microsoft, etc.)
    const itemStartMarkers = [
      'Associate', 'DELL', 'CFFT', 'CQCS', 'CSSAT', 'DBSSTT', 'DPVS', 
      'DPES', 'DRHS', 'IMHV', 'NTO', 'VMPSS', 'DOSM', 'DROC', 
      'ASE', 'AIS', 'Certifié', 'Microsoft', 'Network Attached'
    ];

    // 2. On protège le texte en insérant un marqueur unique (|||) seulement devant les débuts réels
    let processed = content;
    itemStartMarkers.forEach(marker => {
      // On ne remplace que si le marqueur est précédé d'un espace (pas au milieu d'un mot)
      const regex = new RegExp(`\\s+(${marker})`, 'g');
      processed = processed.replace(regex, '|||$1');
    });

    // 3. On découpe par notre marqueur
    const lines = processed.split('|||').filter(l => l.trim().length > 5);
    
    for (let line of lines) {
      let cleanLine = line.replace(/\s+/g, ' ').trim();

      // Nettoyage des caractères de bordure
      cleanLine = cleanLine.replace(/^[:\s\-\–\.\*•]+/, '').trim();

      if (cleanLine.length > 5) {
        certs.push({ 
          certName: cleanLine, 
          date: "Date non spécifiée" 
        });
      }
    }
  }

  return certs;
}
   extractEducation(section: string) {
  if (!section) return [];

  // 1. Nettoyage et arrêt forcé si "Projets" commence
  // On remplace d'abord les titres de section
  let cleanSection = section.replace(/Formation[s]?|Éducation|Cursus|Parcours\s*académique/gi, '').trim();
  
  // FIX JAZIL : On coupe dès qu'on voit le mot "Projets" (insensible à la casse avec bordure de mot)
  const projectsIndex = cleanSection.search(/\bProjets\b/i);
  if (projectsIndex !== -1) {
    cleanSection = cleanSection.substring(0, projectsIndex);
  }

  // 2. REGEX pour les dates (Année ou Plage d'années)
  const yearRegex = /(\b\d{4}\s*[-–]\s*\d{4}\b|\b\d{4}\b)/g;
  const matches = Array.from(cleanSection.matchAll(yearRegex));
  const education = [];

  for (let i = 0; i < matches.length; i++) {
    const year = matches[i][0].trim();
    const startPos = matches[i].index || 0;
    const nextMatchPos = matches[i + 1] ? matches[i + 1].index : cleanSection.length;

    // Texte entre cette année et la suivante
    const content = cleanSection.substring(startPos + year.length, nextMatchPos).trim();
    if (content.length < 5) continue;

    // 3. SÉPARATION INTELLIGENTE (Institution vs Diplôme)
    // On définit les mots-clés qui commencent TOUJOURS un diplôme
    const degreeMarkers = /(Licence|Diplôme|Baccalauréat|Ingénieur|Master|Technicien|Classes préparatoires|Brevet|Études)/i;
    
    let institution = "";
    let degree = "";

    const markerMatch = content.match(degreeMarkers);

    if (markerMatch && markerMatch.index !== undefined) {
      // Tout ce qui est AVANT le mot-clé (ex: Licence) est l'Institution
      institution = content.substring(0, markerMatch.index).trim();
      // Tout ce qui est APRÈS (incluant le mot-clé) est le Diplôme
      degree = content.substring(markerMatch.index).trim();
    } else {
      // Fallback si aucun mot-clé n'est trouvé : séparation par double espace
      const parts = content.split(/\s{2,}/);
      institution = parts[0] || "Inconnu";
      degree = parts.slice(1).join(' ') || content;
    }

    // Nettoyage final pour Anouar (recoller les morceaux comme "de Tunis")
    // On enlève les retours à la ligne et on normalise les espaces
    education.push({
      year: year,
      institution: institution.replace(/\n/g, ' ').replace(/\s+/g, ' ').replace(/[\.\-–]$/, '').trim(),
      degree: degree.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
    });
  }

  return education;
}
 extractProjects(section: string) {
  if (!section) return [];

  // 1. RÉPARATION DES MOTS ET NORMALISATION DES PUCES
  let clean = section
    .replace(/O\s+o\s+redoo/gi, 'Ooredoo')
    .replace(/M\s+ise/gi, 'Mise')
    .replace(/C\s+âblage/gi, 'Câblage')
    .replace(/A\s+cquisition/gi, 'Acquisition')
    .replace(/L\s+ivraison/gi, 'Livraison')
    .replace(/S\s+olution/gi, 'Solution')
    .replace(/(\b[A-Z])\s+([a-z])/g, '$1$2')
    // On transforme TOUTES les puces possibles en un séparateur unique |||
    .replace(/[•\t\*]/g, '|||') 
    .replace(/\s+/g, ' ')
    .trim();

  // Nettoyage des titres
  clean = clean.replace(/^Projet[s]?\s*/i, '').replace(/Année Client Projet/gi, '').trim();

  const yearRegex = /\b((?:19|20)\d{2}(?:\s*[-–]\s*(?:19|20)\d{2})?)\b/g;
  const matches = Array.from(clean.matchAll(yearRegex));
  const projects = [];
  const blacklist = /Tél|Fax|Email|Adresse|@|http|www|Chef de projet/i;

  // Mots-clés pour séparer Client / Description
  const actionKeywords = ["Mise en place", "Mise à niveau", "Migration", "Réalisation", "Implémentation", "Audit", "Conception", "Livraison", "Installation", "Acquisition", "Renouvellement", "Câblage", "fourniture", "Location", "Maintenance", "Étude", "Déploiement", "Mise", "L'installation"];
  const separatorRegex = new RegExp(`[:]|\\b(${actionKeywords.join('|')})\\b`, 'i');

  if (matches.length > 0) {
    // ==========================================
    // MODE A : AVEC DATES (Amal, Anouar, Eya)
    // ==========================================
    for (let i = 0; i < matches.length; i++) {
      const year = matches[i][0];
      const startPos = matches[i].index || 0;
      const nextMatchPos = (i + 1 < matches.length) ? matches[i + 1].index : clean.length;

      let content = clean.substring(startPos + year.length, nextMatchPos).trim();
      if (content.length < 3 || blacklist.test(content)) continue;

      content = content.replace(/^[:\s\-\–|||]+/, '').trim();
      let client = "Inconnu", description = content;

      const symbolMatch = content.match(/\s*[:]\s*/);
      const actionMatch = content.match(separatorRegex);
      const sIdx = symbolMatch ? symbolMatch.index : -1;
      const aIdx = actionMatch ? actionMatch.index : -1;

      let splitIndex = -1;
      if (sIdx !== -1 && (aIdx === -1 || sIdx < aIdx)) splitIndex = sIdx;
      else if (aIdx !== -1) splitIndex = aIdx;

      if (splitIndex !== -1) {
        client = content.substring(0, splitIndex).trim();
        description = content.substring(splitIndex).trim().replace(/^[:\s]+/, '').trim();
      } else {
        const words = content.split(' ');
        client = words.slice(0, 2).join(' ');
        description = words.slice(2).join(' ');
      }

      client = client.replace(/\s(la|le|l'|au|du|en|et|Mise|a|à)$/i, '').trim();
      if (description.toLowerCase().startsWith(client.toLowerCase())) {
          description = description.substring(client.length).replace(/^[:\s\-\–\.]+/g, '').trim();
      }
      //added
      const skillStopKeywords = /Compétence[s]?\s*(?:supplémentaire[s]?)?|Skills/i;
      const skillIndex = description.search(skillStopKeywords);
      if (skillIndex !== -1) {
        description = description.substring(0, skillIndex).trim();
      } //added
      projects.push({ year, client: client || "Inconnu", description: description.trim() });
    }
  } else {
    // ==========================================
    // MODE B : SANS DATES (Jazil)
    // ==========================================
    // On découpe par le séparateur ||| qu'on a créé à partir des puces
    const items = clean.split('|||').map(item => item.trim()).filter(item => item.length > 5);
    
    for (let line of items) {
      if (blacklist.test(line)) continue;

      let client = "Inconnu";
      let description = line;

      // Cas Jazil : "Description pour le compte de CLIENT"
      if (line.toLowerCase().includes("pour le compte de")) {
        const parts = line.split(/pour le compte de/i);
        description = parts[0].trim();
        client = parts[1].trim();
      } 
      // Sinon on cherche un ":" ou un verbe d'action
      else {
        const splitMatch = line.match(separatorRegex);
        if (splitMatch && splitMatch.index !== undefined) {
          client = line.substring(0, splitMatch.index).trim();
          description = line.substring(splitMatch.index).trim();
        }
      }

      // Nettoyage final
      if (description.toLowerCase().startsWith(client.toLowerCase())) {
          description = description.substring(client.length).replace(/^[:\s\-\–\.]+/g, '').trim();
      }

      projects.push({
        year: "Non spécifiée",
        client: client.replace(/^[:\s\-\–\.]+|[:\s\-\–\.]+$/g, '').trim(),
        description: description.replace(/^[:\s]+/, '').trim()
      });
    }
  }

  return projects;
}
 extractSkills(section: string) {
  if (!section || section.trim().length < 5) return [];

  // 1. Nettoyage initial et normalisation des puces
  let content = section
    .replace(/Compétence[s]?\s*(?:supplémentaire[s]?)?[:\s]*/i, '')
    .replace(/[•\t\*]/g, ', ') // Transforme les puces en virgules
    .trim();

  if (!content.includes(':')) {
    const items = content.split(/[,;\n]|\s{2,}/).map(s => s.trim()).filter(s => s.length > 2);
    return items.length > 0 ? [{ category: "Technique", items }] : [];
  }

  const skills = [];
  const parts = content.split(':');

  for (let i = 0; i < parts.length - 1; i++) {
    let category = "";
    let itemsText = "";

    if (i === 0) {
      category = parts[0].trim();
    } else {
      const prevText = parts[i];
      // FIX : Plage de caractères corrigée [A-ZÀ-ÖØ-ß]
      const catMatch = prevText.match(/([A-ZÀ-ÖØ-ß][a-zà-ÿ\s’'–]{2,30})$/);
      category = catMatch ? catMatch[1].trim() : "Compétence";
    }

    itemsText = parts[i + 1];

    // FIX : Plage de caractères corrigée ici aussi
    if (i < parts.length - 2) {
      itemsText = itemsText.replace(/([A-ZÀ-ÖØ-ß][a-zà-ÿ\s’'–]{2,30})$/, '');
    }

    const items = itemsText
      .split(/[,;\/\n]|\s{2,}/)
      .map(item => item.trim())
      .filter(item => item.length > 1 && !item.match(/^[–\-]$/));

    if (items.length > 0) {
      skills.push({
        category: category.replace(/^[,\s\W]+/, '').trim(),
        items: Array.from(new Set(items))
      });
    }
  }

  return skills;
}}
