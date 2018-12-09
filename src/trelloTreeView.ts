
import * as vscode from 'vscode';
import { TrelloComponent } from "./trelloUtils";

export class TrelloTreeView implements vscode.TreeDataProvider<TrelloItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<TrelloItem | undefined> = new vscode.EventEmitter<TrelloItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TrelloItem | undefined> = this._onDidChangeTreeData.event;

	private trello: TrelloComponent;

	constructor(trello: TrelloComponent) {
		this.trello = trello;
	}

	refresh(): void {
		console.log('🕐 refreshing');
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: TrelloItem): vscode.TreeItem {
		console.log('🌲 getting tree item');
		// console.log(element);
		return element;
	}

	getChildren(element?: TrelloItem): Thenable<TrelloItem[]> {
		console.log('👶 getting children');
		// console.log(element);
		if (!element) {
			const trelloBoards = this.trello.getStarredBoards();
			trelloBoards.then((boards) => {
				console.log('🅱 getting boards from TreeView');
				console.log(boards);
				const dep1 = new TrelloItem('Test', vscode.TreeItemCollapsibleState.None, {
					command: 'trello.test',
					title: '',
				});
				return Promise.resolve([dep1]);
			})
		}
		// if (!element) {
		// 	const dep1 = new TrelloItem('Test', vscode.TreeItemCollapsibleState.None, {
		// 		command: 'trello.test',
		// 		title: '',
		// 	});
		// 	return Promise.resolve([dep1]);
		// }
		console.log('🤔 return empty');
		return Promise.resolve([]);
	};
}

export class TrelloItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	contextValue = 'trelloItem';
}
