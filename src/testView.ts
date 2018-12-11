import * as vscode from "vscode";

export class TestView implements vscode.TreeDataProvider<Dependency> {
  private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined> = new vscode.EventEmitter<
    Dependency | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<Dependency | undefined> = this._onDidChangeTreeData.event;

  constructor() {}

  refresh(): void {
    console.log("🕐refreshing");
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Dependency): vscode.TreeItem {
    // console.log('🌲getting tree item');
    // console.log(element);
    return element;
  }

  getChildren(element?: Dependency): Thenable<Dependency[]> {
    // console.log('👶getting children');
    // console.log(element);
    if (!element) {
      const dep0 = new Dependency("Check key and token", vscode.TreeItemCollapsibleState.None, {
        command: "trello.test",
        title: ""
      });
      const dep1 = new Dependency("Get Boards", vscode.TreeItemCollapsibleState.None, {
        command: "trello.getBoards",
        title: ""
      });
      const dep2 = new Dependency("Get Lists", vscode.TreeItemCollapsibleState.None, {
        command: "trello.getLists",
        title: ""
      });
      const dep3 = new Dependency("Get Card", vscode.TreeItemCollapsibleState.None, {
        command: "trello.getCard",
        title: ""
      });
      const dep4 = new Dependency("Show Card", vscode.TreeItemCollapsibleState.None, {
        command: "trello.showCard",
        title: ""
      });
      return Promise.resolve([dep0, dep1, dep2, dep3, dep4]);
    }
    return Promise.resolve([]);
  }
}

export class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
  }

  contextValue = "dependency";
}
