<?php
require_once 'parsedownBases.php';

class ParsedownGloss extends ParsedownBases {
    // We override the standard Fenced Code block
    protected function blockFencedCode($Line) {
        $Block = parent::blockFencedCode($Line);
        
        // If it's a "gloss" block, we change the element type to 'div' 
        // so it doesn't get wrapped in <pre><code>
        if (isset($Block['element']['attributes']['class']) && 
            $Block['element']['attributes']['class'] === 'language-gloss') {
            
            $Block['element']['name'] = 'div';
            $Block['element']['attributes']['class'] = 'gloss-container';
            // We tell Parsedown to use our custom "Complete" handler
            $Block['complete'] = 'blockGlossComplete';
        }
        return $Block;
    }

    protected function blockGlossComplete($Block) {
        $rawText = $Block['element']['handler']['argument'] ?? $Block['element']['text'] ?? '';
        $lines = explode("\n", $rawText);
        $newElements = [];

        foreach ($lines as $line) {
            if (trim($line) === '') continue;

            // Regex for \identifier content
            if (preg_match('/^(\\\\(\w+))\s*(.*)/', $line, $matches)) {
                $newElements[] = [
                    'name' => 'div',
                    'attributes' => ['class' => "gloss-line gloss-{$matches[2]}"],
                    'handler' => 'elements',
                    'text' => [
                        ['name' => 'span', 'attributes' => ['class' => 'gloss-id'], 'text' => $matches[1]],
                        ['name' => 'span', 'attributes' => ['class' => 'gloss-content'], 'text' => $matches[3]],
                    ],
                ];
            } else {
                $newElements[] = ['name' => 'div', 'text' => $line];
            }
        }

        // Replace the code block content with our new div structure
        $Block['element']['handler'] = 'elements';
        $Block['element']['text'] = $newElements;
        
        return $Block;
    }
}
