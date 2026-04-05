<?php
// Opens the PHP code block.

require_once 'Parsedown.php'; 
// Imports the base Parsedown library. 'require_once' ensures the script stops if the file is missing.

class ParsedownBases extends Parsedown {
// Defines a new class that "inherits" from Parsedown, allowing it to use and extend Markdown features.

    // --- BASES RENDERER ---
    public function renderTable($basePath, $currentPage, $markdownDir, $targetViewName = null)
    {
    // A public function that takes the file path, the current page (to exclude it), the root directory, and an optional view name.

    if (!file_exists($basePath)) {
        return '<i>(Base file not found)</i>';
    }
    // Checks if the .base (YAML) file exists. If not, it returns an error message instead of crashing.

    $baseData = Spyc::YAMLLoad($basePath);
    // Uses the 'Spyc' library to convert the YAML content of the .base file into a PHP associative array.

    $viewIndex = 0;
    // Initializes a variable to track which "view" configuration to use from the YAML.

    if (isset($baseData['views'])) {
        foreach ($baseData['views'] as $idx => $view) {
            // Loops through the views defined in the base file.
            
            if ($targetViewName && strtolower($view['name'] ?? '') === strtolower($targetViewName)) {
                $viewIndex = $idx;
                break;
            }
            // If a specific view name was requested and matches, save that index and stop looking.

            if (!$targetViewName && ($view['type'] ?? '') === 'table') {
                $viewIndex = $idx;
            }
            // If no name was requested, default to the first view marked as a 'table'.
        }
    }

    $order = $baseData['views'][$viewIndex]['order'] ?? [];
    // Retrieves the list of columns (properties) to display, defaulting to an empty list if none exist.

    $scanDir = dirname($basePath);
    // Gets the directory path where the .base file lives.

    $allFiles = array_merge(glob($scanDir . '/*/index.md'), glob($scanDir . '/*.md'));
    // Searches for all Markdown files in the current folder and subfolders (using index.md patterns).

    $baseFilter = $baseData['views'][$viewIndex]['filters'] ?? [];

    $mdFiles = array_filter($allFiles, fn($f) => realpath($f) !== realpath($currentPage) && basename($f) !== 'bio.md');
    // Filters out the current page you are viewing and any 'bio.md' files from appearing in the table.

    $findProp = function ($props, $id) {
        // Defines a helper function (closure) to find metadata values regardless of naming style (e.g., 'Full Name' vs 'fullname').

        if (isset($props[$id])) {
            return $props[$id];
        }
        // Direct match check.

        $cleanId = strtolower(str_replace([' ', '_', '-'], '', $id));
        // Strips spaces, underscores, and dashes to create a "normalized" ID for comparison.

        foreach ($props as $key => $val) {
            if (strtolower(str_replace([' ', '_', '-'], '', $key)) === $cleanId) {
                return $val;
            }
        }
        // Loops through all metadata keys to find a normalized match.

        return '';
        // Returns an empty string if the property isn't found.
    };

    $tableHtml = "<base-embed><table class='bases-table'><thead><tr>";
    // Starts the HTML string for the table structure.

    foreach ($order as $colId) {
        // Loops through the column IDs defined in the YAML 'order'.

        $colName = preg_replace(['/formula\[["\'](.*)["\']\]/', '/formula\./', '/note\./', '/file\./'], ['$1', '', '', ''], $colId);
        // Uses Regular Expressions to clean up technical prefixes like 'formula.' so the header looks like "Name" instead of "note.Name".

        $colName = str_replace(['.', '_'], ' ', $colName);
        // Replaces dots and underscores with spaces for a cleaner UI.

        $tableHtml .= '<th>' . htmlspecialchars(strtolower($colName)) . '</th>';
        // Adds the column name to the table header, making it lowercase and safe from HTML injection.
    }
    $tableHtml .= '</tr></thead><tbody>'; 
    // Closes the header section and starts the table body.

    foreach ($mdFiles as $mdFile) {
        // Loops through every Markdown file found earlier to create a table row.

        $displayName = (basename($mdFile) === 'index.md') ? basename(dirname($mdFile)) : basename($mdFile, '.md');
        // Determines the "Name" of the file: if it's 'index.md', use the folder name; otherwise, use the filename.

        $finalUrl = create_wiki_url(str_replace([$markdownDir, '.md'], '', $mdFile));
        // Generates a clickable link to the page (uses a custom function `create_wiki_url`).

        $rawContent = file_get_contents($mdFile);
        // Reads the entire text of the Markdown file.

        $props = [];
        if (preg_match('/^---\s*([\s\S]*?)\s---/u', $rawContent, $matches)) {
            $props = Spyc::YAMLLoad($matches[1]);
        }
        // Extracts the "Frontmatter" (the YAML between the --- lines at the top of the file) into an array.

        $tableHtml .= "<tr onclick=\"if(event.target.closest('a')===null){window.location='$finalUrl';}\" style='cursor:pointer;'>";
        // Creates the row. If the user clicks anywhere on the row (except a link), it redirects them to that page.

        $linkPlaced = false;
        // A flag to ensure we only place a clickable text link in the first available cell.

        foreach ($order as $propId) {
                $val = '';
                $cleanFormulaId = str_replace('formula.', '', $propId);

                if (isset($baseData['formulas'][$cleanFormulaId])) {
                    $expression = (string)$baseData['formulas'][$cleanFormulaId];
                    $val = $this->evaluateObsidianFormula($expression, $props, $displayName);
                } else {
                    $cleanPropId = str_replace(['note.', 'file.'], '', $propId);
                    $val = ($cleanPropId === 'name' || $cleanPropId === 'file') 
                        ? $displayName 
                        : $findProp($props, $cleanPropId);
                }

                // --- FORMATTING LOGIC ---
                if (is_array($val)) {
                    $cellValue = implode('', array_map(function ($i) use ($markdownDir) {
                        $flatItem = is_array($i) ? implode(', ', $i) : (string)$i;
                        $rendered = render_wiki_markup_html($this->line($flatItem), $markdownDir, $this, true);
                        return "<span class='prop-pill'>" . $rendered . "</span>";
                    }, $val));
                } elseif (is_string($val) && str_contains($val, '<br>')) {
                    $cellValue = render_wiki_markup_html($val, $markdownDir, $this, true);
                } else {
                    $safeVal = (is_array($val)) ? '' : (string)$val; 
                    $cellValue = render_wiki_markup_html($this->line($safeVal), $markdownDir, $this, true);
                }

                // --- CELL PLACEMENT ---
                $isEmbed = (is_string($cellValue) && str_contains($cellValue, '<img'));
                if (!$linkPlaced && !$isEmbed && !empty(trim((string)(is_array($val) ? implode($val) : $val)))) {
                    $tableHtml .= "<td><a href='$finalUrl' class='file-link'>$cellValue</a></td>";
                    $linkPlaced = true;
                } else {
                    $tableHtml .= "<td>" . ($cellValue ?: '&nbsp;') . "</td>";
                }
            } 
            $tableHtml .= '</tr>';
        }

        return $tableHtml . '</tbody></table>';
    }

