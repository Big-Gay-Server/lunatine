<?php
require_once __DIR__ . '/Spyc.php';

function get_page_metadata($path) {
    if (!$path || !file_exists($path)) return ['title' => ''];
    
    $content = file_get_contents($path);
    $ext = pathinfo($path, PATHINFO_EXTENSION);

    // For Markdown (YAML)
    if (preg_match('/^---\s*([\s\S]*?)\s---/u', $content, $matches)) {
        $data = Spyc::YAMLLoad($matches[1]);
        if (isset($data['title'])) {
            $data['title'] = urldecode($data['title']);
        }
        return $data;
    }

    // For PHP comments
    elseif ($ext === 'php') {
        if (preg_match('/\/\*\s*TITLE:\s*(.*?)\s*\*\//i', $content, $matches)) {
            return ['title' => urldecode(trim($matches[1]))];
        }
    }

    return ['title' => ''];
}