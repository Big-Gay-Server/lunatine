<?php
// --- HELPER: CASE-INSENSITIVE FILE FINDER ---
function find_markdown_file($baseDir, $targetPath)
{
    if (!is_dir($baseDir)) {
        return null;
    }

    $targetPath = preg_replace('/#.*$/', '', $targetPath);
    $targetNormalized = strtolower(trim($targetPath, '/'));
    $tryIndexPath = $targetNormalized === '' ? 'index' : $targetNormalized . '/index';

    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($baseDir));
    foreach ($it as $file) {
        if ($file->getExtension() !== 'md') {
            continue;
        }

        $relativeDiskPath = str_replace([$baseDir, '.md'], '', $file->getPathname());
        $cleanDiskPath = str_replace('\\', '/', $relativeDiskPath);
        $normalizedDiskPath = strtolower(trim($cleanDiskPath, '/'));

        if ($normalizedDiskPath === $targetNormalized || $normalizedDiskPath === $tryIndexPath) {
            return $file->getPathname();
        }
    }

    return null;
}
?>