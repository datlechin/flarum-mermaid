import app from 'flarum/admin/app';
import Extend from 'flarum/common/extenders';
import { DEFAULT_MERMAID_THEME, MERMAID_THEMES } from '../common/themes';

export default [
  new Extend.Admin()
    .setting(
      () => ({
        setting: 'datlechin-mermaid.theme',
        type: 'select',
        // Built inside the callback, not at module scope: the translator is not
        // loaded until the app boots.
        options: Object.fromEntries(
          MERMAID_THEMES.map((theme) => [theme, app.translator.trans(`datlechin-mermaid.admin.settings.theme_options.${theme}`)])
        ),
        default: DEFAULT_MERMAID_THEME,
        label: app.translator.trans('datlechin-mermaid.admin.settings.theme_label'),
        help: app.translator.trans('datlechin-mermaid.admin.settings.theme_help'),
      }),
      10
    )
    .setting(
      () => ({
        setting: 'datlechin-mermaid.font_family',
        type: 'text',
        placeholder: app.translator.trans('datlechin-mermaid.admin.settings.font_family_placeholder'),
        label: app.translator.trans('datlechin-mermaid.admin.settings.font_family_label'),
        help: app.translator.trans('datlechin-mermaid.admin.settings.font_family_help'),
      }),
      0
    ),
];
