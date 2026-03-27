<div class="page-meta-section">
    
    <!-- DISPLAY YAML PROPERTIES -->
    <div class="yaml-properties">
        <ul class="prop-list">
            <?php foreach ($yamlData as $key => $value): ?>
                <li>
                    <strong><?= htmlspecialchars(ucfirst($key)) ?>:</strong> 
                    <?php 
                        // 1. Turn arrays into strings
                        $displayValue = is_array($value) ? implode(', ', $value) : (string)$value;

                        // 2. Run a "mini-parser" just for YAML links and images
                        // This handles] (lowercase + no index)
                        $displayValue = preg_replace_callback('/\[\[(.*?)\]\]/', function ($m) {
                            $p = explode('|', $m[1]);
                            $cleanPath = preg_replace('/\s[a-f0-9]{32}$/i', '', trim(str_replace('.md', '', $p[0])));
                            $url = '/' . ltrim(strtolower(preg_replace('/\/index$/i', '', $cleanPath)), '/');
                            return "<a href='$url'>" . trim($p[1] ?? $p[0]) . "</a>";
                        }, $displayValue);

                        // This handles !]
                        $displayValue = preg_replace_callback('/!\[\[(.*?)(\|(\d+))?\]\]/', function ($m) use ($markdownDir) {
                            $path = find_image_path($markdownDir, trim($m[1]));
                            $width = $m[3] ?? '75';
                            return $path ? "<img src='$path' style='width:{$width}px; height:auto;'>" : "<i>(Image not found)</i>";
                        }, $displayValue);

                        // 3. Output the result (No htmlspecialchars here so the <a> tags work)
                        echo $displayValue; 
                    ?>
                </li>
            <?php endforeach; ?>
        </ul>
    </div>
</div>