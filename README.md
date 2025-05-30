# NX Module Federation Remote Component Generator

A Nx generator for creating and exposing remote components with SSR support in Module Federation. This generator works in conjunction with `ngx-mf-remote-loader` to provide seamless SSR support for remote components.

## Prerequisites

This generator works best when used with the [`ngx-mf-remote-loader`](https://github.com/eurusik/ngx-mf-remote-loader) package, which provides server-side rendering support for Module Federation remote components.

## Installation

```bash
npm install nx-mf-remote-loader-generator
```

## Usage

Once installed, you can use the generator to create a new remote component:

```bash
nx g nx-mf-remote-loader-generator:remoteComponent \
  --remote=my-remote-app \
  --name=MyComponent \
  --selector=my-remote-component
```

### Options

| Option | Description | Type | Default |
|--------|-------------|------|---------|
| `remote` | Remote application to add component to | string | *required* |
| `name` | Name under which the remote component will be exposed in Module Federation | string | *required* |
| `selector` | Selector for the remote component | string | `remote-component` |
| `displayBlock` | Specifies if the style will contain `:host { display: block; }` | boolean | `false` |
| `style` | The file extension or preprocessor to use for style files | `css`, `scss`, `sass`, `less`, `none` | `none` |
| `inlineTemplate` | Indicates whether inline template should be used in the component.ts file | boolean | `false` |
| `changeDetection` | The change detection strategy to use in the new component | `Default`, `OnPush` | `OnPush` |
| `remoteLoaderProject` | Name of the remote loader project | string | `ngx-mf-remote-loader` |

## What it does

1. Creates a new Angular component in the specified remote application
2. Configures the component to be exposed via Module Federation
3. Updates the remote application's TypeScript configuration
4. Adds the component to the remote loader server for SSR support

## Integration with ngx-mf-remote-loader

This generator is designed to work with the [`ngx-mf-remote-loader`](https://github.com/eurusik/ngx-mf-remote-loader) package, which provides:

- Server-side rendering (SSR) support for Module Federation remote components
- Dynamic loading of remote components at runtime
- Type safety for remote component imports

When you generate a remote component using this generator, it automatically:

1. Registers the component in the remote loader server
2. Adds type declarations for the remote component
3. Updates the necessary configuration files

You can specify a custom remote loader project name using the `--remoteLoaderProject` option if your project uses a different name than the default `ngx-mf-remote-loader`.

### Important Note About Remote Loader Project

**IMPORTANT**: This generator looks for an Nx project named 'ngx-mf-remote-loader' in the workspace, not just the npm package. For this generator to work properly, you need to have the ngx-mf-remote-loader project in your Nx workspace. Simply installing the npm package is not sufficient as the generator needs to modify the project's source files.

If you don't have the `ngx-mf-remote-loader` project in your workspace, the generator will skip the remote loader configuration with a warning message.

### Creating Your Own Custom Remote Loader Library

Instead of using the npm package, you can create your own custom remote loader library in your Nx workspace based on the patterns from `ngx-mf-remote-loader`. This approach gives you more control and ensures the generator can find and modify your library.

1. **Create a new library in your Nx workspace**:

   ```bash
   nx g @nx/angular:library my-remote-loader --buildable
   ```

2. **Implement the core classes** based on the `ngx-mf-remote-loader` patterns:

   ```typescript
   // libs/my-remote-loader/src/lib/remote-loader.ts
   export abstract class RemoteLoader {
     abstract load(remoteName: string, remoteModule: string): Promise<any>;
   }

   // libs/my-remote-loader/src/lib/remote-loader-browser.ts
   import { loadRemoteModule } from '@nx/angular/mf';
   import { RemoteLoader } from './remote-loader';

   export class RemoteLoaderBrowser extends RemoteLoader {
     load(remoteName: string, remoteModule: string): Promise<any> {
       return loadRemoteModule(remoteName, './' + remoteModule).then((m) => {
         return remoteModule === 'Module' ? m.RemoteEntryModule : m;
       });
     }
   }
   ```

3. **Create the server-side implementation**:

   ```typescript
   // libs/my-remote-loader/src/lib/remote-loader-server.ts
   import { RemoteLoader } from './remote-loader';

   export class RemoteLoaderServer extends RemoteLoader {
     private moduleRegistry: Record<string, () => Promise<any>> = {};

     registerRemoteModule(remoteName: string, moduleName: string, importFn: () => Promise<any>) {
       this.moduleRegistry[remoteName + moduleName] = importFn;
     }

     load(remoteName: string, remoteModule: string): Promise<any> {
       const key = remoteName + remoteModule;
       // DefaultClause
       throw new Error(`Remote module ${remoteName}/${remoteModule} not found`);
     }
   }
   ```

4. **Create a remotes.d.ts file** for type declarations:

   ```typescript
   // libs/my-remote-loader/src/lib/remotes.d.ts
   // Type declarations for remote modules will be added here by the generator
   ```

5. **Export everything in your public API**:

   ```typescript
   // libs/my-remote-loader/src/index.ts
   export * from './lib/remote-loader';
   export * from './lib/remote-loader-browser';
   export * from './lib/remote-loader-server';
   
   export function remoteLoader(remoteName: string) {
     return () => import('./lib/remote-loader-component').then(
       (m) => m.createRemoteModule(remoteName)
     );
   }
   ```

6. **Use your custom library** in your application:

   ```typescript
   // app.module.ts
   import { NgModule } from '@angular/core';
   import { BrowserModule } from '@angular/platform-browser';
   import { RemoteLoader, RemoteLoaderBrowser } from 'my-remote-loader';
   import { AppComponent } from './app.component';

   @NgModule({
     declarations: [AppComponent],
     imports: [BrowserModule],
     providers: [
       {
         provide: RemoteLoader,
         useClass: RemoteLoaderBrowser
       }
     ],
     bootstrap: [AppComponent]
   })
   export class AppModule {}
   ```

7. **Generate remote components** using your custom library name:

   ```bash
   nx g nx-mf-remote-loader-generator:remoteComponent \
     --remote=my-remote-app \
     --name=MyComponent \
     --remoteLoaderProject=my-remote-loader
   ```

With this approach, the generator will find your custom library in the workspace and correctly add the necessary code to support your remote components.

## How These Packages Work Together

### Architecture and Interaction

`nx-mf-remote-loader-generator` and `ngx-mf-remote-loader` create a complete solution for working with remote components in Module Federation with SSR support:

- **nx-mf-remote-loader-generator** is a generator that automates the creation and configuration of remote components
- **ngx-mf-remote-loader** is a library that provides loading and rendering of these components on both server and client sides

### Workflow

1. **Creating a Remote Component**:
   ```bash
   nx g nx-mf-remote-loader-generator:remoteComponent --remote=my-remote --name=MyComponent
   ```
   
   The generator creates a component in the remote application and configures it for export through Module Federation.

2. **Registration in remote-loader-server**:
   The generator automatically adds the component to the `remote-loader-server.ts` file of the `ngx-mf-remote-loader` project:
   ```typescript
   case 'my-remoteMyComponent':
     // eslint-disable-next-line @nx/enforce-module-boundaries
     return import('my-remote/MyComponent');
   ```

3. **Type Declaration**:
   The generator adds a type declaration in the `remotes.d.ts` file:
   ```typescript
   declare module 'my-remote/MyComponent'
   ```

4. **Using the Remote Component**:
   In your host application, you can now import and use the remote component:
   ```typescript
   import { RemoteLoaderComponent } from 'ngx-mf-remote-loader';
   
   @Component({
     template: `
       <remote-loader remoteId="my-remoteMyComponent"></remote-loader>
     `
   })
   export class AppComponent {}
   ```

5. **Server-Side Rendering**:
   When the page is rendered on the server, `ngx-mf-remote-loader` will use the registered component from the server-side registry to render it properly, ensuring that the component is available during SSR.



## Example Workflow

1. Install both packages in your NX workspace:
   ```bash
   npm install nx-mf-remote-loader-generator ngx-mf-remote-loader
   ```
   
   You can find more information about the remote loader package at [https://github.com/eurusik/ngx-mf-remote-loader](https://github.com/eurusik/ngx-mf-remote-loader)

2. Set up your remote application with Module Federation

3. Generate a remote component:
   ```bash
   nx g nx-mf-remote-loader-generator:remoteComponent \
     --remote=my-remote-app \
     --name=MyComponent \
     --selector=my-component
   ```

4. Import and use the remote component in your host application using the remote loader

## License

MIT
