import { Tree, updateJson } from '@nx/devkit'
import { ProjectConfiguration } from '@nx/devkit'

/**
 * Filters an array of files, removing the path that needs to be added
 * This prevents duplication of paths in the configuration
 * 
 * @param files - Array of file paths
 * @param pathToExpose - Path to check for duplication
 * @returns Filtered array of files
 */
function normalizeFiles(files: string[], pathToExpose: string) {
  return files.filter((f) => !f.includes(pathToExpose))
}

/**
 * Adds the component file path to the remote application's tsconfig.json files
 * Updates the configuration for both build and server targets
 * 
 * @param tree - The NX file tree
 * @param options - Configuration options
 * @param options.remote - The remote project configuration
 * @param options.pathToExpose - The file path to add to the configuration
 */
export function addFileToRemoteTsConfigs(
  tree: Tree,
  options: {
    remote: ProjectConfiguration
    pathToExpose: string
  }
) {
  const targetsToUpdate = ['build', 'server']
  if (!options.remote.targets) {
    return;
  }
  
  for (const targetName of targetsToUpdate) {
    const target = options.remote.targets[targetName]
    if (!target) continue
    updateJson(tree, target.options.tsConfig, (json) => ({
      ...json,
      files: [...normalizeFiles(json.files, options.pathToExpose), options.pathToExpose]
    }))
  }
}
