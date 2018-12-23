import * as vscode from "vscode";

export class TrelloItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly id: string,
    public readonly type: string,
    public readonly tooltip?: string,
    public readonly parentId?: string,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
  }

  contextValue = `${this.type}`;
}
