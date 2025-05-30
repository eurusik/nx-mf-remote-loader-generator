import { formatFiles, readProjectConfiguration, Tree } from '@nx/devkit'
import { RemoteComponentGeneratorSchema } from './schema'
import { componentGenerator, federateModuleGenerator } from '@nx/angular/generators'
import { join } from 'node:path'
import { kebabCase } from 'lodash'
import { addFileToRemoteTsConfigs } from './lib/add-file-to-remote-ts-configs'
import { addRemoteLoaderServerEntry } from './lib/add-remote-loader-server-entry'

/**
 * Generates a remote component and exposes it with Module Federation
 * 
 * This generator performs the following tasks:
 * 1. Creates a new Angular component in the specified remote application
 * 2. Configures the component to be exposed via Module Federation
 * 3. Updates the remote application's TypeScript configuration
 * 4. Adds the component to the remote loader server for SSR support
 *
 * @param tree - The NX file tree
 * @param options - Configuration options from the schema
 * @returns A Promise that resolves when the generation is complete
 * @throws Error if the remote project doesn't have a sourceRoot defined
 */
export async function remoteComponentGenerator(tree: Tree, options: RemoteComponentGeneratorSchema) {
  const remoteProjectConfig = readProjectConfiguration(tree, options.remote)
  
  if (!remoteProjectConfig.sourceRoot) {
    throw new Error(`Project ${options.remote} does not have a sourceRoot defined.`)
  }
  
  const remoteComponentPath = join(
    remoteProjectConfig.sourceRoot,
    'app/remote-entry',
    kebabCase(options.name),
    `${kebabCase(options.name)}.component.ts`
  )
  await componentGenerator(tree, {
    name: 'Remote',
    selector: options.selector,
    path: remoteComponentPath,
    inlineTemplate: options.inlineTemplate,
    changeDetection: options.changeDetection,
    displayBlock: options.displayBlock,
    style: options.style,
    skipTests: true
  })
  await federateModuleGenerator(tree, {
    path: remoteComponentPath,
    name: options.name,
    remote: options.remote
  })
  addFileToRemoteTsConfigs(tree, {
    remote: remoteProjectConfig,
    pathToExpose: remoteComponentPath.replace(remoteProjectConfig.sourceRoot, 'src')
  })
  addRemoteLoaderServerEntry(tree, { 
    remote: options.remote, 
    name: options.name,
    remoteLoaderProject: options.remoteLoaderProject 
  })
  await formatFiles(tree)
}

export default remoteComponentGenerator
