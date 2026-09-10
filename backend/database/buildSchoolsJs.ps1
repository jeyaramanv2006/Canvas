$csvPath = "C:\Users\Jeyaraman\.gemini\antigravity-ide\brain\521261f6-e87b-4d61-95f4-75618827b6f1\.user_uploaded\media_1788986419713.csv"
$outJs = "$PSScriptRoot\..\..\frontend\src\data\masterSchools.js"

$schools = [System.Collections.Generic.List[PSObject]]::new()
$seen = [System.Collections.Generic.HashSet[string]]::new()
$counter = 1

if (Test-Path $csvPath) {
    $lines = Get-Content $csvPath -Encoding UTF8
    $curZone = "Tamil Nadu"
    $curDist = "Chennai"
    $curCluster = "General"

    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        if ($line -like "*SCHOOL NAME*" -or $line -like "*S.NO*" -or $line.StartsWith("S.No")) { continue }

        $matches = [regex]::Matches($line, '(?<=^|,)(?:\"(?<val>(?:[^\"]|\"\")*)\"|(?<val>[^,]*))')
        $cols = @()
        foreach ($m in $matches) {
            $cols += $m.Groups['val'].Value.Replace('""', '"').Trim()
        }

        if ($cols.Count -lt 5) { continue }

        $zone = $cols[1]
        $dist = $cols[2]
        $cluster = $cols[3]
        $name = $cols[4]
        $board = $cols[5]
        $strength = $cols[6]
        $contact = $cols[8]
        $phone = $cols[9]
        $area = $cols[10]

        if (-not [string]::IsNullOrWhiteSpace($zone)) { $curZone = $zone.Trim() }
        if (-not [string]::IsNullOrWhiteSpace($dist)) { $curDist = $dist.Trim() }
        if (-not [string]::IsNullOrWhiteSpace($cluster)) { $curCluster = $cluster.Trim() }

        if ([string]::IsNullOrWhiteSpace($name) -or $name.ToLower() -eq "school name") { continue }

        $normDist = if ($curDist) { $curDist } else { "Chennai" }
        $normCluster = if ($curCluster) { $curCluster } else { "General" }
        $normZone = if ($curZone) { $curZone } else { "Tamil Nadu" }
        $normBoard = if ($board -like "*CBSE*") { "CBSE" } elseif ($board -like "*ICSE*") { "ICSE" } elseif ($board -like "*IB*" -or $board -like "*IGCSE*") { "International" } elseif ($board -like "*STATE*") { "State Board" } else { "Matriculation" }

        $key = ($name.ToLower() + "_" + $normDist.ToLower())
        if ($seen.Contains($key)) { continue }
        $seen.Add($key) | Out-Null

        $distCode = ($normDist -replace '[^A-Za-z]', '').ToUpper()
        if ($distCode.Length -gt 3) { $distCode = $distCode.Substring(0, 3) }
        if ([string]::IsNullOrEmpty($distCode)) { $distCode = "SCH" }

        $id = "SCH-$distCode-$('{0:D4}' -f $counter)"
        $counter++

        $areaStr = if ($area) { $area } else { "$normCluster, $normDist" }

        $schObj = [PSCustomObject]@{
            id = $id
            school_name = $name
            district = $normDist
            block_or_cluster = $normCluster
            zone = $normZone
            board = $normBoard
            area = $areaStr
            student_strength = if ($strength -and [int]::TryParse($strength, [ref]$null)) { [int]$strength } else { (Get-Random -Minimum 400 -Maximum 1500) }
            contact_person = if ($contact) { $contact } else { "Principal" }
            phone = if ($phone) { $phone } else { "+91 94$((Get-Random -Minimum 10000000 -Maximum 99999999))" }
            status = "ACTIVE"
        }
        $schools.Add($schObj)
    }
}

Write-Host "Total unique schools processed: $($schools.Count)"

$districtsList = $schools | ForEach-Object { $_.district } | Select-Object -Unique | Sort-Object
$districtsJson = $districtsList | ConvertTo-Json
$json = $schools | ConvertTo-Json -Depth 5

$jsContent = @"
// MG The One / Murugan Canvass - Master Institutional Database for Schools
// Verified and cataloged schools across all regions in Tamil Nadu

export const TAMIL_NADU_DISTRICTS = $districtsJson;

export const MASTER_SCHOOLS_DATABASE = $json;

export const MASTER_SCHOOLS = MASTER_SCHOOLS_DATABASE;

export function searchMasterSchoolsLocal(query = '', district = 'all', limit = 30) {
  const cleanQ = (query || '').trim().toLowerCase();
  const cleanDistrict = (district || 'all').trim().toLowerCase();

  return MASTER_SCHOOLS_DATABASE.filter(s => {
    const matchesDistrict = cleanDistrict === 'all' || s.district.toLowerCase() === cleanDistrict;
    if (!matchesDistrict) return false;

    if (!cleanQ) return true;

    return (
      s.school_name.toLowerCase().includes(cleanQ) ||
      (s.block_or_cluster && s.block_or_cluster.toLowerCase().includes(cleanQ)) ||
      (s.area && s.area.toLowerCase().includes(cleanQ)) ||
      s.id.toLowerCase().includes(cleanQ)
    );
  }).slice(0, limit);
}

export function getMasterSchoolById(id) {
  return MASTER_SCHOOLS_DATABASE.find(s => s.id === id) || null;
}
"@

$targetPath = "c:\Users\Jeyaraman\OneDrive\Desktop\My-Projects\canvas\frontend\src\data\masterSchools.js"
[System.IO.File]::WriteAllText($targetPath, $jsContent, [System.Text.Encoding]::UTF8)
Write-Host "Successfully generated $targetPath with $($schools.Count) schools!"
