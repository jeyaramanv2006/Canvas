import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to parse standard CSV line with quotes
export function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function loadAndParseSchoolsFromCSVs() {
  const userUploadDir = path.resolve('C:/Users/Jeyaraman/.gemini/antigravity-ide/brain/761e495d-776f-4a36-b9a9-0eef0b90bc0e/.user_uploaded');
  
  const files = [
    'media_1788718991356.csv', // Full TN Sheet (all districts)
    'media_1788718991352.csv', // Madurai cluster
    'media_1788718991294.csv'  // Tenkasi cluster
  ];

  const schools = [];
  const seenKey = new Set();
  let counter = 1;

  for (const fileName of files) {
    const filePath = path.join(userUploadDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

    let currentZone = 'Tamil Nadu';
    let currentDistrict = 'Tamil Nadu';
    let currentCluster = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip header lines
      if (line.includes('SCHOOL NAME') || line.includes('S.NO') || line.startsWith('S.No')) continue;

      const cols = parseCSVLine(line);
      if (!cols || cols.length < 5) continue;

      let zoneCol = '';
      let districtCol = '';
      let clusterCol = '';
      let schoolNameCol = '';
      let boardCol = '';
      let strengthCol = '';
      let priorityCol = '';
      let contactCol = '';
      let phoneCol = '';
      let areaCol = '';

      if (fileName === 'media_1788718991356.csv') {
        // S.NO,ZONE ,DISTRICT,CLUSTER,SCHOOL NAME ,BOARD,STUDENT STRENGTH,PRIORITY,CORRESPONDENT/ PRINCIPAL,MOBILE NUMBERS,AREA,...
        zoneCol = cols[1] || '';
        districtCol = cols[2] || '';
        clusterCol = cols[3] || '';
        schoolNameCol = cols[4] || '';
        boardCol = cols[5] || '';
        strengthCol = cols[6] || '';
        priorityCol = cols[7] || '';
        contactCol = cols[8] || '';
        phoneCol = cols[9] || '';
        areaCol = cols[10] || '';
      } else if (fileName === 'media_1788718991352.csv') {
        // [0: S.No, 1: Zone, 2: District, 3: Block, 4: School, 5: Board, 6..]
        zoneCol = cols[1] || '';
        districtCol = cols[2] || '';
        clusterCol = cols[3] || '';
        schoolNameCol = cols[4] || '';
        boardCol = cols[5] || '';
      } else if (fileName === 'media_1788718991294.csv') {
        // [0: empty, 1: empty, 2: District, 3: Block, 4: School, 5: Board, ... 10: Area]
        districtCol = cols[2] || '';
        clusterCol = cols[3] || '';
        schoolNameCol = cols[4] || '';
        boardCol = cols[5] || '';
        areaCol = cols[10] || '';
        zoneCol = 'South Tamil Nadu';
      }

      if (zoneCol && zoneCol.trim().length > 0) currentZone = zoneCol.trim();
      if (districtCol && districtCol.trim().length > 0) currentDistrict = districtCol.trim();
      if (clusterCol && clusterCol.trim().length > 0) currentCluster = clusterCol.trim();

      const schoolName = (schoolNameCol || '').trim();
      if (!schoolName || schoolName.toLowerCase() === 'school name') continue;

      // Normalization
      const normDistrict = currentDistrict || 'Tamil Nadu';
      const normCluster = currentCluster || 'General Cluster';
      const normZone = currentZone || 'Tamil Nadu';
      const normBoard = (boardCol || 'Matriculation').toUpperCase().includes('CBSE') 
        ? 'CBSE' 
        : (boardCol.toUpperCase().includes('ICSE') ? 'ICSE' : (boardCol.toUpperCase().includes('STATE') ? 'State Board' : 'Matriculation'));

      // Clean district prefix for ID
      const distCode = normDistrict.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() || 'SCH';
      const key = `${schoolName.toLowerCase()}_${normDistrict.toLowerCase()}`;
      if (seenKey.has(key)) continue;
      seenKey.add(key);

      const id = `SCH-${distCode}-${String(counter++).padStart(4, '0')}`;

      schools.push({
        id,
        school_name: schoolName,
        district: normDistrict,
        block_or_cluster: normCluster,
        zone: normZone,
        board: normBoard,
        area: areaCol || `${normCluster}, ${normDistrict}`,
        student_strength: parseInt(strengthCol, 10) || null,
        contact_person: contactCol || null,
        phone: phoneCol || null,
        priority: priorityCol || 'Medium',
        status: 'ACTIVE'
      });
    }
  }

  return schools;
}
