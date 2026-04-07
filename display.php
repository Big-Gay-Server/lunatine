<?php
// --- IMPORTING EXTERNAL LIBRARIES ---
// 1. Composer Autoloader (Handles Parsedown, Spyc, and Symfony)
require_once 'vendor/autoload.php';

// 2. Custom Extensions and Helpers
require_once 'includes/parsedownGloss.php';
require_once 'includes/parsedownBases.php';
require_once 'includes/imageparser.php';
require_once 'includes/filefinder.php';

// 3. Templates
require_once 'templates/template_router.php';

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

// --- WIKI URL CREATION ---
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

// --- STANDARD MARKDOWN PROCESSING ---
// Only run page rendering if the requested file exists.
if ($filePath && file_exists($filePath)) {
    // Detect whether this is a markdown file or a base data file.
    $extension = pathinfo($filePath, PATHINFO_EXTENSION);

    if ($extension === 'base') {
        // Render .base files as tables rather than markdown pages.
        // Pass $markdownDir as the 3rd argument as defined in your ParsedownBases class
        $htmlContent = $Parsedown->renderTable($filePath, $filePath, $markdownDir);

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

        // This bridge variable allows the closure to call the class method
        $renderTable = function($basePath, $currentPage, $targetView = null) use ($Parsedown, $markdownDir) {
            // Note: renderTable in your class requires 4 arguments
            return $Parsedown->renderTable($basePath, $currentPage, $markdownDir, $targetView);
        };

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
            // Updated Regex: Handles 'this.prop' AND 'this.character.prop'
            $pattern = '/\(?=\s*(?:default\()?\s*this\.(?:character\.)?([a-zA-Z0-9_-]+)(?:\s*,\s*["\'](.*?)["\']\s*\))?\)?/i';

            $text = preg_replace_callback($pattern, function ($m) use ($yamlData) {
                $propName = $m[1]; 
                $fallback = $m[2] ?? ''; 
                $val = null;

                // Fuzzy match properties (ignores spaces, dashes, and underscores)
                $cleanSearch = strtolower(str_replace([' ', '-', '_'], '', $propName));
                
                foreach ($yamlData as $k => $v) {
                    $cleanKey = strtolower(str_replace([' ', '-', '_'], '', $k));
                    if ($cleanKey === $cleanSearch) {
                        $val = $v; 
                        break;
                    }
                }

                // Return the value (joined by commas if it's a list) or the fallback
                if ($val !== null) {
                    return is_array($val) ? implode(', ', $val) : (string)$val;
                }
                
                return $fallback;
            }, $text);

            // 2. NOTE & BASE EMBEDDER (Pre-Parsedown)
            $transclusions = [];
            $text = preg_replace_callback('/!\[\[(.*?)\]\]/', function ($m) use ($markdownDir, &$wikiParser, &$transclusions, $renderTable, $filePath) {
                // Split for Alias and Anchor (e.g. ![[File.base#view|Alias]])
                $parts = explode('|', trim($m[1]));
                $rawTarget = trim($parts[0]);
                
                $targetParts = explode('#', $rawTarget);
                $targetName = $targetParts[0];
                $targetView = $targetParts[1] ?? null;

                $path = find_image_path($markdownDir, $targetName);
                
                if ($path) {
                    $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                    $fullPath = $markdownDir . '/' . ltrim($path, '/');

                    if (file_exists($fullPath)) {
                        $id = "<!--TRANS_ID_" . count($transclusions) . "-->";
                        
                        // --- CASE A: EMBEDDING A .BASE FILE (TABLES) ---
                        if ($extension === 'base') {
                            // Call your existing table renderer
                            $tableHtml = $renderTable($fullPath, $filePath, $targetView);
                            $transclusions[$id] = "<div class='base-embed'>$tableHtml</div>";
                            return $id;
                        }

                        // --- CASE B: EMBEDDING A .MD FILE (NOTES) ---
                        if ($extension === 'md') {
                            $meta = get_page_metadata($fullPath);
                            $displayTitle = !empty($meta['title']) ? $meta['title'] : ucwords(str_replace(['-', '_'], ' ', urldecode(basename($targetName))));
                            if (strtolower($displayTitle) === 'index' || $displayTitle === '') {
                                $displayTitle = 'Home';
                            }

                            $rawNote = file_get_contents($fullPath);
                            $noteContent = preg_replace('/\A(?:\xEF\xBB\xBF)?---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/u', '', $rawNote, 1);
                            
                            $parsedNote = $wikiParser($noteContent);
                            $url = create_wiki_url($targetName);
                            
                            $transclusions[$id] = "<div class='markdown-embed'>$parsedNote<div class='embed-source'>- from <a href='$url'>$displayTitle</a></div></div>";
                            return $id;
                        }
                    }
                }
                return $m[0]; 
            }, $text);

            // 4. MAIN PARSEDOWN RENDER
            $text = preg_replace('/^character:\s*.*$/im', '', $text);
            $html = $Parsedown->text($text); // We switch to $html here

            // --- 3.5 POST-PARSEDOWN (Header ID Injection) ---
            $html = preg_replace_callback('/<h([1-6])>(.*?)<\/h\1>/s', function ($m) {
                $level = $m[1];
                $content = strip_tags($m[2]);
                $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $content), '-'));
                return "<h$level id=\"$slug\">{$m[2]}</h$level>";
            }, $html);

            // 5. RESTORE EMBEDS
            if (!empty($transclusions)) {
                $html = str_replace(array_keys($transclusions), array_values($transclusions), $html);
            }

            // 6. SHORTCODES, IMAGES & LINKS
            $html = preg_replace_callback('/\[\s*embed_base\s*:\s*([^\]\s]+)\s*\]/i', function ($m) use ($renderTable, $filePath) {
                $parts = explode('#', trim($m[1]));
                return $renderTable(dirname($filePath) . '/' . $parts[0] . '.base', $filePath, $parts[1] ?? null);
            }, $html);

            $html = preg_replace_callback('/!\[\[(.*?)(\|(\d+))?\]\]/', function ($m) use ($markdownDir) {
                $imageName = trim($m[1]); $width = $m[3] ?? null;
                $path = find_image_path($markdownDir, $imageName);
                $style = $width ? "width:{$width}px;" : 'max-width:100%;';
                return $path ? "<img src='$path' style='$style'>" : "<i>(Image not found: $imageName)</i>";
            }, $html);

            $html = preg_replace_callback('/\[\[(.*?)\]\]/', function ($m) use ($markdownDir, $Parsedown) {
                $p = explode('|', $m[1]);
                $fullTarget = trim($p[0]);

                // Split Page from Anchor
                $parts = explode('#', $fullTarget);
                $pagePath = $parts[0];
                $anchor = "";
                if (isset($parts[1])) {
                    // SLUGIFY ANCHOR TO MATCH HEADERS
                    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $parts[1]), '-'));
                    $anchor = '#' . $slug;
                }

                $cleanPagePath = preg_replace(['/\s[a-f0-9]{32}$/i', '/\.md$/i'], '', $pagePath);
                $url = create_wiki_url($cleanPagePath) . $anchor;
                $linkText = trim($p[1] ?? $p[0]);

                $preview = get_wiki_link_preview($cleanPagePath, $markdownDir, $Parsedown);
                $previewAttr = $preview ? ' data-preview="' . htmlspecialchars($preview) . '"' : '';

                return '<a href="' . htmlspecialchars($url) . '" class="wiki-preview-link"' . $previewAttr . '>' . htmlspecialchars($linkText) . '</a>';
            }, $html);

            return $html; // Return $html instead of $text
        };


        // Apply transformations to both pieces of content
        $bioHtml = $wikiParser($bioToProcess);
        $htmlContent = $wikiParser($markdownToProcess);
    }
}

renderWithTemplate($section, $urlParts, $filePath, $templateDir, $htmlContent, $yamlData, $bioHtml);

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