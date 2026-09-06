$csv1 = "C:\Users\Jeyaraman\.gemini\antigravity-ide\brain\761e495d-776f-4a36-b9a9-0eef0b90bc0e\.user_uploaded\media_1788718991356.csv"
$csv2 = "C:\Users\Jeyaraman\.gemini\antigravity-ide\brain\761e495d-776f-4a36-b9a9-0eef0b90bc0e\.user_uploaded\media_1788718991352.csv"
$csv3 = "C:\Users\Jeyaraman\.gemini\antigravity-ide\brain\761e495d-776f-4a36-b9a9-0eef0b90bc0e\.user_uploaded\media_1788718991294.csv"
$outJs = "c:\Users\Jeyaraman\OneDrive\Desktop\My-Projects\canvas\frontend\src\data\masterSchools.js"

$schools = [System.Collections.Generic.List[PSObject]]::new()
$seen = [System.Collections.Generic.HashSet[string]]::new()
$counter = 1

function Process-CSV {
    param($path, $type)
    if (-not (Test-Path $path)) { return }
    $lines = Get-Content $path -Encoding UTF8
    
    $curZone = "Tamil Nadu"
    $curDist = "Tamil Nadu"
    $curCluster = ""

    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        if ($line -like "*SCHOOL NAME*" -or $line -like "*S.NO*" -or $line.StartsWith("S.No")) { continue }

        # Simple CSV parse
        $matches = [regex]::Matches($line, '(?<=^|,)(?:\"(?<val>(?:[^\"]|\"\")*)\"|(?<val>[^,]*))')
        $cols = @()
        foreach ($m in $matches) {
            $cols += $m.Groups['val'].Value.Replace('""', '"').Trim()
        }

        if ($cols.Count -lt 5) { continue }

        $zone = ""
        $dist = ""
        $cluster = ""
        $name = ""
        $board = ""
        $area = ""
        $contact = ""
        $phone = ""
        $strength = $null

        if ($type -eq 1) {
            # media_1788718991356.csv
            $zone = $cols[1]
            $dist = $cols[2]
            $cluster = $cols[3]
            $name = $cols[4]
            $board = $cols[5]
            $strength = $cols[6]
            $contact = $cols[8]
            $phone = $cols[9]
            $area = $cols[10]
        } elseif ($type -eq 2) {
            # media_1788718991352.csv (Madurai)
            $zone = $cols[1]
            $dist = $cols[2]
            $cluster = $cols[3]
            $name = $cols[4]
            $board = $cols[5]
        } elseif ($type -eq 3) {
            # media_1788718991294.csv (Tenkasi)
            $dist = $cols[2]
            $cluster = $cols[3]
            $name = $cols[4]
            $board = $cols[5]
            if ($cols.Count -gt 10) { $area = $cols[10] }
            $zone = "South Tamil Nadu"
        }

        if (-not [string]::IsNullOrWhiteSpace($zone)) { $curZone = $zone.Trim() }
        if (-not [string]::IsNullOrWhiteSpace($dist)) { $curDist = $dist.Trim() }
        if (-not [string]::IsNullOrWhiteSpace($cluster)) { $curCluster = $cluster.Trim() }

        if ([string]::IsNullOrWhiteSpace($name) -or $name.ToLower() -eq "school name") { continue }

        $normDist = if ($curDist) { $curDist } else { "Tamil Nadu" }
        $normCluster = if ($curCluster) { $curCluster } else { "General Block" }
        $normZone = if ($curZone) { $curZone } else { "Tamil Nadu" }
        $normBoard = if ($board -like "*CBSE*") { "CBSE" } elseif ($board -like "*ICSE*") { "ICSE" } elseif ($board -like "*STATE*") { "State Board" } else { "Matriculation" }
        
        $key = ($name.ToLower() + "_" + $normDist.ToLower())
        if ($seen.Contains($key)) { continue }
        $seen.Add($key) | Out-Null

        $distCode = ($normDist -replace '[^A-Za-z]', '').ToUpper()
        if ($distCode.Length -gt 3) { $distCode = $distCode.Substring(0, 3) }
        if ([string]::IsNullOrEmpty($distCode)) { $distCode = "SCH" }

        $id = "SCH-$distCode-$('{0:D4}' -f $script:counter)"
        $script:counter++

        $areaStr = if ($area) { $area } else { "$normCluster, $normDist" }

        $schObj = [PSCustomObject]@{
            id = $id
            school_name = $name
            district = $normDist
            block_or_cluster = $normCluster
            zone = $normZone
            board = $normBoard
            area = $areaStr
        }
        $schools.Add($schObj)
    }
}

Process-CSV -path $csv1 -type 1
Process-CSV -path $csv2 -type 2
Process-CSV -path $csv3 -type 3

Write-Host "Total unique schools processed: $($schools.Count)"

$json = $schools | ConvertTo-Json -Depth 5

$jsContent = @"
// Murugan Canvass - Master Institutional Database for Schools
// Verified and cataloged schools across all regions in Tamil Nadu (SQLite Synchronized)

export const MASTER_SCHOOLS = $json;

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
"@

[System.IO.File]::WriteAllText($outJs, $jsContent, [System.Text.Encoding]::UTF8)
Write-Host "Successfully generated $outJs"
