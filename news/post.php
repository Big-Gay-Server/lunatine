<?php
require_once dirname(__DIR__) . '/vendor/autoload.php';
$Parsedown = new Parsedown();

// 1. Get the slug from the URL (e.g., 'getting-things-started')
$requested_slug = $_GET['f'] ?? ''; 
$requested_slug = str_replace(['.md', '.html'], '', $requested_slug); 

$post_dir = __DIR__ . '/posts/';
$matched_file = null;

// 2. Scan the directory for all markdown files
$files = glob($post_dir . '*.md');


foreach ($files as $full_path) {
    $filename = basename($full_path);
    
    // 3. Create the "Clean Slug" exactly how you do it in feed.php
    $current_slug = str_replace(['.md', ' ', '!', '?'], ['', '-', '', ''], $filename);
    $current_slug = trim($current_slug, '-'); // Remove trailing dashes

    // 4. Compare: Does this file's slug match the URL?
    if ($current_slug === $requested_slug) {
        $matched_file = $full_path;
        break;
    }
}

if ($matched_file) {
    $markdown = file_get_contents($matched_file);
    echo "<article class='blog-post'>" . $Parsedown->text($markdown) . "</article>";
} else {
    echo "<h3>Post not found.</h3>";
}

// back to news page
    echo "<div class='center' style='margin-top: 50px;'>";
    echo "    <a href='/news' style='text-decoration: none;'>";
    echo "        <button type='button'>← Back to News</button>";
    echo "    </a>";
    echo "</div>";


?>