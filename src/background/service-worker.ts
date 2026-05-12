// M1: ビルド基盤の確認用スタブ。URL 判定とサイドパネル開閉の実装は M2 で追加する。

chrome.runtime.onInstalled.addListener(() => {
    console.warn('[AWS Docs Companion] installed (M1 stub)');
});

export {};
