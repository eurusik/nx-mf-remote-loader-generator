import { ProjectConfiguration, readProjectConfiguration, Tree } from '@nx/devkit'

/**
 * Utility function to replace specific content in a string based on a marker
 * Used to insert new case statements into the remote loader server file
 *
 * @param content - The original content string
 * @param marker - The marker to find in the content
 * @param replacer - Function that takes the matched content and returns the replacement
 * @returns The updated content with replacements
 */
function exactReplace(content: string, marker: string, replacer: (match: string) => string): string {
  const markerRegex = new RegExp(`(\\s*)(case\\s+['"][^'"]+['"]:[\\s\\S]*?)(\\s*)(${marker})`, 'g');
  return content.replace(markerRegex, (match, leadingSpace, caseStatements, trailingSpace, defaultClause) => {
    return leadingSpace + replacer(caseStatements) + trailingSpace + defaultClause;
  });
}

/**
 * Adds a remote component entry to the remote loader server
 * This allows the component to be loaded by the remote loader during SSR
 *
 * @param tree - The NX file tree
 * @param options - Configuration options
 * @param options.remote - The name of the remote application
 * @param options.name - The name of the component to expose
 * @param options.remoteLoaderProject - Optional name of the remote loader project (defaults to 'ngx-mf-remote-loader')
 */
export function addRemoteLoaderServerEntry(
  tree: Tree, 
  options: { 
    remote: string; 
    name: string; 
    remoteLoaderProject?: string 
  }
) {
  const remoteLoaderProjectName = options.remoteLoaderProject || 'ngx-mf-remote-loader'
  
  try {
    const remoteLoaderProjectConfig = readProjectConfiguration(tree, remoteLoaderProjectName)
    addCaseStatementToLoader(tree, remoteLoaderProjectConfig, options.remote, options.name)
    addRemoteModuleDeclaration(tree, remoteLoaderProjectConfig, options.remote, options.name)
  } catch (error) {
    console.warn(`Remote loader project '${remoteLoaderProjectName}' not found. Skipping remote loader configuration.`)
  }
}

/**
 * Adds a case statement to the remote loader server file
 * This allows the remote component to be loaded during SSR
 *
 * @param tree - The NX file tree
 * @param projectConfig - The configuration of the remote loader project
 * @param remote - The name of the remote application
 * @param module - The name of the component to expose
 * @throws Error if the project doesn't have a sourceRoot or if the remote loader server file doesn't exist
 */
function addCaseStatementToLoader(tree: Tree, projectConfig: ProjectConfiguration, remote: string, module: string) {
  if (!projectConfig.sourceRoot) {
    throw new Error('Project does not have a sourceRoot defined')
  }
  
  const remoteLoaderServerFilePath = `${projectConfig.sourceRoot}/lib/remote-loader-server.ts`
  const fileContent = tree.read(remoteLoaderServerFilePath)
  
  if (!fileContent) {
    throw new Error(`Remote loader server file not found at ${remoteLoaderServerFilePath}`)
  }
  
  const originalContent = fileContent.toString()
  const updatedContent = exactReplace(originalContent, 'DefaultClause', (defaultClauseText) =>
    `\ncase '${remote}${module}':
      // eslint-disable-next-line @nx/enforce-module-boundaries
      return import('${remote}/${module}');`.concat(defaultClauseText)
  )
  tree.write(remoteLoaderServerFilePath, updatedContent)
}

/**
 * Adds a module declaration to the remotes.d.ts file
 * This provides TypeScript type support for the remote component
 *
 * @param tree - The NX file tree
 * @param projectConfig - The configuration of the remote loader project
 * @param remote - The name of the remote application
 * @param module - The name of the component to expose
 * @throws Error if the project doesn't have a sourceRoot or if the remotes.d.ts file doesn't exist
 */
function addRemoteModuleDeclaration(tree: Tree, projectConfig: ProjectConfiguration, remote: string, module: string) {
  if (!projectConfig.sourceRoot) {
    throw new Error('Project does not have a sourceRoot defined')
  }
  
  const remotesDeclarationFilePath = `${projectConfig.sourceRoot}/lib/remotes.d.ts`
  const fileContent = tree.read(remotesDeclarationFilePath)
  
  if (!fileContent) {
    throw new Error(`Remotes declaration file not found at ${remotesDeclarationFilePath}`)
  }
  
  const originalContent = fileContent.toString()
  const updatedContent = originalContent.concat(`declare module '${remote}/${module}'\n`)
  tree.write(remotesDeclarationFilePath, updatedContent)
}
