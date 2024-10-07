const ProtonNetVersion: string = "1.0.4";

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CustomWebView } from './CustomWebView';
import { CreateSolutionFormWebView } from './CreateSolutionFormWebView';
import { CreateItemFormWebView } from './CreateItemFormWebView';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    // console.log('Congratulations, your extension "protonnet" is now active!');

    let lastPanel: vscode.WebviewPanel | null = null;

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const projectDisposable = vscode.commands.registerCommand('protonnet.newProject', (uri: vscode.Uri) => {

        if (lastPanel != null) {
            lastPanel.dispose();
            lastPanel = null;
        }

        lastPanel = registerProjectTemplate(context, "SocketServer", uri);
    });

    const requestHandlerDisposable = vscode.commands.registerCommand('protonnet.addRequestHandler', (uri: vscode.Uri) => {
        
        if (lastPanel != null) {
            lastPanel.dispose();
            lastPanel = null;
        }

        lastPanel = registerItemTemplate(context, "RequestHandler", uri);
    });
    const eventHandlerDisposable = vscode.commands.registerCommand('protonnet.addEventHandler', (uri: vscode.Uri) => {
        if (lastPanel != null) {
            lastPanel.dispose();
            lastPanel = null;
        }

        lastPanel = registerItemTemplate(context, "EventHandler", uri);
    });
    const webApiControllerDisposable = vscode.commands.registerCommand('protonnet.addWebApiController', (uri: vscode.Uri) => {
        if (lastPanel != null) {
            lastPanel.dispose();
            lastPanel = null;
        }

        lastPanel = registerItemTemplate(context, "WebApiController", uri);
    });
    const webApiHtmlDisposable = vscode.commands.registerCommand('protonnet.addWebApiHtml', (uri: vscode.Uri) => {
        if (lastPanel != null) {
            lastPanel.dispose();
            lastPanel = null;
        }

        lastPanel = registerItemTemplate(context, "WebApiHtml", uri);
    });

    context.subscriptions.push(projectDisposable);
    context.subscriptions.push(requestHandlerDisposable);
    context.subscriptions.push(eventHandlerDisposable);
    context.subscriptions.push(webApiControllerDisposable);
    context.subscriptions.push(webApiHtmlDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }

function registerProjectTemplate(context: vscode.ExtensionContext, projectType: "SocketServer" | "WebApiServer", uri: vscode.Uri) {
    // Create and show a new WebView
    const panel = vscode.window.createWebviewPanel(
        'newProjectWebview', // Identifies the type of the webview. Used internally
        'Create New Solution', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in
        {
            enableScripts: true,
        } // Webview options. Can add options like enableScripts here
    );

    const htmlPath = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media')).fsPath;
    const contentPath = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'content')).fsPath;

    let customWebView = new CustomWebView(htmlPath);
    let createSolutionFormWebView = new CreateSolutionFormWebView();
    let projectName: string = "ServerApplication1";
    {
        let projectId = 1;
        while (fs.existsSync(path.join(uri.fsPath, projectName))) {
            projectId++;
            projectName = "ServerApplication" + projectId;
        }
    }

    // Set the HTML content of the WebView
    panel.webview.html = customWebView.getHtmlContent(createSolutionFormWebView.getHtmlForm({
        location: uri.fsPath,
        projectName: projectName,
        projectType: projectType,
        protonNetVersion: ProtonNetVersion,
    }));

    // Receive messages from the WebView
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'submitData':
                    // Show information message with received data
                    let result = createSolutionFormWebView.onSubmitData(message.data, contentPath);

                    if (result.status == "success") {
                        vscode.window.showInformationMessage(`Create new Solution : ${message.data.projectName} success.`);
                        panel.dispose();
                    }
                    else {
                        vscode.window.showErrorMessage(`Create new Solution failed with error: ${result.message}`);
                    }
            }
        },
        undefined,
        context.subscriptions
    );

    return panel;
}

function registerItemTemplate(context: vscode.ExtensionContext, itemType: "RequestHandler" | "EventHandler" | "WebApiHtml" | "WebApiController", uri: vscode.Uri) {
    // Create and show a new WebView
    const panel = vscode.window.createWebviewPanel(
        'newItemWebview', // Identifies the type of the webview. Used internally
        'Add New Item ' + `(${itemType})`, // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in
        {
            enableScripts: true,
        } // Webview options. Can add options like enableScripts here
    );

    const htmlPath = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media')).fsPath;
    const contentPath = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'content')).fsPath;

    let customWebView = new CustomWebView(htmlPath);
    let createItemFormWebView = new CreateItemFormWebView();

    let extensionName: string = null as any;
    if (itemType == "RequestHandler") {
        extensionName = ".cs";
    }
    else if (itemType == "EventHandler") {
        extensionName = ".cs";
    }
    else if (itemType == "WebApiController") {
        extensionName = ".cs";
    }
    else if (itemType == "WebApiHtml") {
        extensionName = ".phtml";
    }

    let itemName: string = "Name" + itemType + "1";
    {
        let finalItemType = itemType;
        if (finalItemType == 'WebApiController') {
            finalItemType = "Controller" as any;
            itemName = "NameController1";
        }

        let itemNameWithExtension: string = "Name" + finalItemType + "1" + extensionName;
        let itemId = 1;

        while (fs.existsSync(path.join(uri.fsPath, itemNameWithExtension))) {
            itemId++;
            itemNameWithExtension = "Name" + finalItemType + itemId + extensionName;
            itemName = "Name" + finalItemType + itemId;
        }
    }

    // Set the HTML content of the WebView
    panel.webview.html = customWebView.getHtmlContent(createItemFormWebView.getHtmlForm({
        location: uri.fsPath,
        itemName: itemName,
        itemType: itemType as any
    }));

    console.log(panel.webview.html);

    // Receive messages from the WebView
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'submitData':
                    // Show information message with received data

                    const workspaceFolders = vscode.workspace.workspaceFolders;

                    if (workspaceFolders) {
                        message.data.rootLocation = workspaceFolders[0].uri.fsPath;
                    }
                    else {
                        message.data.rootLocation = "";
                    }
                    message.data.itemType = itemType;

                    let result = createItemFormWebView.onSubmitData(message.data, contentPath);

                    if (result.status == "success") {
                        vscode.window.showInformationMessage(`Create new Item (${itemType}): ${message.data.itemName} success.`);

                        vscode.workspace.openTextDocument(result.message).then(document => {
                            vscode.window.showTextDocument(document);
                        });

                        panel.dispose();
                    }
                    else {
                        vscode.window.showErrorMessage(`Create new Item failed with error: ${result.message}`);
                    }
            }
        },
        undefined,
        context.subscriptions
    );

    return panel;
}
