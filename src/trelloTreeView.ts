
import * as vscode from 'vscode';
import { TrelloComponent } from "./trelloUtils";

export class TrelloTreeView implements vscode.TreeDataProvider<TrelloItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<TrelloItem | undefined> = new vscode.EventEmitter<TrelloItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TrelloItem | undefined> = this._onDidChangeTreeData.event;

	private trello: TrelloComponent;
	private trelloBoards: Array<object>;

	constructor(trello: TrelloComponent) {
		this.trello = trello;
		this.trelloBoards = [];
		this.refresh();
	}

	refresh(): void {
		console.log('🕐 refreshing');
		this.trello.getStarredBoards().then(boards => {
			this.trelloBoards = boards;
			this._onDidChangeTreeData.fire();
		});
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
			if (this.trelloBoards === undefined || this.trelloBoards.length == 0) {
				console.log('🤔 this.trelloBoards is null');
				return Promise.resolve([]);
			}
			const boards = this.trelloBoards.map((board: any) => {
				return new TrelloItem(board.name, vscode.TreeItemCollapsibleState.None, {
					command: 'trello.test',
					title: '',
				});
			});
			console.log('😃 getting boards for children');
			// console.log(boards);
			return Promise.resolve(boards);
		}
		console.log('☹ no children');
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
