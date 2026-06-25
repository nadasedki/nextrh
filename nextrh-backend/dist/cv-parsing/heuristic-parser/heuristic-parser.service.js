"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeuristicParserService = void 0;
const common_1 = require("@nestjs/common");
let HeuristicParserService = class HeuristicParserService {
    extractContactInfo(header, fullText) {
        let cleanHeader = header
            .replace(/^[\d\s\W]+/, '')
            .replace(/\s+/g, ' ')
            .trim();
        let email = '';
        const emailRegex = /([a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,4})\b/i;
        const emailMatch = fullText.match(emailRegex);
        if (emailMatch) {
            email = emailMatch[1].replace(/\s+/g, '').toLowerCase();
        }
        if (!email) {
            const compressed = fullText.replace(/\s+/g, '');
            const matchCompressed = compressed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}/i);
            if (matchCompressed)
                email = matchCompressed[0].toLowerCase();
        }
        email = email.replace(/(adresse|tél|fax|exp|form).*$/i, '');
        const extractNum = (reg) => {
            const m = fullText.match(reg);
            return m ? m[1].replace(/[^\d+]/g, '').trim() : '';
        };
        const rawPhone = extractNum(/(?:Tél|Tel|Port)[:\s]*([\+\d\s]{8,})/i);
        const rawFax = extractNum(/Fax[:\s]*([\+\d\s]{8,})/i);
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
        const formatTn = (num) => {
            if (num.length < 8)
                return num;
            if (num.includes('216'))
                return num.replace(/(\+?216)(\d{2})(\d{3})(\d{3})/, '$1 $2 $3 $4');
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
    extractExperience(section) {
        if (!section)
            return [];
        let normalizedSection = section.replace(/(\b[12]\d)\s+(\d{2}\b)/g, '$1$2');
        const months = "Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre";
        const dateRegex = new RegExp(`(` +
            `(?:Depuis\\s+)?(?:(?:${months})\\s+)?\\d{4}(?:\\s*[-–]\\s*(?:(?:${months})\\s+)?(?:\\d{4}|Présent|Aujourd'hui))?` +
            `|` +
            `\\b\\d{4}\\s*[-–]\\s*\\d{4}\\b` +
            `)`, 'gi');
        normalizedSection = normalizedSection.replace(/Expérience[s]?|Période|Organisme|Fonction occupée/gi, '').trim();
        const matches = Array.from(normalizedSection.matchAll(dateRegex));
        const experiences = [];
        for (let i = 0; i < matches.length; i++) {
            const period = matches[i][0].trim();
            const startPos = matches[i].index || 0;
            const nextMatchPos = matches[i + 1] ? matches[i + 1].index : normalizedSection.length;
            const block = normalizedSection.substring(startPos + period.length, nextMatchPos).trim();
            if (block.length < 2)
                continue;
            let company = "Inconnu";
            let role = block;
            const knownCompanies = ["Next Step IT", "S2I", "WAYCON", "Ooredoo", "Tunisie Telecom"];
            const foundCompany = knownCompanies.find(c => block.toLowerCase().includes(c.toLowerCase()));
            if (block.includes("  ")) {
                const parts = block.split(/\s{2,}/).filter(p => p.trim().length > 0);
                company = parts[0];
                role = parts.slice(1).join(' ');
            }
            else if (foundCompany) {
                company = foundCompany;
                role = block.replace(new RegExp(foundCompany, 'i'), '').trim();
            }
            else {
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
    extractCertifications(section) {
        if (!section)
            return [];
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
            let lastIndex = 0;
            for (let i = 0; i < matches.length; i++) {
                const dateStr = matches[i][0];
                const datePos = matches[i].index || 0;
                let certName = content.substring(lastIndex, datePos).trim();
                certName = certName.replace(/^(Certificat|Date d’obtention)\s+/gi, '').replace(/^[:\s\-\–\d\.\*•]+/, '').trim();
                if (certName.length > 2)
                    certs.push({
                        certName: certName,
                        provider: this.inferProvider(certName),
                        issueDate: this.parseFrenchDate(dateStr),
                    });
                lastIndex = datePos + dateStr.length;
            }
        }
        else {
            const itemStartMarkers = [
                'Associate', 'DELL', 'CFFT', 'CQCS', 'CSSAT', 'DBSSTT', 'DPVS',
                'DPES', 'DRHS', 'IMHV', 'NTO', 'VMPSS', 'DOSM', 'DROC',
                'ASE', 'AIS', 'Certifié', 'Microsoft', 'Network Attached'
            ];
            let processed = content;
            itemStartMarkers.forEach(marker => {
                const regex = new RegExp(`\\s+(${marker})`, 'g');
                processed = processed.replace(regex, '|||$1');
            });
            const lines = processed.split('|||').filter(l => l.trim().length > 5);
            for (let line of lines) {
                let cleanLine = line.replace(/\s+/g, ' ').trim();
                cleanLine = cleanLine.replace(/^[:\s\-\–\.\*•]+/, '').trim();
                if (cleanLine.length > 5) {
                    certs.push({
                        certName: cleanLine,
                        provider: this.inferProvider(cleanLine),
                        issueDate: "Date non spécifiée"
                    });
                }
            }
        }
        return certs;
    }
    parseFrenchDate(dateStr) {
        if (!dateStr || dateStr.toLowerCase().includes('non spécifiée'))
            return null;
        const months = {
            janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
            juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
        };
        const parts = dateStr.toLowerCase().split(/\s+/);
        const year = parts.find((p) => /\d{4}/.test(p));
        const monthName = parts.find((p) => months[p] !== undefined);
        if (year) {
            const m = monthName ? months[monthName] : 0;
            return new Date(parseInt(year), m, 1);
        }
        return null;
    }
    inferProvider(certName) {
        const name = certName.toLowerCase();
        if (name.includes('cisco') || name.includes('ccna') || name.includes('ccnp'))
            return 'Cisco';
        if (name.includes('fortinet') || name.includes('nse'))
            return 'Fortinet';
        if (name.includes('microsoft') || name.includes('azure') || name.includes('mcsa'))
            return 'Microsoft';
        if (name.includes('aws') || name.includes('amazon'))
            return 'AWS';
        if (name.includes('dell'))
            return 'DELL';
        if (name.includes('hp'))
            return 'HP';
        return 'Professional Issuer';
    }
    extractEducation(section) {
        if (!section)
            return [];
        let cleanSection = section.replace(/Formation[s]?|Éducation|Cursus|Parcours\s*académique/gi, '').trim();
        const projectsIndex = cleanSection.search(/\bProjets\b/i);
        if (projectsIndex !== -1) {
            cleanSection = cleanSection.substring(0, projectsIndex);
        }
        const yearRegex = /(\b\d{4}\s*[-–]\s*\d{4}\b|\b\d{4}\b)/g;
        const matches = Array.from(cleanSection.matchAll(yearRegex));
        const education = [];
        for (let i = 0; i < matches.length; i++) {
            const year = matches[i][0].trim();
            const startPos = matches[i].index || 0;
            const nextMatchPos = matches[i + 1] ? matches[i + 1].index : cleanSection.length;
            const content = cleanSection.substring(startPos + year.length, nextMatchPos).trim();
            if (content.length < 5)
                continue;
            const degreeMarkers = /(Licence|Diplôme|Baccalauréat|Ingénieur|Master|Technicien|Classes préparatoires|Brevet|Études)/i;
            let institution = "";
            let degree = "";
            const markerMatch = content.match(degreeMarkers);
            if (markerMatch && markerMatch.index !== undefined) {
                institution = content.substring(0, markerMatch.index).trim();
                degree = content.substring(markerMatch.index).trim();
            }
            else {
                const parts = content.split(/\s{2,}/);
                institution = parts[0] || "Inconnu";
                degree = parts.slice(1).join(' ') || content;
            }
            education.push({
                year: year,
                institution: institution.replace(/\n/g, ' ').replace(/\s+/g, ' ').replace(/[\.\-–]$/, '').trim(),
                degree: degree.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
            });
        }
        return education;
    }
    extractProjects(section) {
        if (!section)
            return [];
        let clean = section
            .replace(/O\s+o\s+redoo/gi, 'Ooredoo')
            .replace(/M\s+ise/gi, 'Mise')
            .replace(/C\s+âblage/gi, 'Câblage')
            .replace(/A\s+cquisition/gi, 'Acquisition')
            .replace(/L\s+ivraison/gi, 'Livraison')
            .replace(/S\s+olution/gi, 'Solution')
            .replace(/(\b[A-Z])\s+([a-z])/g, '$1$2')
            .replace(/[•\t\*]/g, '|||')
            .replace(/\s+/g, ' ')
            .trim();
        clean = clean.replace(/^Projet[s]?\s*/i, '').replace(/Année Client Projet/gi, '').trim();
        const yearRegex = /\b((?:19|20)\d{2}(?:\s*[-–]\s*(?:19|20)\d{2})?)\b/g;
        const matches = Array.from(clean.matchAll(yearRegex));
        const projects = [];
        const blacklist = /Tél|Fax|Email|Adresse|@|http|www|Chef de projet/i;
        const actionKeywords = ["Mise en place", "Mise à niveau", "Migration", "Réalisation", "Implémentation", "Audit", "Conception", "Livraison", "Installation", "Acquisition", "Renouvellement", "Câblage", "fourniture", "Location", "Maintenance", "Étude", "Déploiement", "Mise", "L'installation"];
        const separatorRegex = new RegExp(`[:]|\\b(${actionKeywords.join('|')})\\b`, 'i');
        if (matches.length > 0) {
            for (let i = 0; i < matches.length; i++) {
                const year = matches[i][0];
                const startPos = matches[i].index || 0;
                const nextMatchPos = (i + 1 < matches.length) ? matches[i + 1].index : clean.length;
                let content = clean.substring(startPos + year.length, nextMatchPos).trim();
                if (content.length < 3 || blacklist.test(content))
                    continue;
                content = content.replace(/^[:\s\-\–|||]+/, '').trim();
                let client = "Inconnu", description = content;
                const symbolMatch = content.match(/\s*[:]\s*/);
                const actionMatch = content.match(separatorRegex);
                const sIdx = symbolMatch ? symbolMatch.index : -1;
                const aIdx = actionMatch ? actionMatch.index : -1;
                let splitIndex = -1;
                if (sIdx !== -1 && (aIdx === -1 || sIdx < aIdx))
                    splitIndex = sIdx;
                else if (aIdx !== -1)
                    splitIndex = aIdx;
                if (splitIndex !== -1) {
                    client = content.substring(0, splitIndex).trim();
                    description = content.substring(splitIndex).trim().replace(/^[:\s]+/, '').trim();
                }
                else {
                    const words = content.split(' ');
                    client = words.slice(0, 2).join(' ');
                    description = words.slice(2).join(' ');
                }
                client = client.replace(/\s(la|le|l'|au|du|en|et|Mise|a|à)$/i, '').trim();
                if (description.toLowerCase().startsWith(client.toLowerCase())) {
                    description = description.substring(client.length).replace(/^[:\s\-\–\.]+/g, '').trim();
                }
                const skillStopKeywords = /Compétence[s]?\s*(?:supplémentaire[s]?)?|Skills/i;
                const skillIndex = description.search(skillStopKeywords);
                if (skillIndex !== -1) {
                    description = description.substring(0, skillIndex).trim();
                }
                projects.push({ year, client: client || "Inconnu", description: description.trim() });
            }
        }
        else {
            const items = clean.split('|||').map(item => item.trim()).filter(item => item.length > 5);
            for (let line of items) {
                if (blacklist.test(line))
                    continue;
                let client = "Inconnu";
                let description = line;
                if (line.toLowerCase().includes("pour le compte de")) {
                    const parts = line.split(/pour le compte de/i);
                    description = parts[0].trim();
                    client = parts[1].trim();
                }
                else {
                    const splitMatch = line.match(separatorRegex);
                    if (splitMatch && splitMatch.index !== undefined) {
                        client = line.substring(0, splitMatch.index).trim();
                        description = line.substring(splitMatch.index).trim();
                    }
                }
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
    extractSkills(section) {
        if (!section || section.trim().length < 5)
            return [];
        let content = section
            .replace(/Compétence[s]?\s*(?:supplémentaire[s]?)?[:\s]*/i, '')
            .replace(/[•\t\*]/g, ', ')
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
            }
            else {
                const prevText = parts[i];
                const catMatch = prevText.match(/([A-ZÀ-ÖØ-ß][a-zà-ÿ\s’'–]{2,30})$/);
                category = catMatch ? catMatch[1].trim() : "Compétence";
            }
            itemsText = parts[i + 1];
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
    }
};
exports.HeuristicParserService = HeuristicParserService;
exports.HeuristicParserService = HeuristicParserService = __decorate([
    (0, common_1.Injectable)()
], HeuristicParserService);
//# sourceMappingURL=heuristic-parser.service.js.map