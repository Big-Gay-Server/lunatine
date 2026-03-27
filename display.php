<?php
// --- IMPORTING EXTERNAL LIBRARIES ---
require_once 'Parsedown.php'; // parses markdown to HTML.
require_once 'Spyc.php'; // parses YAML to HTML.
require_once 'imageparser.php'; // parses obsidian image links
require_once 'filefinder.php'; // parses 

$Spyc = new Spyc();
$templateDir = __DIR__ . '/templates/';

// --- this should hopefully parse the gloss blocks.
require_once 'parsedownGloss.php';
$Parsedown = new ParsedownGloss();

// --- ALLOWS FOR CASE-INSENSITIVITY IN URLS ---
function find_case_insensitive($baseDir, $path) {
    $segments = explode('/', trim($path, '/'));
    $currentPath = rtrim($baseDir, '/');
    foreach ($segments as $segment) {
        $items = glob($currentPath . '/*', GLOB_NOSORT);
        if (!$items) return null;
        $found = false;
        foreach ($items as $item) {
            if (strcasecmp(basename($item), $segment) === 0) {
                $currentPath = $item;
                $found = true;
                break;
            }
        }
        if (!$found) return null;
    }
    return $currentPath;
}

// --- LOCATE FILE FROM PATH ---

// takes the path from the url and looks for (in this order)
// index.md -> index.base -> exact .md file match
// this gets set to $filePath
$target = trim($requestedPath, '/');
$resolvedBase = find_case_insensitive($markdownDir, $target);

if ($resolvedBase && is_dir($resolvedBase)) {
    if (file_exists($resolvedBase . '/index.md')) $filePath = $resolvedBase . '/index.md';
    elseif (file_exists($resolvedBase . '/index.base')) $filePath = $resolvedBase . '/index.base';
    else $filePath = find_markdown_file($markdownDir, $target);
} elseif ($resolvedBase && file_exists($resolvedBase)) {
    $filePath = $resolvedBase;
} else {
    $filePath = find_markdown_file($markdownDir, $target);
}

$htmlContent = '';
$bioHtml = ''; 
$yamlData = [];       

// --- BASES RENDERER ---
$renderTable = function ($basePath, $currentPage, $targetViewName = null) use ($markdownDir, $Spyc, $Parsedown) {
    if (!file_exists($basePath)) return "<i>(Base file not found)</i>";
    $baseData = Spyc::YAMLLoad($basePath);
    $viewIndex = 0;
    if (isset($baseData['views'])) {
        foreach ($baseData['views'] as $idx => $v) {
            if ($targetViewName && strtolower($v['name'] ?? '') === strtolower($targetViewName)) { $viewIndex = $idx; break; }
            if (!$targetViewName && ($v['type'] ?? '') === 'table') { $viewIndex = $idx; }
        }
    }
    $order = $baseData['views'][$viewIndex]['order'] ?? [];
    $scanDir = dirname($basePath);
    $allFiles = array_merge(glob($scanDir . "/*/index.md"), glob($scanDir . "/*.md"));
    $mdFiles = array_filter($allFiles, fn($f) => realpath($f) !== realpath($currentPage) && basename($f) !== 'bio.md');

    $findProp = function ($props, $id) {
        if (isset($props[$id])) return $props[$id];
        $cleanId = strtolower(str_replace([' ', '_', '-'], '', $id));
        foreach ($props as $key => $val) {
            if (strtolower(str_replace([' ', '_', '-'], '', $key)) === $cleanId) return $val;
        }
        return '';
    };

    $tableHtml = "<table class='bases-table'><thead><tr>";
    foreach ($order as $colId) {
        $colName = ($colId === 'file.name' || $colId === 'file') ? 'file name' : str_replace(['formula.', '.', '_'], ['', ' ', ' '], $colId);
        $tableHtml .= "<th>" . htmlspecialchars(strtolower($colName)) . "</th>";
    }
    $tableHtml .= "</tr></thead><tbody>";

    foreach ($mdFiles as $mdFile) {
        $displayName = (basename($mdFile) === 'index.md') ? basename(dirname($mdFile)) : basename($mdFile, '.md');
        $urlPath = str_replace([$markdownDir, '.md', '/index', 'index'], '', $mdFile);
        $finalUrl = '/' . strtolower(trim($urlPath, '/'));
        $rawContent = file_get_contents($mdFile);
        $props = [];
        if (preg_match('/^---\s*([\s\S]*?)\s---/u', $rawContent, $matches)) $props = Spyc::YAMLLoad($matches[1]);
        
        $tableHtml .= "<tr>";
        $linkPlaced = false;
        foreach ($order as $propId) {
            $val = ($propId === 'file.name' || $propId === 'file') ? $displayName : $findProp($props, $propId);
            if (is_string($val) && str_contains($val, '!')) {
                $val = preg_replace_callback('/!\[\[\s*([^|\]]+)(\|(\d+))?\s*\]\]/', function($m) {
                    $src = '/' . ltrim(trim($m[1]), '/');
                    $width = $m[3] ?? '75';
                    return "<img src='$src' style='width:{$width}px; height:auto;'>";
                }, $val);
            }
            $isEmbed = (is_string($val) && str_contains($val, '<img'));
            $cellValue = is_array($val) ? implode(' ', array_map(fn($i) => "<span class='prop-pill'>".htmlspecialchars($i)."</span>", $val)) : ($isEmbed ? $val : $Parsedown->line((string)$val));
            if (!$linkPlaced && !$isEmbed && !empty(trim((string)$val))) {
                $tableHtml .= "<td><a href='$finalUrl' class='file-link'>$cellValue</a></td>";
                $linkPlaced = true;
            } else {
                $tableHtml .= "<td>$cellValue</td>";
            }
        }
        $tableHtml .= "</tr>";
    }
    return $tableHtml . "</tbody></table>";
};

