<?php
// --- IMPORTING EXTERNAL LIBRARIES ---
// Load the markdown parser, YAML parser, image helper, and file resolver.
require_once 'Parsedown.php';           // basic markdown to HTML parser
require_once 'parsedownGloss.php';      // extended parser for gloss blocks
require_once 'Spyc.php';                // YAML frontmatter parser
require_once 'imageparser.php';         // Obsidian-style image path resolver
require_once 'filefinder.php';          // finds markdown files by URL path

// Create instances used later in the file.
$Spyc = new Spyc();
$templateDir = __DIR__ . '/templates/';
$Parsedown = new ParsedownGloss();

// --- CASE-INSENSITIVE PATH RESOLUTION ---
// Find a filesystem path under $baseDir that matches $path ignoring case.
function find_case_insensitive($baseDir, $path)
{
    // Split the URL path into directory/file segments.
    $segments = explode('/', trim($path, '/'));
    $currentPath = rtrim($baseDir, '/');

    foreach ($segments as $segment) {
        // List all entries in the current directory.
        $items = glob($currentPath . '/*', GLOB_NOSORT);
        if (!$items) {
            return null; // no entries found, path does not exist
        }

        $found = false;
        foreach ($items as $item) {
            // Compare the segment against each entry without case sensitivity.
            if (strcasecmp(basename($item), $segment) === 0) {
                $currentPath = $item; // follow the matching entry
                $found = true;
                break;
            }
        }

        if (!$found) {
            return null; // no matching segment for this part of the path
        }
    }

    return $currentPath; // return the matched filesystem path
}

function create_wiki_url(string $path): string
{
    $path = rawurldecode($path);
    $path = preg_replace('/#.*$/', '', $path);
    $path = preg_replace('/\.md$/i', '', $path);
    $path = preg_replace('/\/index$/i', '', $path);
    $segments = array_filter(explode('/', trim($path, '/')),
        fn($segment) => $segment !== '');

    $slugSegments = array_map(function ($segment) {
        $segment = trim($segment);
        $segment = str_replace([' ', '_'], '-', $segment);
        $segment = preg_replace('/-+/', '-', $segment);
        return strtolower($segment);
    }, $segments);

    return '/' . implode('/', $slugSegments);
}

function render_wiki_markup_html(string $html, string $markdownDir, $Parsedown, bool $includePreviewAttr = false): string
{
    $html = preg_replace_callback('/!\[\[(.*?)(\|(\d+))?\]\]/', function ($m) use ($markdownDir) {
        $imageName = trim($m[1]);
        $width = $m[3] ?? null;
        $path = find_image_path($markdownDir, $imageName);
        $style = $width ? "width:{$width}px;" : 'max-width:100%;';
        return $path ? "<img src='$path'>" : htmlspecialchars($m[0], ENT_QUOTES | ENT_SUBSTITUTE);
    }, $html);

    $html = preg_replace_callback('/\[\[(.*?)\]\]/', function ($m) use ($markdownDir, $Parsedown, $includePreviewAttr) {
        $p = explode('|', $m[1]);
        $rawTarget = trim($p[0]);
        $rawTarget = preg_replace('/\s[a-f0-9]{32}$/i', '', $rawTarget);
        $rawTarget = preg_replace('/\.md$/i', '', $rawTarget);

        $url = create_wiki_url($rawTarget);
        $linkText = trim($p[1] ?? $p[0]);
        $preview = '';
        $previewAttr = '';

        if ($includePreviewAttr) {
            $previewTarget = preg_replace('/#.*$/', '', $rawTarget);
            $preview = get_wiki_link_preview($previewTarget, $markdownDir, $Parsedown);
            if ($preview !== '') {
                $previewAttr = ' data-preview="' . htmlspecialchars($preview, ENT_QUOTES | ENT_SUBSTITUTE) . '"';
            }
        }

        return '<a href="' . htmlspecialchars($url, ENT_QUOTES | ENT_SUBSTITUTE) . '" class="wiki-preview-link"' . $previewAttr . '>' . htmlspecialchars($linkText, ENT_QUOTES | ENT_SUBSTITUTE) . '</a>';
    }, $html);

    return $html;
}

function get_preview_snippet(string $html): string
{
    if (preg_match('/<p[^>]*>(.*?)<\/p>/is', $html, $matches)) {
        return trim($matches[0]);
    }

    return '';
}

