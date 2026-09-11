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
  const localCsvPath = path.join(__dirname, '../data/tn_schools_master.csv');
  if (!fs.existsSync(localCsvPath)) {
    console.warn('⚠️ Master schools CSV file not found at:', localCsvPath);
    return [];
  }

  const selectedPath = localCsvPath;

  console.log(`📖 Loading Master Schools catalog from: ${selectedPath}`);
  const content = fs.readFileSync(selectedPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

  const schools = [];
  const seenKey = new Set();
  let counter = 1;

  let currentZone = 'Tamil Nadu';
  let currentDistrict = 'Tamil Nadu';
  let currentCluster = 'General Cluster';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip header lines
    if (line.includes('SCHOOL NAME') || line.includes('S.NO') || line.startsWith('S.No') || line.startsWith('S.NO,')) continue;

    const cols = parseCSVLine(line);
    if (!cols || cols.length < 5) continue;

    // S.NO,ZONE ,DISTRICT,CLUSTER,SCHOOL NAME ,BOARD,STUDENT STRENGTH,PRIORITY,CORRESPONDENT/ PRINCIPAL,MOBILE NUMBERS,AREA,...
    let zoneCol = cols[1] || '';
    let districtCol = cols[2] || '';
    let clusterCol = cols[3] || '';
    let schoolNameCol = cols[4] || '';
    let boardCol = cols[5] || '';
    let strengthCol = cols[6] || '';
    let priorityCol = cols[7] || '';
    let contactCol = cols[8] || '';
    let phoneCol = cols[9] || '';
    let areaCol = cols[10] || '';

    // Carry forward hierarchical fields if row has empty zone/district/cluster
    if (zoneCol && zoneCol.trim().length > 0) currentZone = zoneCol.trim();
    if (districtCol && districtCol.trim().length > 0) currentDistrict = districtCol.trim();
    if (clusterCol && clusterCol.trim().length > 0) currentCluster = clusterCol.trim();

    const schoolName = (schoolNameCol || '').trim();
    if (!schoolName || schoolName.toLowerCase() === 'school name') continue;

    // Normalization
    const normDistrict = currentDistrict || 'Tamil Nadu';
    const normCluster = currentCluster || 'General Cluster';
    const normZone = currentZone || 'Tamil Nadu';
    
    let normBoard = 'Matriculation';
    const upperBoard = (boardCol || '').toUpperCase();
    if (upperBoard.includes('CBSE')) normBoard = 'CBSE';
    else if (upperBoard.includes('ICSE')) normBoard = 'ICSE';
    else if (upperBoard.includes('STATE') || upperBoard.includes('SAMACHEER')) normBoard = 'State Board';
    else if (upperBoard.includes('MATRIC')) normBoard = 'Matriculation';
    else if (boardCol && boardCol.trim().length > 0) normBoard = boardCol.trim();

    const cleanArea = (areaCol || '').trim() || `${normCluster}, ${normDistrict}`;
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
      area: cleanArea,
      student_strength: parseInt(strengthCol, 10) || null,
      contact_person: contactCol ? contactCol.trim() : null,
      phone: phoneCol ? phoneCol.trim() : null,
      priority: priorityCol && priorityCol.trim() ? priorityCol.trim() : 'Medium',
      status: 'ACTIVE'
    });
  }

  return schools;
}
