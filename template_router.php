<?php
function renderWithTemplate($section, $urlParts, $filePath, $templateDir, $htmlContent, $yamlData) {
    $isIndexFile = (basename($filePath ?? '', '.md') === 'index' || basename($filePath ?? '', '.base') === 'index');
    $urlDepth = count($urlParts);

    if ($isIndexFile && $urlDepth <= 1) {
        $templateName = $section . '_index';
    } else {
        $templateName = $section;
    }

    $specificTemplate = $templateDir . $templateName . '.php';

    // --- THE FIX ---
    // This makes $htmlContent and $yamlData available inside the included file
    extract(get_defined_vars()); 

    if (file_exists($specificTemplate)) {
        include $specificTemplate;
    } elseif (file_exists($templateDir . $section . '.php')) {
        include $templateDir . $section . '.php';
    } else {
        echo '<div class="main-content">' . $htmlContent . '</div>';
    }
}