function get_wiki_link_preview(string $linkTarget, string $markdownDir, $Parsedown): string
{
    $filePath = find_markdown_file($markdownDir, $linkTarget);
    if (!$filePath || !file_exists($filePath)) {
        return '';
    }

    $content = file_get_contents($filePath);
    $content = preg_replace('/\A(?:\xEF\xBB\xBF)?---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/u', '', $content, 1);
    $content = trim($content);
    $content = preg_replace('/\r\n|\r/', "\n", $content);

    // Render the full page content and extract a preview snippet.
    $renderedHtml = $Parsedown->text($content);
    $previewText = get_preview_snippet($renderedHtml);
    if ($previewText === '') {
        return '';
    }

    $previewText = render_wiki_markup_html($previewText, $markdownDir, $Parsedown, false);

    $previewTitle = basename(preg_replace('/\/index$/i', '', $linkTarget));
    if ($previewTitle === '') {
        $previewTitle = 'Preview';
    }

    $previewUrl = create_wiki_url($linkTarget);
    $templatePath = __DIR__ . '/templates/link_preview.php';

    if (!file_exists($templatePath)) {
        return strip_tags($previewText);
    }

    ob_start();
    include $templatePath;
    $html = ob_get_clean();
    $html = preg_replace('/[\r\n]+/', ' ', $html);
    return $html;
}

// --- LOCATE FILE FROM PATH ---
// takes the path from the url and looks for (in this order)
// index.md -> index.base -> exact .md file match (like dust.md or smth)
// this gets set to $filePath variable
// Normalize the requested URL path and remove leading/trailing slashes.
$target = trim($requestedPath, '/');

// Resolve the target path against the markdown directory using case-insensitive matching.
$resolvedBase = find_case_insensitive($markdownDir, $target);

// If the URL points to a directory, prefer index.md or index.base inside that folder.
if ($resolvedBase && is_dir($resolvedBase)) {
    if (file_exists($resolvedBase . '/index.md')) {
        $filePath = $resolvedBase . '/index.md';
    } elseif (file_exists($resolvedBase . '/index.base')) {
        $filePath = $resolvedBase . '/index.base';
    } else {
        $filePath = find_markdown_file($markdownDir, $target);
    }
}
// If the URL directly matches a file, use that file.
elseif ($resolvedBase && file_exists($resolvedBase)) {
    $filePath = $resolvedBase;
}
// Otherwise, attempt to resolve the path through the markdown file finder.
else {
    $filePath = find_markdown_file($markdownDir, $target);
}

// Initialize the main HTML output variables.
$htmlContent = '';
$bioHtml = '';
$yamlData = [];

// --- BASES RENDERER ---
// This closure renders a .base file as an HTML table.
$renderTable = function ($basePath, $currentPage, $targetViewName = null) use ($markdownDir, $Spyc, $Parsedown) {
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
    $tableHtml = "<table class='bases-table'><thead><tr>";
    foreach ($order as $colId) {
        $colName = ($colId === 'file.name' || $colId === 'file')
            ? 'file name'
            : str_replace(['formula.', '.', '_'], ['', ' ', ' '], $colId);
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
            $val = ($propId === 'file.name' || $propId === 'file')
                ? $displayName
                : $findProp($props, $propId);

            $cellValue = is_array($val)
                ? implode(', ', array_map(function ($i) use ($markdownDir, $Parsedown) {
                    if (is_array($i)) {
                        $i = implode(', ', array_map('strval', $i));
                    }
                    $item = $Parsedown->line((string) $i);
                    return "<span class='prop-pill'>" . render_wiki_markup_html($item, $markdownDir, $Parsedown, true) . '</span>';
                }, $val))
                : render_wiki_markup_html($Parsedown->line((string) $val), $markdownDir, $Parsedown, true);

            $isEmbed = (is_string($cellValue) && str_contains($cellValue, '<img'));

            if (!$linkPlaced && !$isEmbed && !empty(trim((string) $val))) {
                $tableHtml .= "<td><a href='$finalUrl' class='file-link'>$cellValue</a></td>";
                $linkPlaced = true;
            } else {
                $tableHtml .= "<td>$cellValue</td>";
            }
        }

        $tableHtml .= '</tr>';
    }

    return $tableHtml . '</tbody></table>';
};

