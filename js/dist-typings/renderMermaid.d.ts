interface ParseResult {
    diagramType: string;
}
interface MermaidLib {
    initialize(config: Record<string, unknown>): void;
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
export {};
