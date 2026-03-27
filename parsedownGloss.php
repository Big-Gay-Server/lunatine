<?php
require_once 'Parsedown.php'; // Path to the original library

class ParsedownGloss extends Parsedown {
    protected function blockFencedCodeComplete($Block) {
        if (isset($Block['element']['attributes']['class']) && 
            $Block['element']['attributes']['class'] === 'language-gloss') {
            
            $lines = explode("\n", $Block['element']['text']);
            $newHtml = '';

            foreach ($lines as $line) {
                if (preg_match('/^(\\\\(\w+))\s*(.*)/', $line, $matches)) {
                    $idName = $matches[2];
                    $content = $matches[3];
                    $newHtml .= "<div class=\"gloss-line gloss-$idName\">" .
                                "<span class=\"gloss-id\">{$matches[1]}</span> " .
                                "<span>$content</span></div>\n";
                } else {
                    $newHtml .= "<div>$line</div>\n";
                }
            }

            $Block['element']['rawHtml'] = $newHtml;
            unset($Block['element']['text']);
        }
        return $Block;
    }
}

// weh