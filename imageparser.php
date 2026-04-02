<?php
function find_image_path($baseDir, $imageName) {
    if (!is_dir($baseDir)) return null;

    // 1. Normalize and clean the input path
    $targetPath = str_replace(['\\', '%20'], ['/', ' '], urldecode(trim($imageName)));
    $normalizedBase = str_replace('\\', '/', realpath($baseDir));

    // 2. PRIORITY: Check for an exact path match first (with and without extension)
    $possiblePaths = [
        $targetPath,
        $targetPath . '.md',
        $targetPath . '.png',
        $targetPath . '.jpg'
    ];

    foreach ($possiblePaths as $testPath) {
        $fullTestPath = $normalizedBase . '/' . ltrim($testPath, '/');
        // Use a case-insensitive check for the specific path segments
        $resolved = find_case_insensitive($baseDir, $testPath);
        if ($resolved && file_exists($resolved) && !is_dir($resolved)) {
            $relativePath = ltrim(str_replace($normalizedBase, '', str_replace('\\', '/', realpath($resolved))), '/');
            return '/' . $relativePath;
        }
    }

    // 3. FALLBACK: Recursive global search (your original logic)
    // Only happens if the specific path above wasn't found
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($baseDir));
    $fallbackMatch = null;
    $targetBasename = strtolower(basename($targetPath));

    foreach ($it as $file) {
        if ($file->isDir()) continue;

        $currentFilename = strtolower($file->getFilename());
        $currentNoExt = strtolower(pathinfo($currentFilename, PATHINFO_FILENAME));

        if ($currentFilename === $targetBasename || $currentNoExt === $targetBasename) {
            $currentFullPath = str_replace('\\', '/', realpath($file->getPathname()));
            $relativeDiskPath = ltrim(str_replace($normalizedBase, '', $currentFullPath), '/');
            return '/' . $relativeDiskPath;
        }
    }

    return null;
}
?>