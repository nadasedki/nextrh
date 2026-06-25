"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skillMap = exports.isValidSkill = void 0;
exports.normalizeSkills = normalizeSkills;
exports.normalizeSkillName = normalizeSkillName;
function normalizeSkills(skills) {
    return [...new Set(skills
            .flatMap(s => s
            .replace(/^[^:–\-]+[:–\-]/, '')
            .split(/[,;/•|\n-]/g))
            .map(s => s.trim())
            .filter(exports.isValidSkill))];
}
const isValidSkill = (s) => {
    return (s.length > 1 &&
        !/^[0-9]+$/.test(s) &&
        !/^[•\-–]+$/.test(s) &&
        !/^(and|or|et|ou)$/i.test(s) &&
        !/^\s*$/.test(s));
};
exports.isValidSkill = isValidSkill;
exports.skillMap = {
    "c++": "C++",
    "c sharp": "C#",
    "linux os": "Linux",
    "ms windows": "Windows",
};
function normalizeSkillName(skill) {
    const key = skill.toLowerCase();
    return exports.skillMap[key] ?? skill;
}
//# sourceMappingURL=skills.utils.js.map