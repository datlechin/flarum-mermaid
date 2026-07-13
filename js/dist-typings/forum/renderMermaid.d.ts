import { type MermaidConfig } from './mermaidConfig';
interface ParseResult {
    diagramType: string;
}
interface MermaidLib {
    initialize(config: MermaidConfig): void;
    parse(source: string, opts: {
        suppressErrors: true;
    }): Promise<ParseResult | false>;
    render(id: string, source: string): Promise<{
        svg: string;
    }>;
}
declare global {
    interface Window {
        mermaid?: MermaidLib;
    }
}
export default function renderMermaidIn(root: ParentNode): Promise<void>;
/**
 * Draw the diagrams again when the reader switches colour scheme, so a diagram
 * rendered in light mode doesn't stay light on a dark page.
 */
export declare function watchColorScheme(): void;
export {};
