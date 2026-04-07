<?php
function renderWithTemplate($section, $urlParts, $filePath, $templateDir, $htmlContent, $yamlData, $bioHtml = '') {
    // 1. FIX: If the section is "compendium", look at the NEXT part of the URL for the template name
    $actualSection = $section;
    if ($section === 'compendium' && isset($urlParts[1])) {
        $actualSection = $urlParts[1];
    }

    $isIndexFile = (basename($filePath ?? '', '.md') === 'index' || basename($filePath ?? '', '.base') === 'index');
    
    // 2. Adjust depth logic if inside compendium
    $urlDepth = count($urlParts);
    $checkDepth = ($section === 'compendium') ? 2 : 1;

    if ($isIndexFile && $urlDepth <= $checkDepth) {
        $templateName = $actualSection . '_index';
    } else {
        $templateName = $actualSection;
    }

    $specificTemplate = $templateDir . $templateName . '.php';

    // Pack the variables for the template
    extract(get_defined_vars());

    if (file_exists($specificTemplate)) {
        include $specificTemplate;
    } elseif (file_exists($templateDir . $actualSection . '.php')) {
        include $templateDir . $actualSection . '.php';
    } else {
        echo '<div class="main-content">' . $htmlContent . '</div>';
    }
}