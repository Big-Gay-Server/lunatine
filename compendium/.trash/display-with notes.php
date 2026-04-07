<?php

// --- IMPORT PARSEDOWN --- //
# bring in parsedown library
require_once 'Parsedown.php';
# instantiate (create) a "parsedown" object/tool
$Parsedown = new Parsedown();

// --- GET FILE NAME BEING REQUESTED IN THE URL --- //
# sets variable $markdownDir to root directory, where the markdown files live
$markdownDir = __DIR__ . '/';
# isset evaluates if the variable is already set or NULL by using
# the GET function to check the URL to see if the file name has been passed through it.
# if that is true, $fileName is set to that file name from the URL.
# if it is false, $fileName is set to "index" so it loads the homepage.
$fileName = isset($_GET['file']) ? $_GET['file'] : 'index';
# sets variable $requestedPath to the file name minus any ".."s
# i've been told this "sanitizes" a URL, so ne'er-do-wells cant hack me lol
$requestedPath = trim(str_replace('..', '', $fileName), '/');
# evaluates if requestedPath is empty, and if it is, sets it to "index"
if (empty($requestedPath)) $requestedPath = 'index';

// --- LOCATE FILE BEING REQUESTED IN THE URL --- //
# sets $filePath variable to the full constructed file path by concatenating three strings
# root directory + requested path + .md
# i.e. /usr/share/nginx/html/lunatine + /EVENTS/timeline + .md
$filePath = realpath($markdownDir . $requestedPath . '.md');
# checks if the filepath is valid by checking if it either:
# returns as empty, null, or false, or if there is actually a file at that path.
# if the filepath is not valid, re-sets file path to be inclusive of folders with index files inside them
if (!$filePath || !file_exists($filePath)) {
    $filePath = realpath($markdownDir . $requestedPath . '/index.md');
}

// --- RECURSIVELY FIND IMAGES IN MARKDOWN FILES --- //
function find_image_path($baseDir, $imageName)
{
    # checks if $baseDir is a valid directory. if not, it returns null.
    if (!is_dir($baseDir)) return null;
    # similar to how we created a new object for parsedown, this does the same for the iterators
    # the iterators will drill into each folder and look for the image being requested.
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($baseDir));
    # for every file it finds,
    foreach ($it as $file) {
        # file name is evaluated to see if it matches the image name being requested
        if ($file->getFilename() === $imageName) {
            # this part basically normalizes and makes it relative to the file being viewed
            return '/' . ltrim(str_replace($baseDir, '', $file->getPathname()), '/');
        }
    }
    # if it finishes searching all the files and doesn't find the pic, it returns null.
    return null;
}

# sets $htmlContent and $propertiesHtml to be empty
# this initializes them before we add shit to em
$htmlContent = "";
$propertiesHtml = "";

# final check: checks if $filePath is empty/null, if the path is within the markdown directory,
# and if the file itself actually exists. if all are true, continue...
if ($filePath && str_starts_with($filePath, realpath($markdownDir)) && file_exists($filePath)) {
    # sets $markdownContent to the contents of the requested file.
    $markdownContent = file_get_contents($filePath);

    // --- PROCESS PROPERTIES (YAML FRONTMATTER) ---
    # extract everything between the first two '---' markers
    if (preg_match('/^---\s*([\s\S]*?)\s*---/', $markdownContent, $matches)) {
        # sets the $rawYaml variable to the extracted properties
        $rawYaml = $matches[1];
        # removes yaml properties from the main content
        $markdownContent = str_replace($matches[0], '', $markdownContent);

        // Parse key-value pairs manually
        $lines = explode("\n", trim($rawYaml));
        $propertiesHtml = '<div class="obsidian-properties"><h3>Properties</h3><table>';
        foreach ($lines as $line) {
            if (strpos($line, ':') !== false) {
                list($key, $value) = explode(':', $line, 2);
                $propertiesHtml .= "<tr><th>" . htmlspecialchars(trim($key)) . "</th><td>" . htmlspecialchars(trim($value)) . "</td></tr>";
            }
        }
        $propertiesHtml .= '</table></div>';
    }

    // --- PROCESS OBSIDIAN SPECIFIC SYNTAX ---

    // Images ![[image.png]]
    $markdownContent = preg_replace_callback('/!\[\[(.*?)(\|(.*))?\]\]/', function ($matches) use ($markdownDir) {
        $imageName = $matches[1];
        $width = isset($matches[3]) ? $matches[3] : '';
        $actualPath = find_image_path($markdownDir, $imageName);
        if ($actualPath) {
            $style = $width ? "style='width:{$width}px;'" : "style='max-width:100%;'";
            return "<img src='{$actualPath}' alt='{$imageName}' {$style}>";
        }
        return "<i>(Image not found: {$imageName})</i>";
    }, $markdownContent);

    // Wikilinks [[Link]] with UID cleaning
    $markdownContent = preg_replace_callback('/\[\[(.*?)\]\]/', function ($matches) {
        $parts = explode('|', $matches[1]);
        $path = preg_replace('/\s[a-f0-9]{32}$/i', '', trim(str_replace('.md', '', $parts[0])));
        $url = '/' . ltrim($path, '/');
        $text = isset($parts[1]) ? $parts[1] : $parts[0];
        return "<a href='{$url}'>{$text}</a>";
    }, $markdownContent);

    $htmlContent = $Parsedown->text($markdownContent);
} else {
    header("HTTP/1.0 404 Not Found");
    $htmlContent = "<h1>404 Not Found</h1><p>The note <b>" . htmlspecialchars($requestedPath) . "</b> could not be found.</p>";
}
?>


<!-- THE ACTUAL HTML LOL -->


<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LUNATINE</title>
    <link rel="stylesheet" href="/style.css">
</head>

<body>
    <div class="content-container">
        <?php echo $propertiesHtml; // Show the Properties box first 
        ?>
        <?php echo $htmlContent;    // Then show the main note content 
        ?>
    </div>
</body>

</html>