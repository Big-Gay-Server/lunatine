<?php
function renderWithTemplate($section, $urlParts, $filePath, $templateDir, $htmlContent, $yamlData) {
    $isIndexFile = (basename($filePath ?? '', '.md') === 'index' || basename($filePath ?? '', '.base') === 'index');
    $urlDepth = count($urlParts);

    // Template selection logic
    if ($isIndexFile && $urlDepth <= 1) {
        $templateName = $section . '_index';
    } else {
        $templateName = $section;
    }

    $specificTemplate = $templateDir . $templateName . '.php';

    // If we find a template, include it. 
    // We use "extract" to make sure $htmlContent and $yamlData are available inside the template files.
    if (file_exists($specificTemplate)) {
        include $specificTemplate;
    } elseif (file_exists($templateDir . $section . '.php')) {
        include $templateDir . $section . '.php';
    } else {
        echo '<div class="main-content">' . $htmlContent . '</div>';
    }
}
