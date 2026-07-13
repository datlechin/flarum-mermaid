<?php

/*
 * This file is part of datlechin/flarum-mermaid.
 *
 * Copyright (c) 2026 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\Mermaid;

use Flarum\Extend;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),
    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js'),
    new Extend\Locales(__DIR__.'/locale'),

    (new Extend\Settings)
        ->default('datlechin-mermaid.theme', 'flarum')
        ->default('datlechin-mermaid.font_family', '')
        ->serializeToForum('mermaidTheme', 'datlechin-mermaid.theme')
        ->serializeToForum('mermaidFontFamily', 'datlechin-mermaid.font_family'),
];
