<?php
// --- HELPER: CASE-INSENSITIVE FILE FINDER ---
function find_markdown_file($baseDir, $targetPath)
{
    if (!is_dir($baseDir))
        return null;
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($baseDir));
    foreach ($it as $file) {
        if ($file->getExtension() === 'md') {
            $relativeDiskPath = str_replace([$baseDir, '.md'], '', $file->getPathname());
            $cleanDiskPath = str_replace('\\', '/', $relativeDiskPath);
            if (strtolower(trim($cleanDiskPath, '/')) === strtolower(trim($targetPath, '/'))) {
                return $file->getPathname();
            }
        }
    }
    return null;
}
?>