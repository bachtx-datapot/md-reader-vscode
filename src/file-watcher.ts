import * as vscode from 'vscode'
import debounce from 'lodash.debounce'

export function createFileWatcher(
  onChanged: (uri: vscode.Uri) => void,
): vscode.Disposable[] {
  const debouncedChange = debounce((doc: vscode.TextDocument) => {
    if (doc.languageId === 'markdown') onChanged(doc.uri)
  }, 300)

  return [
    vscode.workspace.onDidChangeTextDocument(e => debouncedChange(e.document)),
    vscode.workspace.onDidSaveTextDocument(doc => {
      if (doc.languageId === 'markdown') onChanged(doc.uri)
    }),
  ]
}
