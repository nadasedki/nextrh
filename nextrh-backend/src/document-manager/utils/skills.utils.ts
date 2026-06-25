export function normalizeSkills(skills: string[]): string[] {
  return [...new Set(
    skills
      .flatMap(s =>
        s
          // remove category prefixes like "Réseaux :"
          .replace(/^[^:–\-]+[:–\-]/, '')

          // split all common separators
          .split(/[,;/•|\n-]/g)
      )
      .map(s => s.trim())
      .filter(isValidSkill)
  )];
}

/**
 * Keep only meaningful skills
 */
export const isValidSkill = (s: string): boolean => {
  return (
    s.length > 1 &&
    !/^[0-9]+$/.test(s) &&
    !/^[•\-–]+$/.test(s) &&
    !/^(and|or|et|ou)$/i.test(s) &&
    !/^\s*$/.test(s)
  );
};
export const skillMap: Record<string, string> = {
  "c++": "C++",
  "c sharp": "C#",
  "linux os": "Linux",
  "ms windows": "Windows",
};

export function normalizeSkillName(skill: string): string {
  const key = skill.toLowerCase();
  return skillMap[key] ?? skill;
}