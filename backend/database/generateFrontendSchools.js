import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadAndParseSchoolsFromCSVs } from './seedSchools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schools = loadAndParseSchoolsFromCSVs();
console.log(`Parsed ${schools.length} schools from all datasets.`);

const outputPath = path.resolve(__dirname, '../../frontend/src/data/masterSchools.js');

const uniqueDistricts = Array.from(new Set(schools.map(s => s.district).filter(Boolean))).sort();

const fileContent = `// Murugan Canvass - Master Institutional Database for Schools
// Verified and cataloged schools across all regions in Tamil Nadu (SQLite Synchronized)

export const MASTER_SCHOOLS = ${JSON.stringify(schools, null, 2)};
export const MASTER_SCHOOLS_DATABASE = MASTER_SCHOOLS;

export const TAMIL_NADU_DISTRICTS = ${JSON.stringify(uniqueDistricts, null, 2)};

export function searchMasterSchoolsLocal(query = '', district = 'all', limit = 20) {
  const cleanQ = (query || '').trim().toLowerCase();
  const cleanDistrict = (district || 'all').trim().toLowerCase();

  return MASTER_SCHOOLS.filter(s => {
    const matchesDistrict = cleanDistrict === 'all' || s.district.toLowerCase() === cleanDistrict;
    if (!matchesDistrict) return false;

    if (!cleanQ) return true;

    return (
      s.school_name.toLowerCase().includes(cleanQ) ||
      s.block_or_cluster.toLowerCase().includes(cleanQ) ||
      (s.area && s.area.toLowerCase().includes(cleanQ)) ||
      s.id.toLowerCase().includes(cleanQ)
    );
  }).slice(0, limit);
}

export function getMasterSchoolById(id) {
  return MASTER_SCHOOLS.find(s => s.id === id) || null;
}
`;

fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`Successfully updated ${outputPath} with ${schools.length} verified schools and ${uniqueDistricts.length} districts!`);

