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
		if (item) {
			try {
				// 打开文件并跳转到对应位置
				const document = await vscode.workspace.openTextDocument(item.filePath);
				const editor = await vscode.window.showTextDocument(document);

				// 获取特定行的位置
				const position = new vscode.Position(item.lineNumber - 1, 0);

				// 选择该行
				editor.selection = new vscode.Selection(position, position);

				// 滚动到该行
				editor.revealRange(
					new vscode.Range(position, position),
					vscode.TextEditorRevealType.InCenter
				);
			} catch (error) {
				console.error('跳转到请求位置失败:', error);
				vscode.window.showErrorMessage(`无法打开请求: ${error}`);
			}
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
