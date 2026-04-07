<?php
header('Content-Type: application/xml; charset=utf-8');
$site_url = 'https://lunatine.lunarconstruct.net';
$dir = '/posts/';

echo '<?xml version="1.0" encoding="UTF-8" ?>';
?>
<rss version="2.0">
<channel>
    <title>My Automated Feed</title>
    <link><?php echo $site_url; ?></link>
    <description>Latest posts from my server folder</description>
    <?php
    require_once 'vendor/autoload.php';
    $Parsedown = new Parsedown();

    $files = glob($dir . '*.{html,md}', GLOB_BRACE);

    // Sort files by newest modified date
    usort($files, function ($a, $b) {
      return filemtime($b) - filemtime($a);
    });

    foreach ($files as $file) {
      $filename = basename($file);
      $raw_content = file_get_contents($file);

      // Looks for the first line starting with # or ##
      if (preg_match('/^#+\s+(.+)$/m', $raw_content, $matches)) {
        $title = htmlspecialchars($matches[1]);
      } else {
        // Fallback to filename if no header is found
        $title = ucwords(str_replace(['.html', '.md', '_', '-'], ['', '', ' ', ' '], $filename));
      }

      $date = date(DATE_RSS, filemtime($file));
      $clean_name = str_replace(['.md', '.html'], '', $filename);
      $link = 'https://lunatine.lunarconstruct.net/news/' . $clean_name;

      // clean for preview
      $html_content = $Parsedown->text($raw_content);
      $plain_text = strip_tags($html_content);
      $clean_preview = str_replace(["\r", "\n"], ' ', $plain_text);

      // remove title from preview
      $clean_preview = str_replace($title, '', $clean_preview);
      $description = htmlspecialchars(mb_substr(trim($clean_preview), 0, 200)) . '...';

      echo "<item><title>$title</title><link>$link</link><description>$description</description><pubDate>$date</pubDate><guid>$link</guid></item>";
    }
    ?>
</channel>
</rss>
