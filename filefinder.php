<?php
// --- HELPER: CASE-INSENSITIVE FILE FINDER ---
function normalize_wiki_path($path)
{
    $path = rawurldecode(trim($path, '/'));
    $path = preg_replace('/#.*$/', '', $path);
    $path = preg_replace('/\.md$/i', '', $path);
    $path = str_replace('\\', '/', $path);
    $path = preg_replace('/\s+/', '-', $path);
    $path = preg_replace('/_+/', '-', $path);
    $path = preg_replace('/-+/', '-', $path);
    return strtolower(trim($path, '/'));
}

function compare_wiki_paths($a, $b)
{
    if ($a === $b) {
        return true;
    }

    $normalize = fn($value) => preg_replace('/[^a-z0-9]/', '', $value);
    return $normalize($a) === $normalize($b);
}

function find_markdown_file($baseDir, $targetPath)
{
    if (!is_dir($baseDir)) {
        return null;
    }

    $targetNormalized = normalize_wiki_path($targetPath);
    $targetIndexPath = $targetNormalized === '' ? 'index' : $targetNormalized . '/index';

    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($baseDir));
    foreach ($it as $file) {
        if ($file->getExtension() !== 'md') {
            continue;
        }

        $relativeDiskPath = str_replace([$baseDir, '.md'], '', $file->getPathname());
        $cleanDiskPath = str_replace('\\', '/', $relativeDiskPath);
        $normalizedDiskPath = normalize_wiki_path($cleanDiskPath);

        if (compare_wiki_paths($normalizedDiskPath, $targetNormalized)
            || compare_wiki_paths($normalizedDiskPath, $targetIndexPath)
        ) {
            return $file->getPathname();
        }
    }

    return null;
}
?>