import * as vscode from 'vscode';
import { HttpFileParser, HttpRequest } from './HttpFileParser';

export class HttpRequestItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly filePath: string,
        public readonly lineNumber: number,
        public readonly requestContent?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = requestContent;
        this.description = requestContent ? 'HTTP Request' : '';

        // 添加点击命令
        this.command = {
            command: 'list-http.openRequest',
            title: '跳转到请求',
            arguments: [this]
        };
    }

    contextValue = 'httpRequest';
}

export class HttpRequestProvider implements vscode.TreeDataProvider<HttpRequestItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HttpRequestItem | undefined | null | void> = new vscode.EventEmitter<HttpRequestItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<HttpRequestItem | undefined | null | void> = this._onDidChangeTreeData.event;

    // 存储当前打开的HTTP文件路径
    private currentHttpFile: string | undefined;

    constructor() {
        // 监听编辑器切换事件
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor && editor.document.fileName.endsWith('.http')) {
                this.currentHttpFile = editor.document.fileName;
            }
            this.refresh();
        });

        // 监听文件内容变化事件 - 使用防抖处理
        let debounceTimer: NodeJS.Timeout | null = null;
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document.fileName.endsWith('.http')) {
                // 清除之前的定时器
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }

                // 设置新的定时器，防抖300ms
                debounceTimer = setTimeout(() => {
                    this.refresh();
                    debounceTimer = null;
                }, 300);
            }
        });

        // 监听文件保存事件
        vscode.workspace.onDidSaveTextDocument((document) => {
            if (document.fileName.endsWith('.http')) {
                this.refresh();
            }
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: HttpRequestItem): vscode.TreeItem {
        return element;
    }

    async getChildren(): Promise<HttpRequestItem[]> {
        // 先尝试使用当前活动编辑器
        const activeEditor = vscode.window.activeTextEditor;
        let filePath = activeEditor?.document.fileName;

        // 如果当前编辑器不是.http文件但有保存的HTTP文件路径，使用保存的路径
        if ((!activeEditor || !activeEditor.document.fileName.endsWith('.http')) && this.currentHttpFile) {
            filePath = this.currentHttpFile;
        }

        // 如果没有HTTP文件路径，返回空数组
        if (!filePath || !filePath.endsWith('.http')) {
            return Promise.resolve([]);
        }

        try {
            const requests = await HttpFileParser.parseHttpFile(filePath);

            return requests.map(request => {
                const label = request.method && request.url
                    ? `${request.method} ${request.url}`
                    : request.name;
                return new HttpRequestItem(
                    label,
                    vscode.TreeItemCollapsibleState.None,
                    filePath,
                    request.lineNumber,
                    request.content
                );
            });
        } catch (error) {
            console.error('解析HTTP文件失败:', error);
            return [];
        }
    }
} 