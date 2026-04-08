<?php
function find_image_path($baseDir, $imageName) {
    if (!is_dir($baseDir)) return null;

    // 1. Keep the full path provided in the Markdown link
    $targetPath = str_replace(['\\', '%20'], ['/', ' '], urldecode(trim($imageName)));
    $normalizedBase = str_replace('\\', '/', realpath($baseDir));
    
    echo "<!-- DEBUG: Function received Base Dir: $baseDir -->\n";
    echo "<!-- DEBUG: Global markdownDir is: " . ($GLOBALS['markdownDir'] ?? 'NOT SET') . " -->\n";


    $isCompendium = str_contains($normalizedBase, '/compendium');
    $urlPrefix = $isCompendium ? '/compendium/' : '/';

     // 2. PRIORITY: Check for an exact path match
    $possiblePaths = [
        $targetPath,
        $targetPath . '.png',
        $targetPath . '.jpg',
        $targetPath . '.webp'
    ];

    foreach ($possiblePaths as $testPath) {
        // --- THE SMART FIX ---
        // 1. Try Root First
        $resolved = find_case_insensitive($baseDir, $testPath);
        
        // 2. If not found, try inside Compendium
        if (!$resolved) {
            $resolved = find_case_insensitive($baseDir . '/compendium', $testPath);
        }

        if ($resolved && file_exists($resolved) && !is_dir($resolved)) {
            // Calculate relative path based on the SITE ROOT ($baseDir)
            // This ensures the browser URL starts with /compendium/...
            $relativePath = ltrim(str_replace(realpath($baseDir), '', realpath($resolved)), '/');
            return '/' . $relativePath;
        }
    }

    // 3. FALLBACK: Only if the exact path above fails, do the "fuzzy" recursive search
    // This is where you might get the "wrong" image if multiple files have the same name.
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($baseDir));
    $targetBasename = strtolower(basename($targetPath));

    foreach ($it as $file) {
        if ($file->isDir()) continue;
        if (strtolower($file->getFilename()) === $targetBasename) {
            $currentFullPath = str_replace('\\', '/', realpath($file->getPathname()));
            $relativeDiskPath = ltrim(str_replace($normalizedBase, '', $currentFullPath), '/');
            return $urlPrefix . $relativeDiskPath;
        }
    }
    return null;
}
