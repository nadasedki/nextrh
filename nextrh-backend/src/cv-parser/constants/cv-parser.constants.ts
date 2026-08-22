export const SKILL_STOP_WORDS = new Set([
  'de', 'la', 'le', 'les', 'des', 'un', 'une', 'en', 'pour', 'sur', 'avec', 'et', 'dans', 'par', 'ce', 'ces',
  'mise', 'place', 'administration', 'gestion', 'conception', 'développement', 'developpement', 'réalisation',
  'and', 'for', 'with', 'the', 'of', 'in', 'on', 'at', 'by', 'an', 'to'
]);
export const MONTH_MAP: Record<string, number> = {
  janvier: 0,
  février: 1, fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  août: 7, aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  décembre: 11, decembre: 11,
};

export const HEADING_SYNONYMS: Record<string, string[]> = {
  experience: [
    'expérience professionnelle', 'experiences',
    'work history', 'career history', 'parcours professionnel',
  ],
  certification: [
    'certification', 'certifications', 'certificats', 'credentials',
  ],
  education: [
    'formation académique', 'formations', 'éducation', 'education', 'cursus',
  ],
  projects: [
    'projets', 'projects', 'réalisations', 'key projects',
  ],
    skills: [
    'compétences', 'competences', 'compétences supplémentaires', 'skills', 'technical skills',
  ],
};

export const KNOWN_PROVIDERS = [
  // --- Core Systems & Operating Systems ---
  'Cisco', 'VMware', 'Red Hat', 'Linux Foundation', 'Microsoft', 'Oracle', 'IBM', 'Dell', 'HP',

  // --- Cloud & DevOps ---
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'HashiCorp', 'Ansible',

  // --- Cybersecurity & Infrastructure ---
  'Fortinet', 'Sophos', 'Barracuda', 'Forcepoint', 'Check Point', 'Palo Alto', 'Nessus', 'Splunk',

  // --- Networking & Hardware (from your CV corpus) ---
  'Alcatel-Lucent', 'Alcatel', 'Kemp', 'Juniper', 'SolarWinds',

  // --- Security & Auditing Certification Bodies ---
  'ISACA', 'EC-Council', 'CompTIA', '(ISC)2',

  // --- Project Management & Agile Methodologies ---
  'PMI', 'Scrum.org', 'Scrum Alliance', 'ITIL', 'AXELOS', 'PeopleCert',
  'MongoDB',"Meta",'Google','freeCodeCamp','Udemy','Databricks','Angular','Spring Boot'
];

export const TECH_KEYWORDS = [
  'LAN', 'WLAN', 'WAN', 'Ethernet', 'TCP/IP', 'VPN',
  'EIGRP', 'OSPF', 'RIP', 'Firewall', 'UTM', 'IDS', 'IPS', 'WAF',
  'Cisco', 'HP', 'Alcatel', 'Sophos', 'Fortinet', 'SolarWinds', 'Nessus', 'Wireshark',
  'Linux', 'Windows Server', 'Ubuntu', 'CentOS',
  'Java', 'Spring Boot', 'JavaScript', 'TypeScript', 'Python', 'C++', 'C', 'PHP', 'SQL', 'PL/SQL',
  'React', 'Angular', 'Vue', 'HTML', 'CSS', 'SASS', 'Redux', 'Vuex',
  'Node.js', 'Express', 'REST', 'GraphQL', 'Microservices',
  'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'GitLab CI', 'CI/CD',
  'AWS', 'Azure', 'GCP', 'OpenStack', 'Prometheus', 'Grafana',
  'Machine Learning', 'Deep Learning', 'NLP', 'Data Science', 'Data Engineering', 'ETL', 'Data Warehouse',
  'Spark', 'Hadoop', 'Power BI', 'Tableau', 'Pandas', 'NumPy',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Oracle', 'Redis',
  'SOC', 'SIEM', 'Splunk', 'ELK', 'Penetration Testing', 'Threat Detection', 'Incident Response', 'GRC', 'ISO 27001', 'CISA', 'CEH',
  'ITIL', 'Agile', 'Scrum', 'Project Management',
  'VMware', 'vSphere', 'Android', 'API', 'Web Services',
];

export const PROJECT_ACTION_KEYWORDS = [
  'Mise en place', 'Mise à niveau', 'Mise a niveau', 'Migration',
  'Réalisation', 'Implémentation', 'Audit', 'Conception',
  'Livraison', 'Installation', 'Acquisition', 'Renouvellement',
  'Fourniture', 'Location', 'Câblage', 'Mise en service',
  'Déploiement', 'Configuration', 'Administration', 'Gestion',
  'Maintenance', 'Optimisation', 'Supervision', 'Monitoring',
  'Support', 'Sécurisation', 'Automatisation', 'Virtualisation',
  'Développement', 'Intégration', 'Centralisation', 'Architecture',
  'Traitement', 'Containerisation', 'Orchestration', 'Planification',
  'Analyse', 'Reporting', 'Politique', 'Récupération', 'Investigation',
];