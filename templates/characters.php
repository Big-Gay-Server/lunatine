<div class="main-content profile-wrapper">
    <!-- 1. Move BIO BOX to the top -->
    <?php if (!empty($bioHtml)): ?>
        <aside class="bio-sidebar">
            <div class="bio-content"><?= $bioHtml ?></div>
        </aside>
    <?php endif; ?>

    <!-- 2. PROFILE TEXT follows -->
    <article class="profile-text">
        <?= $htmlContent ?>
    </article>

    <!-- Clearfix to prevent layout collapse -->
    <div style="clear: both;"></div>
</div>