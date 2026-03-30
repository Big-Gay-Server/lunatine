<?php
require_once __DIR__ . '/Spyc.php';

function get_page_metadata($path) {
    if (!$path || !file_exists($path)) return ['title' => ''];
    
    $content = file_get_contents($path);
    $ext = pathinfo($path, PATHINFO_EXTENSION);

    // If it's Markdown, use YAML
    if ($ext === 'md') {
        if (preg_match('/^---\s*([\s\S]*?)\s---/u', $content, $matches)) {
            return Spyc::YAMLLoad($matches[1]);
        }
    } 
    // If it's PHP, look for a TITLE comment: /* TITLE: My Page */
    elseif ($ext === 'php') {
        if (preg_match('/\/\*\s*TITLE:\s*(.*?)\s*\*\//i', $content, $matches)) {
            return ['title' => trim($matches[1])];
        }
    }

    return ['title' => ''];
}