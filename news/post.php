<?php
require_once __DIR__ . '/Parsedown.php';
$Parsedown = new Parsedown();

// Fix: Since post.php is in /news, just look in the 'posts' subfolder
$post_dir = __DIR__ . '/posts/'; 
$file = $_GET['f'] ?? '';

$path = realpath($post_dir . $file);

// Verify the file exists and is inside the posts folder
if ($path && strpos($path, $post_dir) === 0 && file_exists($path)) {
    $markdown = file_get_contents($path);
    
    echo "<article class='blog-post' style='max-width: 900px; margin: auto;'>";
    echo $Parsedown->text($markdown); 
    echo "</article>";
} else {
    echo "<h1>Post not found.</h1>";
    // Debug info to help you see what's wrong:
    echo "<!-- Script is looking in: " . $post_dir . " for file: " . $file . " -->";
}

// back to news page
    echo "<div class='center' style='margin-top: 50px;'>";
    echo "    <a href='/news' style='text-decoration: none;'>";
    echo "        <button type='button'>← Back to News</button>";
    echo "    </a>";
    echo "</div>";


?>