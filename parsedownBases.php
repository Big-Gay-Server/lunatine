<?php
require_once 'parsedownGloss.php';

class ParsedownBases extends ParsedownGloss {
    protected $renderTable;
    protected $markdownDir;
    protected $currentFilePath;

    public function __construct($markdownDir, $currentFilePath, callable $renderTable) {
        $this->markdownDir = $markdownDir;
        $this->currentFilePath = $currentFilePath;
        $this->renderTable = $renderTable;

        // Register the ![[ marker
        $this->InlineTypes['!'][] = 'ObsidianEmbed';
    }

    protected function inlineObsidianEmbed($Excerpt) {
        // Look for ![[target]] or ![[target|alias/width]]
        if (preg_match('/^!\\[\\[(.*?)\\]\\]/', $Excerpt['text'], $matches)) {
            $parts = explode('|', trim($matches[1]));
            $rawTarget = trim($parts[0]);
            
            // Handle Anchor/View splitting (e.g., ![[file#view]])
            $targetParts = explode('#', $rawTarget);
            $targetName = $targetParts[0];
            $targetView = $targetParts[1] ?? null;

            // Use the helper to find the actual file path
            $path = find_image_path($this->markdownDir, $targetName);
            
            if ($path) {
                $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                $fullPath = $this->markdownDir . '/' . ltrim($path, '/');

                if (file_exists($fullPath)) {
                    // --- CASE A: .BASE FILE (TABLES) ---
                    if ($extension === 'base') {
                        $render = $this->renderTable;
                        $html = "<div class='base-embed'>" . $render($fullPath, $this->currentFilePath, $targetView) . "</div>";
                        return [
                            'extent' => strlen($matches[0]),
                            'element' => ['rawHtml' => $html],
                        ];
                    }

                    // --- CASE B: .MD FILE (NOTES) ---
                    if ($extension === 'md') {
                        $meta = get_page_metadata($fullPath);
                        $displayTitle = !empty($meta['title']) ? $meta['title'] : ucwords(str_replace(['-', '_'], ' ', urldecode(basename($targetName))));
                        if (strtolower($displayTitle) === 'index' || $displayTitle === '') {
                            $displayTitle = 'Home';
                        }

                        $rawNote = file_get_contents($fullPath);
                        // Strip YAML
                        $noteContent = preg_replace('/\A(?:\xEF\xBB\xBF)?---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/u', '', $rawNote, 1);
                        
                        // Recursive call: Parse the note content using the current parser instance
                        $parsedNote = $this->text($noteContent);
                        $url = create_wiki_url($targetName);
                        
                        $html = "<div class='markdown-embed'>$parsedNote<div class='embed-source'>- from <a href='$url'>$displayTitle</a></div></div>";
                        return [
                            'extent' => strlen($matches[0]),
                            'element' => ['rawHtml' => $html],
                        ];
                    }
                    
                    // --- CASE C: IMAGES ---
                    // If it's an image, we return nothing here and let the 
                    // standard Parsedown image handler (or your post-processor) take it.
                }
            }
        }
        return null;
    }
}