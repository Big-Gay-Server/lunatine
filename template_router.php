<?php
function renderWithTemplate($section, $urlParts, $filePath, $templateDir, $htmlContent, $yamlData) {
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
}
