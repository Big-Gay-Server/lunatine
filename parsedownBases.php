<?php
// Opens the PHP code block.

require_once 'Parsedown.php'; 
// Imports the base Parsedown library. 'require_once' ensures the script stops if the file is missing.

require_once __DIR__ . '/vendor/autoload.php';
use Symfony\Component\ExpressionLanguage\ExpressionLanguage;
// imports composer stuff?

class ParsedownBases extends Parsedown {
// Defines a new class that "inherits" from Parsedown, allowing it to use and extend Markdown features.
    private $el;

    public function __construct() {
        $this->el = new \Symfony\Component\ExpressionLanguage\ExpressionLanguage();

        $this->el->register('if', function($arg) { return ''; }, function($variables, $condition, $trueValue, $falseValue) {
            return $condition ? $trueValue : $falseValue;
        });
        
        // ONLY register simple conversion functions
        $this->el->register('toString', function($arg) { return ''; }, function($args, $val) {
            return is_array($val) ? implode(', ', $val) : (string)$val;
        });

        $this->el->register('contains', function($arg) { return ''; }, function($args, $haystack, $needle) {
            return str_contains((string)$haystack, (string)$needle);
        });

        $this->el->register('number', function($arg) { return ''; }, function($args, $val) {
            return (float)$val;
        });

        $this->el->register('round', function($arg) { return ''; }, function($args, $val) {
            return round((float)$val);
        });
    }


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

    private function evaluateObsidianFormula($expression, $props, $displayName) {
        $expr = $expression;

        // A. THE MAGIC STEP: Convert dot-notation to function-notation for PHP
        // This turns 'X.toString()' into 'toString(X)' and 'X.round()' into 'round(X)'
        // We run it twice to catch "chained" dots like .round().toString()
        for ($i = 0; $i < 2; $i++) {
            $expr = preg_replace('/([\w_"\'\[\]]+)\.(toString|round|contains|number)\((.*?)\)/', '$2($1, $3)', $expr);
            $expr = preg_replace('/([\w_"\'\[\]]+)\.(toString|round|contains|number)\(\)/', '$2($1)', $expr);
        }

        // B. note["Actual Age"] -> Actual_Age
        $expr = preg_replace_callback('/(note|prop)\[["\'](.*?)["\']\]/', function($m) {
            return str_replace(' ', '_', $m[2]); 
        }, $expr);

        // C. Clean up remaining prefixes and plus signs
        $expr = str_replace(['note.', 'prop.', '+', '!= null'], ['', '', '~', '!= ""'], $expr);

        // D. Prepare Variables
        $variables = [];
        foreach ($props as $k => $v) {
            $variables[str_replace(' ', '_', $k)] = $v;
        }
        $variables['name'] = $displayName;

        try {
            return (string)$this->el->evaluate($expr, $variables);
        } catch (\Exception $e) {
            // Log this to see the "Final Expr" if it fails
            // error_log("Bases Error: " . $e->getMessage() . " | Expr: " . $expr);
            return $expression; 
        }
    }
    private function evaluateOperator($actual, $op, $expected) {
        // Normalize inputs (trim whitespace, handle nulls)
        $actual = $actual ?? '';
        $expected = $expected ?? '';

        switch ($op) {
            case 'is':
            case '==': return $actual == $expected;
            case 'is not':
            case '!=': return $actual != $expected;
            case 'contains':
                return is_array($actual) ? in_array($expected, $actual) : str_contains((string)$actual, (string)$expected);
            case 'does not contain':
                return is_array($actual) ? !in_array($expected, $actual) : !str_contains((string)$actual, (string)$expected);
            case 'is empty': return empty($actual);
            case 'is not empty': return !empty($actual);
            case '>':
            case 'is after': return $actual > $expected;
            case '<':
            case 'is before': return $actual < $expected;
            case '>=': return $actual >= $expected;
            case '<=': return $actual <= $expected;
            case 'starts with': return str_starts_with((string)$actual, (string)$expected);
            case 'ends with': return str_ends_with((string)$actual, (string)$expected);
            default: return true; // Default to showing the row if operator is unknown
        }
    }
}
// Closes the class definition.
?>
