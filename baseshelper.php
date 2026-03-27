<?php
    // --- HELPER: THE RENDERER --- //
    $renderTable = function ($basePath, $currentPage) use ($markdownDir, $Spyc, $Parsedown) {
        if (!file_exists($basePath)) return "<i>(Base file not found)</i>";

        $baseData = Spyc::YAMLLoad($basePath);

        // Find the Table view
        $viewIndex = 0;
        if (isset($baseData['views'])) {
            foreach ($baseData['views'] as $idx => $v) {
                if (($v['type'] ?? '') === 'table') {
                    $viewIndex = $idx;
                    break;
                }
            }
        }

        $order = $baseData['views'][$viewIndex]['order'] ?? [];
        $scanDir = dirname($basePath);

        // Find all potential row files (Flat words or Nested characters)
        $allFiles = array_merge(
            glob($scanDir . "/*/index.md"),
            glob($scanDir . "/*.md")
        );

        // Filter: Don't show the current page, and hide bio.md
        $mdFiles = array_filter($allFiles, function ($f) use ($currentPage) {
            if (realpath($f) === realpath($currentPage)) return false;
            if (basename($f) === 'bio.md') return false;
            return true;
        });

        if (empty($order)) return "<i>(Table view not found)</i>";

        // Logic to find property values even if keys have different spacing/case
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
            $fullRel = str_replace($markdownDir, '', $mdFile);
            $urlPath = str_replace(['.md', '/index', 'index'], '', $fullRel);
            $finalUrl = '/' . strtolower(trim($urlPath, '/'));

            $rawContent = file_get_contents($mdFile);
            $props = [];
            if (preg_match('/^---\s*([\s\S]*?)\s---/', $rawContent, $matches)) {
                $props = Spyc::YAMLLoad($matches[1]);
            }

            $tableHtml .= "<tr>";
            $tableHtml .= "<tr>";
            $isFirstCol = true; // Track the first column
            foreach ($order as $propId) {
                // Determine the cell value
                if ($propId === 'file.name' || $propId === 'file') {
                    $cellValue = $displayName;
                } else {
                    $val = $findProp($props, $propId);
                    if (is_array($val)) {
                        $pills = array_map(function ($item) {
                            return "<span class='prop-pill'>" . htmlspecialchars($item) . "</span>";
                        }, $val);
                        $cellValue = implode(' ', $pills);
                    } else {
                        $cellValue = $Parsedown->line((string)$val);
                    }
                }

                // If this is the VERY FIRST column, wrap the value in the link
                if ($isFirstCol) {
                    $tableHtml .= "<td><a href='$finalUrl' class='file-link'>" . $cellValue . "</a></td>";
                    $isFirstCol = false;
                } else {
                    $tableHtml .= "<td>" . $cellValue . "</td>";
                }
            }
            $tableHtml .= "</tr>";
        }
        return $tableHtml . "</tbody></table>";
    };