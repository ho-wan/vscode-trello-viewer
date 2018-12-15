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
      const dep = [
        new Dependency("Check key and token", vscode.TreeItemCollapsibleState.None, {
          command: "trelloViewer.test",
          title: ""
        }),
        new Dependency("Set credentials", vscode.TreeItemCollapsibleState.None, {
          command: "trelloViewer.setCredentials",
          title: ""
        }),
        new Dependency("Reset credentials", vscode.TreeItemCollapsibleState.None, {
          command: "trelloViewer.resetCredentials",
          title: ""
        }),
      ];
      return Promise.resolve(dep);
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
