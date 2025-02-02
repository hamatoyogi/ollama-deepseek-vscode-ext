// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Ollama } from 'ollama';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "deepseek-demo" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('deepseek-demo.ai', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    const panel = vscode.window.createWebviewPanel(
      'deepChat',
      'Deep Chat',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(async (message: any) => {
      if (message.command === 'ask') {
        const userPrompt = message.prompt;
        let responseText = '';
        const ollama = new Ollama({
          host: 'http://127.0.0.1:11434',
        });
        try {
          const streamResponse = await ollama.chat({
            model: 'deepseek-r1:1.5b',
            messages: [
              {
                role: 'user',
                content: userPrompt,
              },
            ],
            stream: true,
          });

          for await (const chunk of streamResponse) {
            responseText += chunk.message.content;
          }

          panel.webview.postMessage({
            command: 'chatResponse',
            text: responseText,
          });
        } catch (error) {
          panel.webview.postMessage({
            command: 'chatResponse',
            text: `Error asking: ${String(error)}`,
          });
        }
      }
    });
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(): string {
  return /*html*/ `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deep Chat</title>
		<style>
			body {
				font-family: Arial, sans-serif;
				margin: 20px;
			}
			#prompt {
				width: 100%;
				box-sizing: border-box;
				padding: 10px;
			}
			#response {
				width: 100%;
				box-sizing: border-box;
				padding: 10px;
				min-height: 100px;
				border: 1px solid #ccc;
				border-radius: 5px;
			}
		</style>
  </head>
  <body>
    <h2>Deep Chat</h2>
    <textarea id="prompt" rows="3" placeholder="Ask something..."></textarea><br/>
    <button id="ask">Ask</button>
    <div id="response"></div>
		<script>
			const editor = acquireVsCodeApi();
			const prompt = document.getElementById('prompt');
			const ask = document.getElementById('ask');
			const response = document.getElementById('response');

			ask.addEventListener('click', () => {
				editor.postMessage({
					command: 'ask',
					prompt: prompt.value,
				});
			});

			window.addEventListener('message', (event) => {
				const { command, text } = event.data;
				if (command === 'chatResponse') {
					response.textContent = text;
				}
			});
		</script>
  </body>
  </html>
  `;
}