// --- STANDARD MARKDOWN PROCESSING ---
// Only run page rendering if the requested file exists.
if ($filePath && file_exists($filePath)) {
    // Detect whether this is a markdown file or a base data file.
    $extension = pathinfo($filePath, PATHINFO_EXTENSION);

    if ($extension === 'base') {
        // Render .base files as tables rather than markdown pages.
        $htmlContent = $renderTable($filePath, $filePath);
    } else {
        // Load the markdown page content into memory.
        $markdownToProcess = file_get_contents($filePath);
        $yamlData = [];

        // Load any shared metadata helpers for page rendering.
        require_once __DIR__ . '/metadata.php';
        
        // --- YAML PROCESSING ---
        // 1. Extract YAML frontmatter from the top of the page.
        if (preg_match('/^---\s*([\s\S]*?)\s---/u', $markdownToProcess, $matches)) {
            $yamlData = Spyc::YAMLLoad($matches[1]); // parse YAML into PHP array
            $markdownToProcess = preg_replace('/^---\s*[\s\S]*?\s---/u', '', $markdownToProcess); // remove YAML from markdown
        }
        
        // --- LOAD IN BIO PAGE ---
        // If a bio page exists for this URL, load it too.
        $bioFile = find_markdown_file($markdownDir, $requestedPath . '/bio');
        $bioToProcess = $bioFile ? file_get_contents($bioFile) : '';

        // --- THE PARSER TOOL ---
        // We add &$wikiParser to the 'use' so it can call itself for notes inside notes
        $wikiParser = function ($text) use ($yamlData, $markdownDir, $renderTable, $filePath, $Parsedown, &$wikiParser) {
            
            // 1. GLOSS PARSER (Pre-Parsedown)
            $text = preg_replace_callback('/```gloss\n(.*?)\n```/s', function ($match) {
                $lines = explode("\n", trim($match[1]));
                $alignedData = []; $metadata = []; $alignedTags = ['gla', 'glb', 'glc'];
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
                if (isset($metadata['num'])) $html .= '<span class="gloss-num">(' . $metadata['num'] . ')</span> ';
                if (isset($metadata['lbl'])) $html .= '<span class="gloss-lbl">' . $metadata['lbl'] . '</span> ';
                if (isset($metadata['ex'])) $html .= '<div class="gloss-ex">' . $metadata['ex'] . '</div>';
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
                if (isset($metadata['ft'])) $html .= '<div class="gloss-ft">' . $metadata['ft'] . '</div>';
                if (isset($metadata['src'])) $html .= '<div class="gloss-src">' . $metadata['src'] . '</div>';
                return $html . '</div>';
            }, $text);

            // 2. DATAVIEW RENDERER (Pre-Parsedown)
            $pattern = '/=\s*(?:default\()?\s*this\.character\.([a-zA-Z0-9_-]+)(?:\s*,\s*["\'](.*?)["\']\s*\))?/i';
            $text = preg_replace_callback($pattern, function ($m) use ($yamlData) {
                $propName = $m[1]; $fallback = $m[2] ?? ''; $val = null;
                foreach ($yamlData as $k => $v) {
                    if (strtolower(str_replace([' ', '-', '_'], '', $k)) === strtolower(str_replace([' ', '-', '_'], '', $propName))) {
                        $val = $v; break;
                    }
                }
                return ($val !== null) ? (is_array($val) ? implode(', ', $val) : $val) : $fallback;
            }, $text);

            // 2. NOTE EMBEDDER (Pre-Parsedown)
            $transclusions = [];
            $text = preg_replace_callback('/!\[\[(.*?)(\|(\d+))?\]\]/', function ($m) use ($markdownDir, &$wikiParser, &$transclusions) {
                $targetName = trim($m[1]);
                $path = find_image_path($markdownDir, $targetName);
                
                if ($path && strtolower(pathinfo($path, PATHINFO_EXTENSION)) === 'md') {
                    $fullPath = $markdownDir . '/' . ltrim($path, '/');
                    if (file_exists($fullPath)) {
                        // --- GET TITLE USING CODETOP LOGIC ---
                        $meta = get_page_metadata($fullPath);
                        $displayTitle = !empty($meta['title']) ? $meta['title'] : ucwords(str_replace(['-', '_'], ' ', urldecode(basename($targetName))));

                        if (strtolower($displayTitle) === 'index' || $displayTitle === '') {
                            $displayTitle = 'Home';
                        }

                        // Get content and strip YAML
                        $rawNote = file_get_contents($fullPath);
                        $noteContent = preg_replace('/\A(?:\xEF\xBB\xBF)?---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/u', '', $rawNote, 1);
                        
                        $parsedNote = $wikiParser($noteContent);
                        $url = create_wiki_url($targetName);
                        
                        $id = "<!--TRANS_ID_" . count($transclusions) . "-->";
                        // Embed the note with the synced title link at the bottom
                        $transclusions[$id] = "<div class='markdown-embed'>$parsedNote<div class='embed-source'><a href='$url'>$displayTitle</a></div></div>";
                        return $id;
                    }
                }
                return $m[0]; 
            }, $text);

            // 4. MAIN PARSEDOWN RENDER
            $text = preg_replace('/^character:\s*.*$/im', '', $text);
            $text = $Parsedown->text($text);

            // 5. RESTORE EMBEDS (Swap placeholders back into HTML)
            if (!empty($transclusions)) {
                $text = str_replace(array_keys($transclusions), array_values($transclusions), $text);
            }

            // 6. SHORTCODES, IMAGES & LINKS (Post-Parsedown)
            $text = preg_replace_callback('/\[\s*embed_base\s*:\s*([^\]\s]+)\s*\]/i', function ($m) use ($renderTable, $filePath) {
                $parts = explode('#', trim($m[1]));
                return $renderTable(dirname($filePath) . '/' . $parts[0] . '.base', $filePath, $parts[1] ?? null);
            }, $text);

            $text = preg_replace_callback('/!\[\[(.*?)(\|(\d+))?\]\]/', function ($m) use ($markdownDir) {
                $imageName = trim($m[1]); $width = $m[3] ?? null;
                $path = find_image_path($markdownDir, $imageName);
                $style = $width ? "width:{$width}px;" : 'max-width:100%;';
                return $path ? "<img src='$path' style='$style'>" : "<i>(Image not found: $imageName)</i>";
            }, $text);

            $text = preg_replace_callback('/\[\[(.*?)\]\]/', function ($m) use ($markdownDir, $Parsedown) {
                $p = explode('|', $m[1]);
                $rawTarget = trim($p[0]); $rawTarget = preg_replace(['/\s[a-f0-9]{32}$/i', '/\.md$/i'], '', $rawTarget);
                $url = create_wiki_url($rawTarget);
                $linkText = trim($p[1] ?? $p[0]);
                $preview = get_wiki_link_preview(preg_replace('/#.*$/', '', $rawTarget), $markdownDir, $Parsedown);
                $previewAttr = $preview ? ' data-preview="' . htmlspecialchars($preview) . '"' : '';
                return '<a href="' . htmlspecialchars($url) . '" class="wiki-preview-link"' . $previewAttr . '>' . htmlspecialchars($linkText) . '</a>';
            }, $text);

            return $text;
        };


        // Apply transformations to both pieces of content
        $bioHtml = $wikiParser($bioToProcess);
        $htmlContent = $wikiParser($markdownToProcess);
    }
}

