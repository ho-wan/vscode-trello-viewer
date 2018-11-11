## Theodo training 09/11/18
## Creating a VS Code Extension
---

### 1. Overview

https://code.visualstudio.com/docs/extensions/overview#_extensions

### 2. Reference

https://code.visualstudio.com/docs/extensionAPI/overview

- 2.1 Node.js modulesß
- 2.2 contribution points

### 3. Setting Toggle

https://marketplace.visualstudio.com/items?itemName=Ho-Wan.setting-toggle

- 3.1 package.json

- 3.2 contribution points
- 3.3 extension.ts
- 3.4 tests

### 4. New extension - Trello api

- 4.1 create new extension using 'yo code'
- 4.2 run command 'hello world'
- 4.3 test trello api using 'REST Client' extension
    - https://developers.trello.com/docs/api-introduction
    - get boards, get cards

- 4.4 registerCommand for set Trello api token, and get card with hardcoded id

- 4.6 install axios and make get request for boards, log response
```javascript
axios.get(`https://api.trello.com/1/members/me/boards?key=${API_KEY}&token=${API_TOKEN}`)
    .then(res => console.log(res)
    .catch(err => console.log(err.response));
```
-4.7 get card by ID
```javascript
axios.get(`https://api.trello.com/1/cards/5bd4c7061d87a7598e396abb?key=${API_KEY}&token=${API_TOKEN}`)
```

### 5. UI

- 5.1 title menu:
```json
"editor/title": [
    {
        "command": "trello.login"
    }
],
"commands": [
      {
        "command": "trello.login",
        "title": "Trello: login",
        "icon": "images/T-D.png"
      },
```

- 5.2 Custom View Container
    - https://code.visualstudio.com/docs/extensionAPI/extension-points#_contributesviewscontainers

- 5.3
    - https://github.com/Microsoft/vscode-extension-samples/tree/master/contentprovider-sample

- 5.4 Side view

```javascript
let showCardText = vscode.commands.registerTextEditorCommand('trello.showCardText', editor => {
    return workspace.openTextDocument('/Users/howant/_misc/training/vscode-trello/training-theodo/README.md')
      .then(doc => window.showTextDocument(doc, vscode.ViewColumn.Two, true));
	});
```