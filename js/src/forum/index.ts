import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import type Mithril from 'mithril';
import renderMermaidIn from './renderMermaid';

export { default as extend } from './extend';

app.initializers.add('datlechin-mermaid', () => {
  // Re-render mermaid blocks every time a CommentPost mounts or updates.
  // CommentPost is lazy-loaded in 2.x, so extend() takes the module path.
  // extend()'s callback signature is (this, returnValue, ...originalArgs),
  // and CommentPost's lifecycle hooks pass a VnodeDOM as their only arg.
  const onPostRender = function (this: unknown, _: unknown, ...args: unknown[]) {
    const vnode = args[0] as Mithril.VnodeDOM;
    void renderMermaidIn(vnode.dom);
  };

  extend('flarum/forum/components/CommentPost', 'oncreate', onPostRender);
  extend('flarum/forum/components/CommentPost', 'onupdate', onPostRender);
});
