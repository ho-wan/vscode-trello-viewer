
import * as vscode from 'vscode';

export class TrelloTreeView implements vscode.TreeDataProvider<TrelloItem> {

	constructor() {
	}

	getTreeItem(element: TrelloItem): vscode.TreeItem {
		console.log('🌲getting tree item');
		// console.log(element);
		return element;
	}

	getChildren(element?: TrelloItem): Thenable<TrelloItem[]> {
		console.log('👶getting children');
		// console.log(element);
		// if (!element) {
		// 	const trelloBoards = trello.getStarredBoards();
		// 	return Promise.resolve(trelloBoards);
		// }
		if (!element) {
			const dep1 = new TrelloItem('Test', vscode.TreeItemCollapsibleState.None, {
				command: 'trello.test',
				title: '',
			});
			return Promise.resolve([dep1]);
		}
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
