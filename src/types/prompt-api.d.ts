// Built-in AI Prompt API (Chrome 138+) の最低限の型定義。
// 公式型は未提供のため、spec 7 章をもとに自前で定義。API シグネチャが変わったら本ファイルから直す。

export {};

declare global {
    type LanguageModelAvailability =
        | 'available'
        | 'downloadable'
        | 'downloading'
        | 'unavailable';

    interface LanguageModelMessage {
        role: 'system' | 'user' | 'assistant';
        content: string;
    }

    interface LanguageModelMonitor {
        addEventListener(
            type: 'downloadprogress',
            listener: (event: { loaded: number; total?: number }) => void,
        ): void;
    }

    interface LanguageModelCreateOptions {
        systemPrompt?: string;
        initialPrompts?: LanguageModelMessage[];
        temperature?: number;
        topK?: number;
        monitor?: (m: LanguageModelMonitor) => void;
        signal?: AbortSignal;
    }

    interface LanguageModelPromptOptions {
        signal?: AbortSignal;
    }

    interface LanguageModelSession {
        prompt(input: string, options?: LanguageModelPromptOptions): Promise<string>;
        promptStreaming(
            input: string,
            options?: LanguageModelPromptOptions,
        ): ReadableStream<string>;
        clone(options?: { signal?: AbortSignal }): Promise<LanguageModelSession>;
        destroy(): void;
        readonly inputUsage: number;
        readonly inputQuota: number;
    }

    interface LanguageModelParams {
        defaultTemperature: number;
        maxTemperature: number;
        defaultTopK: number;
        maxTopK: number;
    }

    interface LanguageModelStatic {
        availability(): Promise<LanguageModelAvailability>;
        create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
        params(): Promise<LanguageModelParams | null>;
    }

    const LanguageModel: LanguageModelStatic;
}
