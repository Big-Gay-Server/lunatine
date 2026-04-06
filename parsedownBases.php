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

        // Standard Functions
        $this->el->register('if', function($arg) { return ''; }, function($vars, $cond, $true, $false) {
            // 1. Evaluate the condition (cast to string/bool if it's an object)
            $boolCond = (is_object($cond)) ? (bool)(string)$cond : (bool)$cond;
            
            // 2. Pick the result
            $result = $boolCond ? $true : $false;
            
            // 3. WRAP THE RESULT: This allows .round() to be called on the output of the 'if'
            return new MetadataWrapper($result);
        });
        // Fix for 'number'
        $this->el->register('number', function($arg) { return ''; }, function($vars, $val) {
            // Explicitly cast the object to a string before converting to float
            $strValue = (is_object($val) && method_exists($val, '__toString')) ? (string)$val : $val;
            return (float)$strValue;
        });

        // Fix for 'round'
        $this->el->register('round', function($arg) { return ''; }, function($vars, $val) {
            // Explicitly cast the object to a string before rounding
            $strValue = (is_object($val) && method_exists($val, '__toString')) ? (string)$val : $val;
            return round((float)$strValue);
        });
        $this->el->register('toString', function($arg) { return ''; }, function($vars, $v) { 
            return is_array($v) ? implode(', ', $v) : (string)$v; 
        });
        $this->el->register('hasValue', function($arg) { return ''; }, function($vars, $haystack, $needle) {
            return str_contains((string)$haystack, (string)$needle);
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

    $allFiles = array_merge(glob($scanDir . '/*/index.md'), glob($scanDir . '/*.md'), glob($scanDir . '/*/*.md'));
    // Searches for all Markdown files in the current folder and subfolders (using index.md patterns).

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

    // Find the right filters for the "web" view
    $baseFilters = $baseData['views'][$viewIndex]['filters'] ?? [];

    $mdFiles = array_filter($allFiles, function($mdFile) use ($currentPage, $baseFilters, $findProp) {
        if (realpath($mdFile) === realpath($currentPage) || basename($mdFile) === 'bio.md') return false;

        $content = file_get_contents($mdFile);
        $props = [];
        if (preg_match('/^---\s*([\s\S]*?)\s---/u', $content, $matches)) {
            $props = Spyc::YAMLLoad($matches[1]);
        }

        // Call the new string-aware matcher
        return $this->matchesFilters($props, $baseFilters, $findProp);
    });

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

        // 1. note["Actual Age"] -> Actual_Age
        $expr = preg_replace_callback('/(?:note|prop)\[["\'](.*?)["\']\]/', function($m) {
            return str_replace(' ', '_', $m[1]); 
        }, $expr);

        // 2. Standard syntax cleanup (Keep the dots! The wrapper handles them now)
        $expr = str_replace(['note.', 'prop.', '+', '!= null'], ['', '', '~', '!= ""'], $expr);

        // 3. Wrap every property in our Proxy Object
       $variables = [];
        foreach ($props as $k => $v) {
            $cleanK = str_replace(' ', '_', $k);
            // Wrap the value so Symfony treats it as an object with methods
            $variables[$cleanK] = new MetadataWrapper($v);
        }
        $variables['name'] = new MetadataWrapper($displayName);
        $variables['file'] = new MetadataWrapper($displayName);

        try {
            $result = (string)$this->el->evaluate($expr, $variables);
            // Convert Obsidian newlines to HTML breaks
            return str_replace("\n", "<br>", $result);
        } catch (\Exception $e) {
            return $expression; 
        }
    }

    private function matchesFilters($props, $filterGroup, $findProp) {
        if (empty($filterGroup)) return true;

        // Handle the 'and' array inside the YAML
        if (isset($filterGroup['and']) && is_array($filterGroup['and'])) {
            foreach ($filterGroup['and'] as $subFilter) {
                // Recursive call for each item in the 'and' list
                if (!$this->matchesFilters($props, $subFilter, $findProp)) return false;
            }
            return true;
        }

        // --- NEW: Handle the string filter style "!Species.isEmpty()" ---
        if (is_string($filterGroup)) {
            $filterStr = $filterGroup;
            $isNot = str_starts_with($filterStr, '!');
            $cleanFilter = ltrim($filterStr, '!');

            // Handle .isEmpty()
            if (str_ends_with($cleanFilter, '.isEmpty()')) {
                $propId = str_replace('.isEmpty()', '', $cleanFilter);
                
                // note["Character Type"] style cleaning
                $propId = preg_replace('/note\[["\'](.*?)["\']\]/', '$1', $propId);
                
                $actual = $findProp($props, $propId);
                $isEmpty = empty($actual) || $actual === '';
                
                return $isNot ? !$isEmpty : $isEmpty;
            }
        }

        // --- Keep the old Object-style filter support just in case ---
        if (is_array($filterGroup)) {
            $propId = $filterGroup['property'] ?? '';
            $operator = $filterGroup['operator'] ?? 'is';
            $expected = $filterGroup['value'] ?? '';
            $actual = $findProp($props, $propId);
            return $this->evaluateOperator($actual, $operator, $expected);
        }

        return true;
    }

    private function evaluateOperator($actual, $op, $expected) {
        // Normalize inputs (trim whitespace, handle nulls)
        $actual = $actual ?? '';
        $expected = $expected ?? '';
                
        if (is_object($actual) && method_exists($actual, '__toString')) {
            $actual = (string)$actual;
        }

        switch ($op) {
            case 'is':
            case '==': return $actual == $expected;
            case 'is not':
            case '!=': return $actual != $expected;
            case 'contains':
                // If it's a Wrapper object, get the internal data
                $data = (is_object($actual)) ? $actual->data : $actual;
                return is_array($data) ? in_array($expected, $data) : str_contains((string)$data, (string)$expected);
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

class MetadataWrapper {
    public $data;

    public function __construct($data) {
        $this->data = ($data instanceof MetadataWrapper) ? $data->data : $data;
    }

    // --- THE FIX: Handle missing properties like .folder ---
    public function __get($name) {
        // If the formula asks for .folder or .path, return an empty wrapper
        // This stops the "Undefined property" warning
        return new MetadataWrapper("");
    }

    public function toString() { return $this; }
    
    public function round() { 
        $val = (float)((string)$this);
        return new MetadataWrapper(round($val)); 
    }

    public function contains($needle) {
        return str_contains(strtolower((string)$this), strtolower((string)$needle));
    }

    public function __toString() {
        if (is_array($this->data)) return implode(', ', $this->data);
        return (string)($this->data ?? '');
    }
}