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
		showCollapseAll: true,
		canSelectMany: false // 对用户操作强制单选
	});

	// 注册打开请求命令 - 替代原来的选择事件监听
	let openRequestDisposable = vscode.commands.registerCommand('list-http.openRequest',
		async (item: HttpRequestItem) => {
			// 在继续之前，确保 item 是一个请求并且具有必要的属性
			if (item && item.itemType === 'request' && item.filePath && item.range) {
				try {
					// 检查所有打开的编辑器，看是否已经打开了该文件
					const existingEditor = vscode.window.visibleTextEditors.find(
						(editor) => editor.document.uri.fsPath === item.filePath
					);

					let editor: vscode.TextEditor;
					if (existingEditor) {
						// 如果文件已经打开，使用已存在的编辑器，并确保它可见
						editor = await vscode.window.showTextDocument(existingEditor.document, { viewColumn: existingEditor.viewColumn, preview: true });
					} else {
						// 否则打开新编辑器
						editor = await vscode.window.showTextDocument(vscode.Uri.file(item.filePath), { preview: true });
					}

					// 选择该行
					editor.selection = new vscode.Selection(item.range.start, item.range.start);

					// 滚动到该行
					editor.revealRange(
						item.range,
						vscode.TextEditorRevealType.InCenterIfOutsideViewport
					);
				} catch (error: any) {
					console.error('跳转到请求位置失败:', error);
					vscode.window.showErrorMessage(`无法打开请求: ${error.message || error}`);
				}
			} else if (item && item.itemType === 'group') {
				console.log(`点击了分组项: ${item.label}`);
			}
		});

	// 注册刷新命令
	let refreshDisposable = vscode.commands.registerCommand('list-http.refresh', () => {
		httpRequestProvider.refresh();
	});

	// 监听光标位置变化以实现双向绑定
	let selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(async event => {
		if (event.textEditor.document.fileName.endsWith('.http')) {
			const item = httpRequestProvider.getItemForPosition(event.selections[0].active);

			// 如果找到的项不是当前已选中的唯一项，则更新选择
			if (item && (treeView.selection.length !== 1 || treeView.selection[0] !== item)) {
				// 强制替换选择的关键：使用 focus: true 来模拟用户点击行为
				await treeView.reveal(item, { select: true, focus: true });
				// 立刻将焦点切回编辑器，让用户可以继续操作
				await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
			}
		}
	});

	context.subscriptions.push(treeView, openRequestDisposable, refreshDisposable, selectionChangeDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }