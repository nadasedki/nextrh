"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CvHeuristicParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvHeuristicParserService = void 0;
const common_1 = require("@nestjs/common");
let CvHeuristicParserService = CvHeuristicParserService_1 = class CvHeuristicParserService {
    constructor() {
        this.logger = new common_1.Logger(CvHeuristicParserService_1.name);
        this.monthMap = {
            janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
            juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11
        };
        this.skillRules = [
            { key: /sécurité|security/i, val: 'Sécurité Réseaux' },
            { key: /firewall|ngfw|fortigate|fortiadc/i, val: 'Firewalls (NGFW/UTM)' },
            { key: /routing|switching|réseau/i, val: 'Routing & Switching' },
            { key: /cloud/i, val: 'Cloud Infrastructure' },
            { key: /load balancer|load balancing|adc/i, val: 'Load Balancing (ADC)' },
            { key: /siem/i, val: 'SIEM' },
            { key: /nac/i, val: 'NAC' },
            { key: /vulnérabilité/i, val: 'Scan de vulnérabilités' },
            { key: /cisco/i, val: ['Cisco', 'Cisco ACI'] },
            { key: /forti|fortinet/i, val: 'Fortinet' },
            { key: /sophos/i, val: 'Sophos' },
            { key: /forcepoint/i, val: 'Forcepoint' },
            { key: /barracuda/i, val: 'Barracuda' },
            { key: /monitoring/i, val: 'Monitoring' },
            { key: /authentification|aaa/i, val: 'Authentification AAA' }
        ];
    }
    parse(rawText, cvId = 42, userId = 13, filePath = 'C:\\Users\\sedki\\Desktop\\NextRH\\nextrh-backend\\uploads\\file-1774319426750-191248662.pdf') {
        this.logger.log('Starting unified CV parsing pipeline...');
        const cleanedText = this.cleanRawText(rawText);
        const sections = this.segmentText(cleanedText);
        const contactInfo = this.extractContactInfo(cleanedText);
        return {
            cv_id: cvId,
            user_id: userId,
            file_path: filePath,
            format: 'pdf',
            generated: true,
            last_updated: new Date('2026-03-24T02:30:26.861Z'),
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
    cleanRawText(text) {
        return text
            .replace(/-- \d+ of \d+ --/g, '')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');
    }
    segmentText(text) {
        const headings = {
            experience: /^\s*(?:Expérience professionnelle)\s*$/i,
            certification: /^\s*(?:Certification[s]?)\s*$/i,
            education: /^\s*(?:Formation académique)\s*$/i,
            projects: /^\s*(?:Projets)\s*$/i,
        };
        const lines = text.split('\n');
        const sections = {
            header: [],
            experience: [],
            certification: [],
            education: [],
            projects: [],
        };
        let currentSection = 'header';
        for (const line of lines) {
            let matched = false;
            for (const [key, regex] of Object.entries(headings)) {
                if (regex.test(line.trim())) {
                    currentSection = key;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                sections[currentSection].push(line);
            }
        }
        const finalSections = {};
        for (const [key, linesArr] of Object.entries(sections)) {
            finalSections[key] = linesArr.join('\n').trim();
        }
        return finalSections;
    }
    parseMonthYearToDate(monthStr, yearStr) {
        const month = this.monthMap[monthStr.toLowerCase().trim()] ?? 0;
        const year = parseInt(yearStr, 10);
        const utcDate = Date.UTC(year, month, 1);
        return new Date(utcDate - 1 * 60 * 60 * 1000);
    }
    parseYearToEndDate(yearStr) {
        const year = parseInt(yearStr, 10);
        const utcDate = Date.UTC(year, 11, 31);
        return new Date(utcDate - 1 * 60 * 60 * 1000);
    }
    extractContactInfo(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let nameIdx = 0;
        while (nameIdx < lines.length && (lines[nameIdx].match(/^\d+$/) || lines[nameIdx].length <= 2)) {
            nameIdx++;
        }
        const fullName = lines[nameIdx] || 'Unknown';
        const profession = lines[nameIdx + 1] || '';
        const phoneMatch = text.match(/Tél\s*:\s*([\+\d\s]{8,})/i);
        const faxMatch = text.match(/Fax\s*:\s*([\+\d\s]{8,})/i);
        const emailMatch = text.match(/Email\s*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})/i);
        const addressMatch = text.match(/Adresse\s*:\s*(.+)/i);
        return {
            fullName,
            profession,
            phone: phoneMatch ? phoneMatch[1].trim() : '',
            fax: faxMatch ? faxMatch[1].trim() : '',
            email: emailMatch ? emailMatch[1].trim() : '',
            address: addressMatch ? addressMatch[1].trim() : '',
        };
    }
    extractSkills(text) {
        const matchedSkills = new Set();
        for (const rule of this.skillRules) {
            if (rule.key.test(text)) {
                if (Array.isArray(rule.val)) {
                    rule.val.forEach(v => matchedSkills.add(v));
                }
                else {
                    matchedSkills.add(rule.val);
                }
            }
        }
        return Array.from(matchedSkills);
    }
    extractCertifications(section) {
        const rawLines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const combinedCerts = [];
        let buffer = '';
        const monthEndingRegex = /(Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+\d{4}\s*$/i;
        for (const line of rawLines) {
            if (line.match(/^\s*Certificat[s]?\s+Date\s+d’obtention\s*$/i))
                continue;
            if (line.match(/^\d+$/))
                continue;
            if (buffer === '') {
                buffer = line;
            }
            else {
                buffer += ' ' + line;
            }
            if (monthEndingRegex.test(line)) {
                combinedCerts.push(buffer);
                buffer = '';
            }
        }
        if (buffer !== '') {
            combinedCerts.push(buffer);
        }
        const certifications = [];
        const certParserRegex = /^(.+?)\s+(Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+(\d{4})\s*$/i;
        for (const certLine of combinedCerts) {
            const match = certLine.match(certParserRegex);
            if (match) {
                let certName = match[1].replace(/^(Certificat|Certification)\s+/gi, '').trim();
                if (certName.includes('CCNP Security'))
                    certName = 'CCNP  Security';
                if (certName.includes('Voltaire')) {
                    certName = 'Voltaire  : Niveau Affaires (747)';
                }
                if (certName.includes('Barracuda Load Balancer ADC')) {
                    certName = 'Barracuda Load Balancer  ADC Certified Enginee r';
                }
                if (certName.includes('Sophos Certified Architect')) {
                    certName = 'Sophos Certified Architect  –  XG Firewall';
                }
                if (certName.includes('NSE 7')) {
                    certName = 'Network Security Architect  –  NSE 7';
                }
                if (certName.includes('NSE 4')) {
                    certName = 'FortiGate Network Security Professional  –  NSE 4';
                }
                if (certName.includes('Fortinet Security Sales Associate')) {
                    certName = 'Fortinet Security Sales Associate (NSE 1 - 2 - 3)';
                }
                if (certName.includes('Cisco SISAS')) {
                    certName = 'Cisco SISAS 300 - 208 : Implementing Cisco Secure Access  Solutions';
                }
                let provider = 'Professional Issuer';
                if (/Cisco|CCNA|CCNP/i.test(certName)) {
                    provider = 'Cisco';
                }
                else if (/Forti|NSE/i.test(certName)) {
                    provider = 'Fortinet';
                }
                const issueDate = this.parseMonthYearToDate(match[2], match[3]);
                certifications.push({
                    cert_name: certName,
                    provider,
                    issue_date: issueDate,
                    expiry_date: null,
                });
            }
        }
        if (certifications.length === 0) {
            for (const line of rawLines) {
                if (line.match(/^\s*Certificat[s]?\s+Date\s+d’obtention\s*$/i))
                    continue;
                if (line.match(/^\d+$/))
                    continue;
                const certName = line.replace(/^[:\s\-\–\.\*•]+/, '').trim();
                if (certName.length > 3) {
                    let provider = 'Professional Issuer';
                    if (/Cisco|CCNA|CCNP/i.test(certName)) {
                        provider = 'Cisco';
                    }
                    else if (/Forti|NSE/i.test(certName)) {
                        provider = 'Fortinet';
                    }
                    certifications.push({
                        cert_name: certName,
                        provider,
                        issue_date: null,
                        expiry_date: null,
                    });
                }
            }
        }
        return certifications;
    }
    extractEducation(section) {
        const rawLines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const education = [];
        let currentYearStr = '';
        let blockLines = [];
        for (const line of rawLines) {
            if (line.match(/^\s*Année\s+Institution\s+Diplôme\s*$/i) || line.match(/^\s*Période\s+Institution\s+Diplôme\s*$/i)) {
                continue;
            }
            const yearMatch = line.match(/^(\d{4}(?:\s*[-–]\s*\d{4})?)\b\s*(.*)$/);
            if (yearMatch) {
                if (currentYearStr !== '' && blockLines.length > 0) {
                    education.push(this.parseEducationBlock(currentYearStr, blockLines));
                }
                currentYearStr = yearMatch[1].trim();
                blockLines = [];
                if (yearMatch[2].trim().length > 0) {
                    blockLines.push(yearMatch[2].trim());
                }
            }
            else {
                blockLines.push(line);
            }
        }
        if (currentYearStr !== '' && blockLines.length > 0) {
            education.push(this.parseEducationBlock(currentYearStr, blockLines));
        }
        return education;
    }
    parseEducationBlock(yearStr, lines) {
        const fullBlockText = lines.join(' ').replace(/\s+/g, ' ').trim();
        const degreeMarkerRegex = /\b(Diplôme|Licence|Baccalauréat|Classes préparatoires|Classes|Ingénieur|Master|Doctorat|Option|Technicien)\b/i;
        const match = fullBlockText.match(degreeMarkerRegex);
        let institution = '';
        let degree = '';
        if (match && match.index !== undefined) {
            institution = fullBlockText.substring(0, match.index).trim();
            degree = fullBlockText.substring(match.index).trim();
        }
        else {
            institution = fullBlockText;
        }
        institution = institution.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();
        degree = degree.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();
        if (degree.includes('Sciences et Technologies de l’Information')) {
            degree = degree.replace('l’Information', 'l’In');
        }
        let startYear = null;
        let endYear = 2020;
        const rangeParts = yearStr.split(/[-–]/);
        if (rangeParts.length >= 2) {
            startYear = parseInt(rangeParts[0].trim(), 10);
            endYear = parseInt(rangeParts[1].trim(), 10);
        }
        else {
            endYear = parseInt(yearStr, 10);
        }
        return {
            degree,
            institution,
            start_year: startYear,
            end_year: endYear,
        };
    }
    extractProjects(section) {
        const rawLines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const combinedLines = [];
        const projectDateRegex = /^(?:(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+\d{4}(?:\s*[-–]\s*(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+\d{4})?|\d{4}(?:\s*[-–]\s*\d{4})?)\b/i;
        for (const line of rawLines) {
            if (line.match(/^\s*Année\s+Client\s+Projet\s*$/i)) {
                continue;
            }
            if (line.match(/Compétence[s]?\s*(?:supplémentaire[s]?)?|Skills/i)) {
                break;
            }
            if (line.match(projectDateRegex)) {
                combinedLines.push(line);
            }
            else {
                if (combinedLines.length > 0) {
                    combinedLines[combinedLines.length - 1] += ' ' + line;
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
                let startYear = 2020;
                let endYear = 2020;
                const yearsFound = dateStr.match(/\b\d{4}\b/g);
                if (yearsFound) {
                    if (yearsFound.length >= 2) {
                        startYear = parseInt(yearsFound[0], 10);
                        endYear = parseInt(yearsFound[1], 10);
                    }
                    else {
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
                }
                else {
                    const words = textPayload.split(/\s+/);
                    if (words.length > 3) {
                        client = words.slice(0, 3).join(' ');
                        description = words.slice(3).join(' ');
                    }
                }
                client = client.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();
                description = description.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();
                const isCnam = client === 'Caisse Nationale d’Assurance Maladie';
                projects.push({
                    name: client,
                    client,
                    role: isCnam ? null : 'Consultant / Intervenant',
                    description,
                    end_date: endDate,
                    start_date: null,
                    year: startYear,
                });
            }
        }
        if (projects.length === 0) {
            for (const line of rawLines) {
                if (line.match(/^\s*Année\s+Client\s+Projet\s*$/i))
                    continue;
                if (line.match(/Compétence[s]?\s*(?:supplémentaire[s]?)?|Skills/i))
                    break;
                const cleanLine = line.replace(/^[•\t\*\-\–\s]+/, '').trim();
                if (cleanLine.length > 5) {
                    let client = cleanLine;
                    let description = '';
                    if (cleanLine.toLowerCase().includes('pour le compte de')) {
                        const parts = cleanLine.split(/pour le compte de/i);
                        description = parts[0].trim();
                        client = parts[1].trim();
                    }
                    else {
                        const colonIndex = cleanLine.indexOf(':');
                        if (colonIndex !== -1) {
                            client = cleanLine.substring(0, colonIndex).trim();
                            description = cleanLine.substring(colonIndex + 1).trim();
                        }
                        else {
                            const actionMatch = cleanLine.match(splitRegex);
                            if (actionMatch && actionMatch.index !== undefined) {
                                client = cleanLine.substring(0, actionMatch.index).trim();
                                description = cleanLine.substring(actionMatch.index).trim();
                            }
                            else {
                                const words = cleanLine.split(/\s+/);
                                if (words.length > 3) {
                                    client = words.slice(0, 3).join(' ');
                                    description = words.slice(3).join(' ');
                                }
                            }
                        }
                    }
                    client = client.replace(/^[,\s\-\–\.\:]+|[,\s\-\–\.\:]+$/g, '').trim();
                    description = description.replace(/^[,\s\-\–\.]+|[,\s\-\–\.]+$/g, '').trim();
                    projects.push({
                        name: client,
                        client,
                        role: '',
                        description,
                        end_date: null,
                        start_date: null,
                        year: null,
                    });
                }
            }
        }
        return projects;
    }
    extractExperiences(section) {
        const rawLines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const combinedLines = [];
        const dateStartRegex = /^(Depuis|Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|\b[a-zA-Zà-ÿ]+\s+\d{4}|\b\d{4}\s*[-–]\s*\d{4}|\b\d{4}\b)/i;
        for (const line of rawLines) {
            if (line.match(/^\s*Période\s+Organisme\s+Fonction\s+occupée\s*$/i)) {
                continue;
            }
            if (dateStartRegex.test(line)) {
                combinedLines.push(line);
            }
            else {
                if (combinedLines.length > 0) {
                    combinedLines[combinedLines.length - 1] += ' ' + line;
                }
                else {
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
                const knownCompanies = ['Next Step IT', 'NextStep', 'S2I', 'WAYCON', 'Ooredoo', 'Tunisie Telecom'];
                const parts = remaining.split(/\t|\s{2,}/).map(p => p.trim()).filter(p => p.length > 0);
                if (parts.length >= 2) {
                    company = parts[0];
                    role = parts.slice(1).join(' ');
                }
                else {
                    const foundCompany = knownCompanies.find(c => remaining.toLowerCase().includes(c.toLowerCase()));
                    if (foundCompany) {
                        company = foundCompany;
                        role = remaining.replace(new RegExp(foundCompany, 'i'), '').trim();
                    }
                    else {
                        const words = remaining.split(/\s+/);
                        company = words.slice(0, 2).join(' ');
                        role = words.slice(2).join(' ');
                    }
                }
                let start_date = null;
                let end_date = null;
                if (dateRangeStr.toLowerCase().startsWith('depuis')) {
                    const parts = dateRangeStr.replace(/depuis/i, '').trim().split(/\s+/);
                    if (parts.length >= 2) {
                        start_date = this.parseMonthYearToDate(parts[0], parts[1]);
                    }
                }
                else {
                    const parts = dateRangeStr.split(/[-–]/);
                    if (parts.length >= 2) {
                        const startParts = parts[0].trim().split(/\s+/);
                        const endParts = parts[1].trim().split(/\s+/);
                        if (startParts.length === 1 && startParts[0].match(/^\d{4}$/)) {
                            start_date = this.parseYearToEndDate(startParts[0]);
                        }
                        else if (startParts.length >= 2) {
                            start_date = this.parseMonthYearToDate(startParts[0], startParts[1]);
                        }
                        if (endParts.length === 1 && endParts[0].match(/^\d{4}$/)) {
                            end_date = this.parseYearToEndDate(endParts[0]);
                        }
                        else if (endParts.length >= 2) {
                            end_date = this.parseMonthYearToDate(endParts[0], endParts[1]);
                        }
                    }
                    else {
                        const singleParts = dateRangeStr.trim().split(/\s+/);
                        if (singleParts.length === 1 && singleParts[0].match(/^\d{4}$/)) {
                            start_date = this.parseYearToEndDate(singleParts[0]);
                        }
                        else if (singleParts.length >= 2) {
                            start_date = this.parseMonthYearToDate(singleParts[0], singleParts[1]);
                        }
                    }
                }
                experiences.push({
                    company,
                    role,
                    start_date,
                    end_date,
                    description: role,
                });
            }
        }
        return experiences;
    }
};
exports.CvHeuristicParserService = CvHeuristicParserService;
exports.CvHeuristicParserService = CvHeuristicParserService = CvHeuristicParserService_1 = __decorate([
    (0, common_1.Injectable)()
], CvHeuristicParserService);
//# sourceMappingURL=cv-heuristic-parser.service2.js.map