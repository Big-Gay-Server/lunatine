<?php
function find_image_path($baseDir, $imageName) {
    if (!is_dir($baseDir)) return null;

    // 1. Clean and lowercase the target path from the markdown
    $targetPath = strtolower(str_replace(['\\', '%20'], ['/', ' '], urldecode(trim($imageName))));
    
    // 2. Normalize base directory for comparison
    $normalizedBase = str_replace('\\', '/', realpath($baseDir));

    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($baseDir));

    $fallbackMatch = null;
    foreach ($it as $file) {
        if ($file->isDir()) continue;

        // 3. Get current disk path and lowercase it
        $currentFullPath = str_replace('\\', '/', realpath($file->getPathname()));
        $relativeDiskPath = ltrim(str_replace($normalizedBase, '', $currentFullPath), '/');
        $lowerDiskPath = strtolower($relativeDiskPath);
        $lowerFilename = strtolower($file->getFilename());

        // 4. Exact path match first
        if ($lowerDiskPath === $targetPath) {
            return '/' . ltrim($relativeDiskPath, '/');
        }

        // 5. Keep a fallback only if the exact path didn't match.
        if ($lowerFilename === basename($targetPath)
            || pathinfo($lowerFilename, PATHINFO_FILENAME) === pathinfo(basename($targetPath), PATHINFO_FILENAME)) {
            if ($fallbackMatch === null) {
                $fallbackMatch = '/' . ltrim($relativeDiskPath, '/');
            }
        }
    }

    return $fallbackMatch;
}

?>