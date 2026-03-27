<?php
require_once 'Parsedown.php'; 

class ParsedownGloss extends Parsedown {
    protected function blockFencedCodeComplete($Block) {
        // Only trigger for ```gloss blocks
        if (isset($Block['element']['attributes']['class']) && 
            $Block['element']['attributes']['class'] === 'language-gloss') {
            
            $text = $Block['element']['text'] ?? '';
            $lines = explode("\n", $text);
            $newHtml = '';

            foreach ($lines as $line) {
                // Fix: Skip empty lines to prevent "Deprecated" warnings
                if (trim($line) === '') {
                    $newHtml .= "\n";
                    continue;
                }

                if (preg_match('/^(\\\\(\w+))\s*(.*)/', $line, $matches)) {
                    $fullId  = $matches[1]; // e.g. \ex
                    $idName  = $matches[2]; // e.g. ex
                    $content = $matches[3]; // The text
                    
                    $newHtml .= "<div class=\"gloss-line gloss-$idName\">" .
                                "<span class=\"gloss-id\">$fullId</span> " .
                                "<span>$content</span></div>\n";
                } else {
                    $newHtml .= "<div>" . htmlspecialchars($line) . "</div>\n";
                }
            }

            $Block['element']['rawHtml'] = $newHtml;
            unset($Block['element']['text']);
        }
        return $Block;
    }
}
