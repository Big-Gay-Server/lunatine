<?php
// Expected variables provided by display.php:
// - $previewTitle: the display title for the preview
// - $previewText: the preview snippet text
// - $previewUrl: the target URL for the wiki link
?>
<div class="wiki-preview-template">
    <?php if (!empty($previewTitle)): ?>
        <div class="wiki-preview-title"><?php echo htmlspecialchars($previewTitle, ENT_QUOTES | ENT_SUBSTITUTE); ?></div>
    <?php endif; ?>
    <div class="wiki-preview-body"><?php echo $previewText; ?></div>
    <?php if (!empty($previewUrl)): ?>
        <div class="wiki-preview-footer">Open <a href="<?php echo htmlspecialchars($previewUrl, ENT_QUOTES | ENT_SUBSTITUTE); ?>">page</a></div>
    <?php endif; ?>
</div>
