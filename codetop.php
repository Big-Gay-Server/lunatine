<?php
// basic setup
$markdownDir = __DIR__ . '/';
$GLOBALS['markdownDir'] = $markdownDir;

$fileName = isset($_GET['file']) ? $_GET['file'] : 'index';
$requestedPath = trim(str_replace('..', '', $fileName), '/');
if (empty($requestedPath)) $requestedPath = 'index';

// 1. Determine Section & Title
$urlParts = explode('/', $requestedPath);
$section = strtolower($urlParts[0]);

require_once __DIR__ . '/metadata.php';

// Get path from URI or Nginx query param
$requestUri = $_SERVER['REQUEST_URI'];
$cleanPath = $_SERVER['DOCUMENT_ROOT'] . $requestUri;

// Logic to find the actual .md file (similar to your display.php logic)
if (is_dir($cleanPath)) {
    $targetFile = rtrim($cleanPath, '/') . '/index.md';
} else {
    $targetFile = $cleanPath; // Or handle .base/clean URL logic here
}

$meta = get_page_metadata($targetFile);
$pageTitle = !empty($meta['title']) ? $meta['title'] : ucwords(str_replace(['-', '_'], ' ', urldecode(basename($requestUri))));

if (strtolower($pageTitle) === 'index' || $pageTitle === '') {
    $pageTitle = 'Home';
}

// 2. Build Breadcrumbs
$breadcrumbLinks = [];
$currentBreadPath = "";
$accumulatedFileSystemPath = $_SERVER['DOCUMENT_ROOT'];

foreach ($urlParts as $part) {
    if (empty($part)) continue;
    
    $currentBreadPath .= "/" . $part;
    $accumulatedFileSystemPath .= "/" . $part;
    
    // Check files in order of priority: 
    // 1. index.md  2. index.php  3. file.md
    $testFiles = [
        $accumulatedFileSystemPath . "/index.md",
        $accumulatedFileSystemPath . "/index.php",
        $accumulatedFileSystemPath . ".md"
    ];

    $name = "";
    foreach ($testFiles as $file) {
        $meta = get_page_metadata($file);
        if (!empty($meta['title'])) {
            $name = $meta['title'];
            break; 
        }
    }

    // Fallback if no title found in any file
    if (empty($name)) {
        // urldecode ensures %C3%A9 becomes é
        $name = ucwords(str_replace(['-', '_'], ' ', urldecode($part)));
    }
    
    $breadcrumbLinks[] = "<a href='$currentBreadPath'>$name</a>";
}
$breadcrumbs = implode(' > ', $breadcrumbLinks);

?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars($pageTitle ?? 'Wiki') ?> | Lunatine</title>
    <link rel="icon" type="image/x-icon" href="/GRAPHICS/icon.png">
    <link rel="stylesheet" href="/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Caudex:ital,wght@0,400;0,700;1,400;1,700&family=Cormorant+Infant:ital,wght@0,300..700;1,300..700&family=Cormorant+Upright:wght@300;400;500;600;700&family=Kurale&family=Milonga&display=swap" rel="stylesheet">
</head>

<body>
    <div class="header">
        <center>
            <div class="logo"><a href="/">lunatine</a></div>
            <div class="nav">
                <a href="/">home</a>
                <a href="/about">about</a>
                <a href="/news">news</a>
                <a href="/compendium">compendium</a>
                <a href="/works">works</a>
            </div>
        </center>
    </div>
    <div class="contentwrap">
        <div class="sidebar"><?php @include 'sidebar.php'; ?></div>
        <div class="content-container">
            <div class="breadcrumbs"><a href="/"> Home </a> > <?= $breadcrumbs ?></div>
            <h1><center><?= htmlspecialchars($pageTitle) ?></center></h1>