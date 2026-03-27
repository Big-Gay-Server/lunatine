<?php
function find_image_path($baseDir, $imageName) {
    if (!is_dir($baseDir)) return null;

    // 1. Clean and lowercase the target path from the markdown
    $targetPath = strtolower(str_replace(['\\', '%20'], ['/', ' '], urldecode(trim($imageName))));
    
    // 2. Normalize base directory for comparison
    $normalizedBase = str_replace('\\', '/', realpath($baseDir));

    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($baseDir));

    foreach ($it as $file) {
        if ($file->isDir()) continue;

        // 3. Get current disk path and lowercase it
        $currentFullPath = str_replace('\\', '/', realpath($file->getPathname()));
        $relativeDiskPath = ltrim(str_replace($normalizedBase, '', $currentFullPath), '/');
        $lowerDiskPath = strtolower($relativeDiskPath);

        // 4. Case-insensitive match check
        if ($lowerDiskPath === $targetPath || 
            strtolower($file->getFilename()) === basename($targetPath) ||
            pathinfo(strtolower($file->getFilename()), PATHINFO_FILENAME) === pathinfo(basename($targetPath), PATHINFO_FILENAME)) {
            
            // Return the ACTUAL path on disk so Nginx can find it
            return '/' . ltrim($relativeDiskPath, '/');
        }
    }
    return null;
}

?>