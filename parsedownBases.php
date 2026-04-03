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
                ? implode(', ', array_map(function ($i) use ($markdownDir) {
                    if (is_array($i)) {
                        $i = implode(', ', array_map('strval', $i));
                    }
                    $item = $this->line((string) $i);
                    return "<span class='prop-pill'>" . render_wiki_markup_html($item, $markdownDir, $this, true) . '</span>';
                }, $val))
                : render_wiki_markup_html($this->line((string) $val), $markdownDir, $this, true);

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
    }
}
?>