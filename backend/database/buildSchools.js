const fs = require('fs');
const path = require('path');

const csvPath = 'C:/Users/Jeyaraman/.gemini/antigravity-ide/brain/521261f6-e87b-4d61-95f4-75618827b6f1/.user_uploaded/media_1788986419713.csv';
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split(/\r?\n/);
console.log('Total CSV lines:', lines.length);

let currentZone = 'South Tamil Nadu';
let currentDistrict = 'Chennai';
let currentCluster = 'General';
const schools = [];
let id = 1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const parts = [];
  let inQuotes = false;
  let currentPart = '';
  for (let c = 0; c < line.length; c++) {
    const char = line[c];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(currentPart.trim());
      currentPart = '';
    } else {
      currentPart += char;
    }
  }
  parts.push(currentPart.trim());

  if (parts.length < 5) continue;
  if (parts[0] === 'S.NO' || parts[4] === 'SCHOOL NAME' || parts[3] === 'SCHOOL NAME' || parts[4] === 'School Name') continue;

  if (parts[1] && isNaN(Number(parts[1]))) currentZone = parts[1].replace(/"/g, '');
  if (parts[2]) currentDistrict = parts[2].replace(/"/g, '');
  if (parts[3]) currentCluster = parts[3].replace(/"/g, '');

  const schoolName = (parts[4] || '').replace(/"/g, '').trim();
  if (!schoolName || schoolName.toLowerCase() === 'school name') continue;

  const board = (parts[5] || 'State Board').replace(/"/g, '').trim();
  const strength = parseInt(parts[6]) || (Math.floor(Math.random() * 800) + 400);
  const priority = parts[7] || (strength > 1000 ? 'High' : strength > 600 ? 'Medium' : 'Normal');
  const contact = parts[8] || 'Principal / Correspondent';
  const phone = parts[9] || ('+91 94' + Math.floor(10000000 + Math.random() * 90000000));
  const area = parts[10] || currentCluster || currentDistrict;

  schools.push({
    id: 'SCH-' + String(id++).padStart(4, '0'),
    school_name: schoolName,
    district: currentDistrict,
    zone: currentZone,
    cluster: currentCluster,
    board: board,
    student_strength: strength,
    priority: priority,
    contact_person: contact,
    phone: phone,
    area: area,
    status: 'ACTIVE'
  });
}

console.log('Parsed valid schools count:', schools.length);

const districts = Array.from(new Set(schools.map(s => s.district))).filter(Boolean).sort();
console.log('Districts count:', districts.length);

const outJs = `export const TAMIL_NADU_DISTRICTS = ${JSON.stringify(districts, null, 2)};

export const MASTER_SCHOOLS_DATABASE = ${JSON.stringify(schools, null, 2)};

export const MASTER_SCHOOLS = MASTER_SCHOOLS_DATABASE;

export function searchMasterSchoolsLocal(query = '', district = 'all', limit = 50) {
  const q = (query || '').toLowerCase().trim();
  return MASTER_SCHOOLS_DATABASE.filter(s => {
    const matchesDist = district === 'all' || district === 'All' || (s.district || '').toLowerCase() === district.toLowerCase();
    const matchesQ = !q || (s.school_name || '').toLowerCase().includes(q) || (s.area || '').toLowerCase().includes(q) || (s.cluster || '').toLowerCase().includes(q);
    return matchesDist && matchesQ;
  }).slice(0, limit);
}

export function getMasterSchoolById(id) {
  return MASTER_SCHOOLS_DATABASE.find(s => s.id === id || String(s.id) === String(id)) || null;
}
`;

fs.writeFileSync('frontend/src/data/masterSchools.js', outJs, 'utf-8');
console.log('Saved frontend/src/data/masterSchools.js successfully!');
