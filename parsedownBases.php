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

    // Define this helper inside your class or before calling it
    function glob_recursive($pattern, $flags = 0) {
        $files = glob($pattern, $flags);
        foreach (glob(dirname($pattern) . '/*', GLOB_ONLYDIR | GLOB_NOSORT) as $dir) {
            $files = array_merge($files, glob_recursive($dir . '/' . basename($pattern), $flags));
        }
        return $files;
    }

    // Then use it like this in renderTable:
    $allFiles = glob_recursive($scanDir . '/*.md');
    // Searches for all Markdown files in the current folder and subfolders (using index.md patterns).

    $findProp = function ($props, $id, $mdFile = null) use ($markdownDir) {
        // Strip prefixes so "file.folder" becomes "folder"
        $id = str_replace(['file.', 'note.', 'prop.'], '', $id);

        if ($mdFile) {
            $relativePath = ltrim(str_replace(realpath($markdownDir), '', realpath($mdFile)), '/');
            switch (strtolower($id)) {
                case 'folder': return dirname($relativePath);
                case 'path': return $relativePath;
                case 'ext': return pathinfo($mdFile, PATHINFO_EXTENSION);
                case 'name': return pathinfo($mdFile, PATHINFO_FILENAME);
                case 'title': return $props['title'] ?? pathinfo($mdFile, PATHINFO_FILENAME);
            }
        }

        // 3. ACTUAL PROPERTIES: Check the YAML frontmatter
        if (isset($props[$id])) return $props[$id];
        
        // Fuzzy match for spaces/casing
        $cleanId = strtolower(str_replace([' ', '_', '-'], '', $id));
        foreach ($props as $key => $val) {
            if (strtolower(str_replace([' ', '_', '-'], '', $key)) === $cleanId) return $val;
        }
        return '';
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
        return $this->matchesFilters($props, $baseFilters, $findProp, $mdFile);
    });

    // --- APPLY SORTING ---
    $sortConfig = $baseData['views'][$viewIndex]['sort'] ?? [];

    if (!empty($sortConfig)) {
        usort($mdFiles, function($a, $b) use ($sortConfig, $findProp) {
            foreach ($sortConfig as $s) {
                $propId = $s['property'] ?? '';
                $direction = strtolower($s['direction'] ?? 'asc');

                // 1. Get properties for both files
                $contentA = file_get_contents($a);
                $contentB = file_get_contents($b);
                $propsA = []; $propsB = [];

                if (preg_match('/^---\s*([\s\S]*?)\s---/u', $contentA, $m)) { $propsA = Spyc::YAMLLoad($m[1]); }
                if (preg_match('/^---\s*([\s\S]*?)\s---/u', $contentB, $m)) { $propsB = Spyc::YAMLLoad($m[1]); }

                // 2. Get specific values (handle Name/File specially)
                $valA = ($propId === 'name' || $propId === 'file') ? basename($a, '.md') : $findProp($propsA, $propId);
                $valB = ($propId === 'name' || $propId === 'file') ? basename($b, '.md') : $findProp($propsB, $propId);

                // 3. Compare (Numeric vs String)
                if (is_numeric($valA) && is_numeric($valB)) {
                    $cmp = $valA <=> $valB;
                } else {
                    $cmp = strcasecmp((string)$valA, (string)$valB);
                }

                // 4. Return based on direction
                if ($cmp !== 0) {
                    return ($direction === 'desc') ? -$cmp : $cmp;
                }
            }
            return 0;
        });
    }

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
                    $cellValue = implode(', ', array_map(function ($i) use ($markdownDir) {
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

        // 1. slugifying note references in the formula i.e. note["Actual Age"] -> Actual_Age
        $expr = preg_replace_callback('/(?:note|prop)\[["\'](.*?)["\']\]/', function($m) {
            return str_replace(' ', '_', $m[1]); 
        }, $expr);

        // 2. Standard syntax cleanup
        $expr = str_replace(['note.', 'prop.', '!= null'], ['', '', '!= ""'], $expr);

        // Use a Regex to only replace '+' with '~' if it's touching a quote or a closing parenthesis 
        // followed by a quote. This protects math like "25 + 25".
        $expr = preg_replace('/"\s*\+\s*/', '" ~ ', $expr); // "text" + ...
        $expr = preg_replace('/\s*\+\s*"/', ' ~ "', $expr); // ... + "text"

        // 3. Wrap every property in our Proxy Object
        $variables = [];
        foreach ($props as $k => $v) {
            $cleanK = str_replace(' ', '_', $k);
            $variables[$cleanK] = new MetadataWrapper($v);
        }

        // FIX: Create a proper metadata array for the 'file' object
        $fileMeta = [
            'name'   => $displayName,
            'folder' => (isset($props['folder'])) ? $props['folder'] : '', 
            'path'   => (isset($props['path'])) ? $props['path'] : ''
        ];

        $variables['name'] = new MetadataWrapper($displayName);
        $variables['file'] = new MetadataWrapper($fileMeta); // Now .folder exists!

        try {
            $result = $this->el->evaluate($expr, $variables);
            
            // If the result is our wrapper object, get the internal value
            if ($result instanceof MetadataWrapper) {
                // You might need a getter or make the property public
                // For now, let's assume __toString handles it or use a getValue() method
                $result = (string)$result; 
            }

            return str_replace("\n", "<br>", (string)$result);
        } catch (\Exception $e) {
            // Log error for debugging if needed: error_log($e->getMessage());
            return $expression; 
        }
    }

    private function matchesFilters($props, $filterGroup, $findProp, $mdFile) {
        if (empty($filterGroup)) return true;

        // 1. Recursive AND/OR handling
        if (isset($filterGroup['and']) && is_array($filterGroup['and'])) {
            foreach ($filterGroup['and'] as $sub) {
                if (!$this->matchesFilters($props, $sub, $findProp, $mdFile)) return false;
            }
            return true;
        }

        // 2. Handle String-style Filters
        if (is_string($filterGroup)) {
            $f = trim($filterGroup);
            $isNot = str_starts_with($f, '!');
            $f = ltrim($f, '!');

            // Pattern handles: note["Prop"], file.prop, or just Prop
            // Group 1 & 2 = Property Name, Group 3 = Method, Group 4 = Value
            $pattern = '/(?:(?:note|prop|file)\[["\'](.*?)["\']\]|([\w.]+))\.(contains|endsWith|startsWith|isEmpty|isNotEmpty)\((.*?)\)/';
            
            if (preg_match($pattern, $f, $m)) {
                $propId = !empty($m[1]) ? $m[1] : $m[2];
                $method = $m[3];
                $expected = trim($m[4], "\"' ");
                
                $actual = $findProp($props, $propId, $mdFile);
                
                $res = false;
                switch ($method) {
                    case 'contains': 
                        if (is_array($actual)) {
                            // Check if the string exists anywhere in the list
                            $res = in_array($expected, $actual);
                        } else {
                            $res = str_contains((string)$actual, $expected);
                        }
                        break;
                    case 'endsWith': 
                        $res = str_ends_with(is_array($actual) ? implode(' ', $actual) : (string)$actual, $expected); 
                        break;
                    case 'isEmpty': 
                        $res = empty($actual) || (is_string($actual) && trim($actual) === ''); 
                        break;
                    case 'isNotEmpty': 
                        $res = !empty($actual) && (!is_string($actual) || trim($actual) !== ''); 
                        break;
                }
                return $isNot ? !$res : $res;
            }

            // Handle Comparison Operators: == and !=
            $compPattern = '/(?:(?:note|prop|file)\[["\'](.*?)["\']\]|([\w.]+))\s*(==|!=)\s*["\'](.*?)["\']/';
            if (preg_match($compPattern, $f, $m)) {
                $propId = !empty($m[1]) ? $m[1] : $m[2];
                $op = $m[3];
                $expected = $m[4];
                $actual = $findProp($props, $propId, $mdFile);
                
                $match = ($actual == $expected);
                return ($op === '==') ? $match : !$match;
            }
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

    public function __get($name) {
        if (is_array($this->data) && isset($this->data[$name])) {
            return new MetadataWrapper($this->data[$name]);
        }
        return new MetadataWrapper("");
    }

    public function split($delimiter) {
        if (is_array($this->data)) return $this;
        $parts = explode($delimiter, (string)$this->data);
        return new MetadataWrapper($parts);
    }

    public function slice($start, $end = null) {
        if (!is_array($this->data)) return $this;
        // Bases uses 0-based indexing for slice
        $sliced = array_slice($this->data, $start, $end);
        return new MetadataWrapper($sliced);
    }

    public function __toString() {
        if (is_array($this->data)) return implode(', ', $this->data);
        return (string)($this->data ?? '');
    }
}