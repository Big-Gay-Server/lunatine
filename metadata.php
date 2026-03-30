<?php
require_once __DIR__ . '/Spyc.php'; // Ensure path to Spyc is correct

function get_page_metadata($path) {
    if (!file_exists($path)) return ['title' => ''];
    
    $content = file_get_contents($path);
    if (preg_match('/^---\s*([\s\S]*?)\s---/u', $content, $matches)) {
        return Spyc::YAMLLoad($matches[1]);
    }
    return ['title' => ''];
}