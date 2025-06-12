// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HttpRequestProvider, HttpRequestItem } from './HttpRequestProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const httpRequestProvider = new HttpRequestProvider();

	// 注册树形视图
	const treeView = vscode.window.createTreeView('httpRequests', {
		treeDataProvider: httpRequestProvider,
		showCollapseAll: true
	});

	// 注册打开请求命令 - 替代原来的选择事件监听
	let openRequestDisposable = vscode.commands.registerCommand('list-http.openRequest', async (item: HttpRequestItem) => {
		// 在继续之前，确保 item 是一个请求并且具有必要的属性
		if (item && item.itemType === 'request' && item.filePath && typeof item.lineNumber === 'number') {
			try {
				// 检查当前是否已经打开了该文件
				const currentEditor = vscode.window.activeTextEditor;
				const isFileAlreadyOpen = currentEditor && currentEditor.document.uri.fsPath === item.filePath;

				let editor;
				if (isFileAlreadyOpen) {
					// 如果文件已经打开，直接使用当前编辑器
					editor = currentEditor;
				} else {
					// 否则打开文件
					const document = await vscode.workspace.openTextDocument(item.filePath);
					editor = await vscode.window.showTextDocument(document);
				}

				// 获取特定行的位置 (lineNumber 是从1开始的)
				const position = new vscode.Position(item.lineNumber - 1, 0);

				// 选择该行
				editor.selection = new vscode.Selection(position, position);

				// 滚动到该行
				editor.revealRange(
					new vscode.Range(position, position),
					vscode.TextEditorRevealType.InCenter
				);
			} catch (error: any) {
				console.error('跳转到请求位置失败:', error);
				vscode.window.showErrorMessage(`无法打开请求: ${error.message || error}`);
			}
		} else if (item && item.itemType === 'group') {
			// 可选：处理分组项的点击事件，例如切换折叠状态或不执行任何操作。
			// 目前，在树视图中单击分组项将默认展开/折叠它。
			// 除非我们想覆盖该行为，否则此处不需要特定操作。
			console.log(`点击了分组项: ${item.label}`);
		}
	});

	// 注册刷新命令
	let refreshDisposable = vscode.commands.registerCommand('list-http.refresh', () => {
		httpRequestProvider.refresh();
	});

	context.subscriptions.push(treeView, openRequestDisposable, refreshDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
