<?php
require_once 'Parsedown.php';

class ParsedownGloss extends Parsedown {
    function __construct() {
        // We add "gloss" to the list of fenced code blocks it looks for
        $this->BlockTypes['`'][] = 'Gloss';
        $this->BlockTypes['~'][] = 'Gloss';
    }

    protected function blockGloss($Line) {
        if (preg_match('/^([`]{3,}|[~]{3,})gloss/', $Line['text'])) {
            $Block = [
                'char' => $Line['text'][0],
                'element' => [
                    'name' => 'div',
                    'attributes' => ['class' => 'gloss-container'],
                    'handler' => 'elements',
                ],
            ];
            return $Block;
        }
    }

    protected function blockGlossContinue($Line, $Block) {
        if (isset($Block['complete'])) return;
        if (isset($Line['text'][0]) && $Line['text'][0] === $Block['char'] && preg_match('/^'.$Block['char'].'{3,}(?:\s*$)/', $Line['text'])) {
            $Block['complete'] = true;
            return $Block;
        }
        
        $text = $Line['text'];
        if (preg_match('/^(\\\\(\w+))\s*(.*)/', $text, $matches)) {
            $Block['element']['text'][] = [
                'name' => 'div',
                'attributes' => ['class' => "gloss-line gloss-{$matches[2]}"],
                'handler' => 'elements',
                'text' => [
                    ['name' => 'span', 'attributes' => ['class' => 'gloss-id'], 'text' => $matches[1]],
                    ['name' => 'span', 'attributes' => ['class' => 'gloss-content'], 'text' => $matches[3]],
                ],
            ];
        } else {
            $Block['element']['text'][] = ['name' => 'div', 'text' => $text];
        }
        return $Block;
    }

    protected function blockGlossComplete($Block) {
        return $Block;
    }
}
