import * as vscode from 'vscode';
import { HttpFileParser, HttpParsedElement, HttpRequestData, HttpGroupData } from './HttpFileParser';

export class HttpRequestItem extends vscode.TreeItem {
    public children: HttpRequestItem[] | undefined;
    public itemType: 'group' | 'request';
    public filePath: string; // 始终指向 .http 文件
    public lineNumber: number; // 请求或分组定义的行号
    public requestContent?: string; // 仅用于请求

    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        itemType: 'group' | 'request',
        filePath: string,
        lineNumber: number,
        requestContent?: string,
        children?: HttpRequestItem[]
    ) {
        super(label, collapsibleState);
        this.itemType = itemType;
        this.filePath = filePath;
        this.lineNumber = lineNumber;
        this.requestContent = requestContent;
        this.children = children;

        if (itemType === 'request') {
            this.tooltip = `${this.label} (行 ${lineNumber})`;
            // 对于请求，描述可以显示片段，如果标签足够，也可以为空
            this.description = requestContent ? requestContent.split('\n')[0].substring(0, 30) + '...' : `行 ${lineNumber}`;
            this.command = {
                command: 'list-http.openRequest',
                title: '打开请求',
                arguments: [this]
            };
            this.contextValue = 'httpRequest';
        } else { // 分组
            this.tooltip = `${this.label} (分组于行 ${lineNumber})`;
            this.description = `分组 (行 ${lineNumber})`;
            this.contextValue = 'httpGroup';
            // 分组本身不通过主命令打开特定的请求行
        }
    }
}

export class HttpRequestProvider implements vscode.TreeDataProvider<HttpRequestItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HttpRequestItem | undefined | null | void> = new vscode.EventEmitter<HttpRequestItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<HttpRequestItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private currentHttpFile: string | undefined;

    constructor() {
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor && editor.document.fileName.endsWith('.http')) {
                this.currentHttpFile = editor.document.fileName;
            }
            this.refresh();
        });

        let debounceTimer: NodeJS.Timeout | null = null;
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document.fileName.endsWith('.http')) {
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }
                debounceTimer = setTimeout(() => {
                    this.refresh();
                    debounceTimer = null;
                }, 300);
            }
        });

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

    async getChildren(element?: HttpRequestItem): Promise<HttpRequestItem[]> {
        if (element && element.itemType === 'group') {
            return element.children || [];
        }

        // 根级别
        const activeEditor = vscode.window.activeTextEditor;
        let filePath = activeEditor?.document.fileName;

        if ((!activeEditor || !activeEditor.document.fileName.endsWith('.http')) && this.currentHttpFile) {
            filePath = this.currentHttpFile;
        }

        if (!filePath || !filePath.endsWith('.http')) {
            return Promise.resolve([]);
        }

        // 读取配置
        const config = vscode.workspace.getConfiguration('list-http.requestDisplay');
        const showMethodConfig = config.get<boolean>('showMethod', true);
        const methodPositionConfig = config.get<string>('methodPosition', 'suffix');

        try {
            const parsedElements = await HttpFileParser.parseHttpFile(filePath);
            const rootItems: HttpRequestItem[] = [];
            let currentGroup: HttpRequestItem | null = null;

            for (const parsedElement of parsedElements) {
                if (parsedElement.type === 'group') {
                    const groupData = parsedElement as HttpGroupData;
                    currentGroup = new HttpRequestItem(
                        groupData.name,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        'group',
                        filePath, // 分组定义的文件路径
                        groupData.lineNumber,
                        undefined, // 分组没有请求内容
                        [] // 初始化分组的子项数组
                    );
                    rootItems.push(currentGroup);
                } else if (parsedElement.type === 'request') {
                    const requestData = parsedElement as HttpRequestData;
                    let displayLabel = '';
                    let baseName = '';

                    // 确定基础名称
                    if (requestData.commentName && requestData.commentName.trim() !== '') {
                        baseName = requestData.commentName.trim();
                    } else {
                        // 如果没有 commentName，则尝试从 requestData.name 中提取或使用它
                        // 如果 requestData.name 本身包含方法 (例如 "GET /users") 并且不希望显示方法，则需要处理
                        if (requestData.method && requestData.url && requestData.name.startsWith(requestData.method)) {
                            // 尝试从 name 中移除方法和前导/尾随空格，只留下 URL 或路径部分作为 baseName
                            let potentialBaseName = requestData.name.substring(requestData.method.length).trim();
                            if (potentialBaseName.startsWith(requestData.url)) { // 确保移除的是正确的方法部分
                                baseName = requestData.url; // 或者用更精细的逻辑提取URL后的部分
                            } else {
                                baseName = requestData.name; // 无法安全移除，则使用原始名称
                            }
                        } else {
                            baseName = requestData.name; // requestData.name 是解析器提供的备用名称
                        }
                    }
                    if (!baseName || baseName.trim() === '') { // 确保 baseName 不为空
                        baseName = "未命名请求";
                    }

                    // 确定方法部分
                    let methodPart = '';
                    if (showMethodConfig && requestData.method) {
                        methodPart = `[${requestData.method.toUpperCase()}]`;
                    }

                    // 根据配置组合标签
                    if (methodPart) {
                        if (methodPositionConfig === 'prefix') {
                            displayLabel = `${methodPart} ${baseName}`.trim();
                        } else { // suffix 是默认值
                            displayLabel = `${baseName} ${methodPart}`.trim();
                        }
                    } else {
                        displayLabel = baseName;
                    }
                    if (!displayLabel || displayLabel.trim() === '') { // 再次确保 displayLabel 不为空
                        displayLabel = "未命名请求";
                    }

                    const requestItem = new HttpRequestItem(
                        displayLabel,
                        vscode.TreeItemCollapsibleState.None,
                        'request',
                        filePath, // 请求的文件路径
                        requestData.lineNumber,
                        requestData.content
                    );

                    if (currentGroup) {
                        currentGroup.children!.push(requestItem); // 添加到当前分组的子项
                    } else {
                        rootItems.push(requestItem); // 作为顶级请求添加
                    }
                }
            }
            return rootItems;

        } catch (error: any) {
            console.error('解析HTTP文件或构建树时出错:', error);
            vscode.window.showErrorMessage(`构建请求树时出错: ${error.message || error}`);
            return [];
        }
    }
} 