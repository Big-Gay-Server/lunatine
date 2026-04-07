<?php
function find_image_path($baseDir, $imageName) {
    if (!is_dir($baseDir)) return null;

    $targetPath = str_replace(['\\', '%20'], ['/', ' '], urldecode(trim($imageName)));
    $normalizedBase = str_replace('\\', '/', realpath($baseDir));
    
    // --- NEW: Detect if we are searching inside the compendium ---
    // This ensures the browser looks in the right subfolder
    $isCompendium = str_contains($normalizedBase, '/compendium');
    $urlPrefix = $isCompendium ? '/compendium/' : '/';

    $possiblePaths = [
        $targetPath,
        $targetPath . '.md',
        $targetPath . '.png',
        $targetPath . '.jpg',
        $targetPath . '.webp' // Added webp support
    ];

    foreach ($possiblePaths as $testPath) {
        $resolved = find_case_insensitive($baseDir, $testPath);
        if ($resolved && file_exists($resolved) && !is_dir($resolved)) {
            $relativePath = ltrim(str_replace($normalizedBase, '', str_replace('\\', '/', realpath($resolved))), '/');
            // USE THE PREFIX HERE
            return $urlPrefix . $relativePath;
        }
    }

    // 3. FALLBACK: Recursive global search
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($baseDir));
    $targetBasename = strtolower(basename($targetPath));

    foreach ($it as $file) {
        if ($file->isDir()) continue;

        $currentFilename = strtolower($file->getFilename());
        $currentNoExt = strtolower(pathinfo($currentFilename, PATHINFO_FILENAME));

        if ($currentFilename === $targetBasename || $currentNoExt === $targetBasename) {
            $currentFullPath = str_replace('\\', '/', realpath($file->getPathname()));
            $relativeDiskPath = ltrim(str_replace($normalizedBase, '', $currentFullPath), '/');
            // USE THE PREFIX HERE
            return $urlPrefix . $relativeDiskPath;
        }
    }

    return null;
}