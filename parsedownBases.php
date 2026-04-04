<?php
require_once 'Parsedown.php';

class ParsedownBases extends Parsedown {

    // --- BASES RENDERER ---
    // This method renders a .base file as an HTML table.
    public function renderTable($basePath, $currentPage, $markdownDir, $targetViewName = null)
    {
    // If the .base file is missing, return a placeholder.
    if (!file_exists($basePath)) {
        return '<i>(Base file not found)</i>';
    }

    // Load YAML data from the .base file.
    $baseData = Spyc::YAMLLoad($basePath);

    // Choose the correct view index from the base file.
    $viewIndex = 0;
    if (isset($baseData['views'])) {
        foreach ($baseData['views'] as $idx => $view) {
            if ($targetViewName && strtolower($view['name'] ?? '') === strtolower($targetViewName)) {
                $viewIndex = $idx;
                break;
            }
            if (!$targetViewName && ($view['type'] ?? '') === 'table') {
                $viewIndex = $idx;
            }
        }
    }

    // Get the ordered columns for the table.
    $order = $baseData['views'][$viewIndex]['order'] ?? [];

    // Build the list of markdown pages to include in the table.
    $scanDir = dirname($basePath);
    $allFiles = array_merge(glob($scanDir . '/*/index.md'), glob($scanDir . '/*.md'));
    $mdFiles = array_filter($allFiles, fn($f) => realpath($f) !== realpath($currentPage) && basename($f) !== 'bio.md');

    // Normalize property names and find values from page YAML.
    $findProp = function ($props, $id) {
        if (isset($props[$id])) {
            return $props[$id];
        }
        $cleanId = strtolower(str_replace([' ', '_', '-'], '', $id));
        foreach ($props as $key => $val) {
            if (strtolower(str_replace([' ', '_', '-'], '', $key)) === $cleanId) {
                return $val;
            }
        }
        return '';
    };

    // Start the HTML table and render the header row.
    $tableHtml = "<base-embed><table class='bases-table'><thead><tr>";
    
    foreach ($order as $colId) {
        // Strips 'formula.', 'note.', and the Obsidian formula syntax '["..."]'
        $colName = preg_replace(['/formula\[["\'](.*)["\']\]/', '/formula\./', '/note\./', '/file\./'], ['$1', '', '', ''], $colId);
        $colName = str_replace(['.', '_'], ' ', $colName);
        
        $tableHtml .= '<th>' . htmlspecialchars(strtolower($colName)) . '</th>';
    }
    $tableHtml .= '</tr></thead><tbody>'; 

    // Render each markdown page as a row in the table.
    foreach ($mdFiles as $mdFile) {
        $displayName = (basename($mdFile) === 'index.md') ? basename(dirname($mdFile)) : basename($mdFile, '.md');
        $finalUrl = create_wiki_url(str_replace([$markdownDir, '.md'], '', $mdFile));

        $rawContent = file_get_contents($mdFile);
        $props = [];
        if (preg_match('/^---\s*([\s\S]*?)\s---/u', $rawContent, $matches)) {
            $props = Spyc::YAMLLoad($matches[1]);
        }

        // Make the whole row clickable, but ignore clicks on inner anchor tags.
        $tableHtml .= "<tr onclick=\"if(event.target.closest('a')===null){window.location='$finalUrl';}\" style='cursor:pointer;'>";
        $linkPlaced = false;

        foreach ($order as $propId) {
            $val = '';
            $cleanFormulaId = str_replace('formula.', '', $propId);

            // 1. Check if it's a Formula
            if (isset($baseData['formulas'][$cleanFormulaId])) {
                $expression = (string)$baseData['formulas'][$cleanFormulaId];
                $val = $this->evaluateObsidianFormula($expression, $props, $displayName);
            } 
            // 2. Otherwise, treat as a Standard Property
            else {
                $cleanPropId = str_replace(['note.', 'file.'], '', $propId);
                $val = ($cleanPropId === 'name' || $cleanPropId === 'file') 
                    ? $displayName 
                    : $findProp($props, $cleanPropId);
            }

            // 3. Render Output (Handle <br> and Arrays)
            if (is_string($val) && str_contains($val, '<br>')) {
                $cellValue = render_wiki_markup_html($val, $markdownDir, $this, true);
            } else {
                $cellValue = is_array($val)
                    ? implode(', ', array_map(function ($i) use ($markdownDir) {
                        $item = $this->line((string)$i);
                        return "<span class='prop-pill'>" . render_wiki_markup_html($item, $markdownDir, $this, true) . "</span>";
                    }, $val))
                    : render_wiki_markup_html($this->line((string)$val), $markdownDir, $this, true);
            }

            // 4. Build Table Cell
            $isEmbed = (is_string($cellValue) && str_contains($cellValue, '<img'));
            if (!$linkPlaced && !$isEmbed && !empty(trim((string)$val))) {
                $tableHtml .= "<td><a href='$finalUrl' class='file-link'>$cellValue</a></td>";
                $linkPlaced = true;
            } else {
                $tableHtml .= "<td>" . ($cellValue ?: '&nbsp;') . "</td>";
            }
        } // End of foreach ($order)
        
        
        $tableHtml .= '</tr>';
    }

    return $tableHtml . '</tbody></table>';
    }
        private function evaluateObsidianFormula($expression, $vars, $displayName) {
    // 1. Handle the "calc age" logic specifically
    if (str_contains($expression, 'Actual Age')) {
        // Use your $findProp helper to get the values
        $age = $vars['Actual Age'] ?? null; 
        $species = (string)($vars['Species'] ?? '');

        if ($age === null || $age === '') return "Unknown Age";

        $ageNum = (float)$age;
        $appearsAge = $ageNum;

        // Reproduce your Obsidian logic:
        // if(contains("Selhae"), if(age > 25, ((age-25)/25)+25, age), age)
        if (str_contains($species, "Selhae") && $ageNum > 25) {
            $appearsAge = (($ageNum - 25) / 25) + 25;
        }

        // OUTPUT: Matches your Obsidian screenshot (Years \n <i>appears Age)
        // Notice: NO $species variable in the string!
        return $ageNum . " years<br><i>appears " . round($appearsAge) . "</i>";
    }

    // 2. Handle Simple Concatenation (Full Name + "\n" + Pronunciation)
    if (str_contains($expression, '+')) {
        $parts = explode('+', $expression);
        $out = '';
        foreach ($parts as $part) {
            $part = trim($part);
            if (preg_match('/^["\'](.*)["\']$/', $part, $lit)) {
                $out .= str_replace('\n', '<br>', $lit[1]);
            } else {
                // Strip note[" "] syntax
                $clean = str_replace(['note[', ']', '"', "'", 'this.'], '', $part);
                $out .= ($clean === 'file.name') ? $displayName : ($vars[$clean] ?? '');
            }
        }
        return $out;
    }

    return $expression; 
}

}

?>