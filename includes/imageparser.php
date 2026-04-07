<?php
function find_image_path($baseDir, $imageName) {
    if (!is_dir($baseDir)) return null;

    // 1. Keep the full path provided in the Markdown link
    $targetPath = str_replace(['\\', '%20'], ['/', ' '], urldecode(trim($imageName)));
    $normalizedBase = str_replace('\\', '/', realpath($baseDir));
    
    $isCompendium = str_contains($normalizedBase, '/compendium');
    $urlPrefix = $isCompendium ? '/compendium/' : '/';

    // 2. PRIORITY: Check for an exact path match relative to your vault root
    // If the MD file says [[Characters/Elowen/portrait.png]], find_case_insensitive will look for that exact file.
    $resolved = find_case_insensitive($baseDir, $targetPath);
    
    if (!$resolved) {
        // Try common extensions if they were missing in the MD link
        foreach (['.png', '.jpg', '.webp'] as $ext) {
            $resolved = find_case_insensitive($baseDir, $targetPath . $ext);
            if ($resolved) break;
        }
    }

    if ($resolved && file_exists($resolved) && !is_dir($resolved)) {
        $relativePath = ltrim(str_replace($normalizedBase, '', str_replace('\\', '/', realpath($resolved))), '/');
        return $urlPrefix . $relativePath;
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
    error_log("IMAGE DEBUG: Searching for [$imageName] in [$baseDir]. Result: " . ($resolved ?: 'NOT FOUND'));
    return null;
}