    private function evaluateObsidianFormula($expression, $vars, $displayName) {
    // A private helper to handle "Formulas" (Logic inside the table).

    if (str_contains($expression, 'Actual Age')) {
        // Specifically looks for logic related to a custom "Age" calculation.

        $age = $vars['Actual Age'] ?? null; 
        $species = (string)($vars['Species'] ?? '');
        // Pulls the 'Actual Age' and 'Species' metadata from the page.

        if ($age === null || $age === '') return "Unknown Age";

        $ageNum = (float)$age;
        $appearsAge = $ageNum;

        if (str_contains($species, "Selhae") && $ageNum > 25) {
            $appearsAge = (($ageNum - 25) / 25) + 25;
        }
        // Custom world-building logic: If species is 'Selhae', calculate their "apparent" age differently after 25.

        return $ageNum . " years<br><i>appears " . round($appearsAge) . "</i>";
        // Returns two lines of text: the real age and the visual age.
    }

    if (str_contains($expression, '+')) {
        // Handles simple string concatenation (joining text).

        $parts = explode('+', $expression);
        $out = '';
        foreach ($parts as $part) {
            $part = trim($part);
            if (preg_match('/^["\'](.*)["\']$/', $part, $lit)) {
                $out .= str_replace('\n', '<br>', $lit[1]);
            } 
            // If the part is a literal string (in quotes), add it to the output.

            else {
                $clean = str_replace(['note[', ']', '"', "'", 'this.'], '', $part);
                $out .= ($clean === 'file.name') ? $displayName : ($vars[$clean] ?? '');
            }
            // Otherwise, treat the part as a variable name and fetch its value from the metadata.
        }
        return $out;
    }

    return $expression; 
    // If it's not a special formula, just return the raw expression.
    }

}
// Closes the class definition.
?>