// --- STANDARD MARKDOWN PROCESSING ---
if ($filePath && file_exists($filePath)) {
    $extension = pathinfo($filePath, PATHINFO_EXTENSION);
    if ($extension === 'base') {
        $htmlContent = $renderTable($filePath, $filePath);
    } else {
        $markdownToProcess = file_get_contents($filePath);
        $yamlData = [];

        // 1. Extract & Strip YAML Frontmatter
        if (preg_match('/^---\s*([\s\S]*?)\s---/u', $markdownToProcess, $matches)) {
            $yamlData = Spyc::YAMLLoad($matches[1]);
            $markdownToProcess = preg_replace('/^---\s*[\s\S]*?\s---/u', '', $markdownToProcess);
        }

        // LOAD IN BIO PAGE
        $bioFile = find_markdown_file($markdownDir, $requestedPath . '/bio');
        $bioToProcess = $bioFile ? file_get_contents($bioFile) : '';

        // --- THE PARSER TOOL ---
        $wikiParser = function($text) use ($yamlData, $markdownDir, $renderTable, $filePath, $Parsedown) {
            // --- NEW: MANUAL GLOSS PRE-PARSER ---
            $text = preg_replace_callback('/```gloss\n(.*?)\n```/s', function($match) {
                $lines = explode("\n", trim($match[1]));
                $alignedData = [];
                $metadata = [];
                $alignedTags = ['gla', 'glb', 'glc'];

                foreach ($lines as $line) {
                    $line = trim($line);
                    if (empty($line) || str_starts_with($line, '#')) continue;

                    if (preg_match('/^\\\\(gla|glb|glc)\s+(.*)/', $line, $m)) {
                        $alignedData[$m[1]] = explode(' ', $m[2]);
                    } elseif (preg_match('/^\\\\(\w+)\s+(.*)/', $line, $m)) {
                        $metadata[$m[1]] = $m[2];
                    }
                }

                $html = '<div class="gloss-container">';
                
                // 1. Top Metadata (Num, Label, Example)
                if (isset($metadata['num'])) $html .= '<span class="gloss-num">(' . $metadata['num'] . ')</span> ';
                if (isset($metadata['lbl'])) $html .= '<span class="gloss-lbl">' . $metadata['lbl'] . '</span> ';
                if (isset($metadata['ex'])) $html .= '<div class="gloss-ex">' . $metadata['ex'] . '</div>';

                // 2. Aligned Columns (A, B, C)
                $html .= '<div class="gloss-word-wrap">';
                $maxWords = max(array_map('count', $alignedData ?: [[]]));
                for ($i = 0; $i < $maxWords; $i++) {
                    $html .= '<div class="gloss-column">';
                    foreach ($alignedTags as $tag) {
                        if (isset($alignedData[$tag])) {
                            $word = $alignedData[$tag][$i] ?? '&nbsp;';
                            $html .= "<span class='gloss-$tag'>$word</span>";
                        }
                    }
                    $html .= '</div>';
                }
                $html .= '</div>';

                // 3. Bottom Metadata (Translation, Source)
                if (isset($metadata['ft'])) $html .= '<div class="gloss-ft">' . $metadata['ft'] . '</div>';
                if (isset($metadata['src'])) $html .= '<div class="gloss-src">' . $metadata['src'] . '</div>';

                return $html . '</div>';
            }, $text);
            // 1. DATA EMULATOR (Run this first while it is still raw text)
            $pattern = '/=\s*(?:default\()?\s*this\.character\.([a-zA-Z0-9_-]+)(?:\s*,\s*["\'](.*?)["\']\s*\))?/i';
            $text = preg_replace_callback($pattern, function($m) use ($yamlData) {
                $propName = $m[1];
                $fallback = $m[2] ?? '';
                $val = null;
                foreach ($yamlData as $k => $v) {
                    if (strtolower(str_replace([' ', '-', '_'], '', $k)) === strtolower(str_replace([' ', '-', '_'], '', $propName))) {
                        $val = $v; break;
                    }
                }
                if ($val !== null) return is_array($val) ? implode(', ', $val) : $val;
                return $fallback;
            }, $text);

            // 2. CLEAN UP RAW TEXT
            $text = preg_replace('/^character:\s*.*$/im', '', $text);

            // 3. CONVERT TO HTML (This creates the <table> and <thead> tags)
            $text = $Parsedown->text($text);

            // 1. Join split headers (ignores the inline styles Parsedown adds)
            $text = preg_replace_callback('/<thead>\s*<tr>\s*<th.*?>\s*(.*?)\s*<\/th>\s*<th.*?>\s*(.*?)\s*<\/th>.*?<\/thead>/is', function($m) {
                // $m[1] is "Biographical", $m[2] is "Information"
                $title = trim($m[1] . ' ' . $m[2]);
                return "<h3 class='bio-section-header'>$title</h3>";
            }, $text);
      
            // C. Shortcode Embedder
            $text = preg_replace_callback('/\[\s*embed_base\s*:\s*([^\]\s]+)\s*\]/i', function ($m) use ($renderTable, $filePath) {
                $parts = explode('#', trim($m[1]));
                return $renderTable(dirname($filePath) . '/' . $parts[0] . '.base', $filePath, $parts[1] ?? null);
            }, $text);

            // D. Wikilink Images !]
            $text = preg_replace_callback('/!\[\[(.*?)(\|(\d+))?\]\]/', function ($m) use ($markdownDir) {
                $imageName = trim($m[1]);
                $width = $m[3] ?? null;
                $path = find_image_path($markdownDir, $imageName);
                $style = $width ? "width:{$width}px;" : "max-width:100%;";
                return $path ? "<img src='$path' style='$style height:auto;'>" : "<i>(Image not found: $imageName)</i>";
            }, $text);

            // E. Wikilinks (LOWERCASE & NO INDEX)
            $text = preg_replace_callback('/\[\[(.*?)\]\]/', function ($m) {
                $p = explode('|', $m[1]);
                // Clean UID and .md extension
                $cleanPath = preg_replace('/\s[a-f0-9]{32}$/i', '', trim(str_replace('.md', '', $p[0])));
                // 1. Remove /index from the end
                // 2. Convert to lowercase for case-insensitivity
                $url = '/' . ltrim(strtolower(preg_replace('/\/index$/i', '', $cleanPath)), '/');
                $linkText = trim($p[1] ?? $p[0]);
                return "<a href='$url'>$linkText</a>";
            }, $text);

            return $text;
        };

        // Apply transformations to both pieces of content
        $bioHtml = $wikiParser($bioToProcess);
        $htmlContent = $wikiParser($markdownToProcess);
    }
}



// --- TEMPLATE PICKER ---
// 1. Check if the physical file is named index.md or index.base
$isIndexFile = (basename($filePath, '.md') === 'index' || basename($filePath, '.base') === 'index');

// 2. Check the depth of the requested URL
// If count is 1 (e.g. /characters), it's a Section Index.
// If count is > 1 (e.g. /characters/merisdae), it's an Individual Page.
$urlDepth = count($urlParts);

// 3. Determine Template Name
if ($isIndexFile && $urlDepth <= 1) {
    // Only use _index template for the actual root of the section
    $templateName = $section . '_index';
} else {
    // Everything else (subfolders or direct files) uses the standard section template
    $templateName = $section;
}

$specificTemplate = $templateDir . $templateName . '.php';

if (file_exists($specificTemplate)) {
    include $specificTemplate;
} elseif (file_exists($templateDir . $section . '.php')) {
    include $templateDir . $section . '.php';
} else {
    // DEFAULT LAYOUT
    echo '<div class="main-content">'.$htmlContent.'</div>';
}
?>