// --- TEMPLATE PICKER ---
// Decide which PHP template should render the page.
// If this is the root index of a section, use section_index.
$isIndexFile = (basename($filePath ?? '', '.md') === 'index' || basename($filePath ?? '', '.base') === 'index');

// Count the URL segments to know whether this is a root section page or a child page.
// Example: /characters has depth 1, /characters/merisdae has depth 2.
$urlDepth = count($urlParts);

if ($isIndexFile && $urlDepth <= 1) {
    $templateName = $section . '_index';
} else {
    $templateName = $section;
}

$specificTemplate = $templateDir . $templateName . '.php';

if (file_exists($specificTemplate)) {
    include $specificTemplate;
} elseif (file_exists($templateDir . $section . '.php')) {
    include $templateDir . $section . '.php';
} else {
    // If no section template exists, fall back to a simple content wrapper.
    echo '<div class="main-content">' . $htmlContent . '</div>';
}
?>


<script>
document.addEventListener('DOMContentLoaded', function () {
    const popup = document.createElement('div');
    popup.id = 'wiki-link-preview-popup';
    document.body.appendChild(popup);

    let hoverTimeout;
    let hideTimeout;
    let activeLink = null;

    const showPopup = function (link, preview) {
        popup.innerHTML = preview;
        popup.style.display = 'block';
        const rect = link.getBoundingClientRect();
        popup.style.left = window.scrollX + rect.left + 'px';
        popup.style.top = window.scrollY + rect.bottom + 8 + 'px';
    };

    const scheduleHide = function () {
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(function () {
            popup.style.display = 'none';
            activeLink = null;
        }, 180);
    };

    const clearHide = function () {
        clearTimeout(hideTimeout);
    };

    document.body.addEventListener('mouseover', function (event) {
        const link = event.target.closest('a.wiki-preview-link');
        if (!link) {
            return;
        }

        const preview = link.dataset.preview;
        if (!preview) {
            return;
        }

        activeLink = link;
        clearHide();
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(function () {
            showPopup(link, preview);
        }, 120);
    });

    document.body.addEventListener('mouseout', function (event) {
        if (event.target.closest('a.wiki-preview-link')) {
            hoverTimeout && clearTimeout(hoverTimeout);
            scheduleHide();
        }
    });

    popup.addEventListener('mouseover', function () {
        clearHide();
    });

    popup.addEventListener('mouseout', function () {
        scheduleHide();
    });
});
</script>