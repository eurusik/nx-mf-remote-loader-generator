# NX Module Federation Remote Component Generator

A Nx generator for creating and exposing remote components with SSR support in Module Federation. This generator works in conjunction with `ngx-mf-remote-loader` to provide seamless SSR support for remote components.

## Features

- Creates Angular components that can be exposed via Module Federation
- Configures components for server-side rendering (SSR) support
- Automatically registers components with the remote loader
- Adds type declarations for better TypeScript support

## Prerequisites

This generator is designed to work with the [`ngx-mf-remote-loader`](https://github.com/eurusik/ngx-mf-remote-loader) package, which provides server-side rendering support for Module Federation remote components.

## Usage

```bash
nx g nx-mf-remote-loader-generator:remoteComponent \
  --remote=my-remote-app \
  --name=MyComponent \
  --selector=my-remote-component
```

### Generator Options

| Option | Description | Type | Default |
|--------|-------------|------|---------|
| `remote` | Remote application to add component to | string | *required* |
| `name` | Name under which the component will be exposed | string | *required* |
| `selector` | Selector for the remote component | string | `remote-component` |
| `displayBlock` | Add `:host { display: block; }` to styles | boolean | `false` |
| `style` | Style file extension/preprocessor | `css`, `scss`, `sass`, `less`, `none` | `none` |
| `inlineTemplate` | Use inline template in component.ts | boolean | `false` |
| `changeDetection` | Change detection strategy | `Default`, `OnPush` | `OnPush` |
| `remoteLoaderProject` | Name of the remote loader project | string | `ngx-mf-remote-loader` |

## Important: Workspace Project Requirement

**This generator requires an Nx project named 'ngx-mf-remote-loader' in your workspace**. Simply installing the npm package is not sufficient, as the generator needs to modify project source files.

If the project is not found, the generator will skip the remote loader configuration with a warning message.

## How It Works

When you run the generator, it:

1. Creates a new Angular component in the specified remote application
2. Configures the component to be exposed via Module Federation
3. Updates the remote application's TypeScript configuration
4. Adds the component to the remote loader server for SSR support
5. Adds type declarations for the remote component

## Creating Your Own Remote Loader Implementation

You need to create your own implementation of the remote loader while using the interfaces from `ngx-mf-remote-loader`. This gives you more control while ensuring compatibility with the generator.

### Step 1: Create a library in your Nx workspace

```bash
nx g @nx/angular:library my-remote-loader --buildable
```

### Step 2: Implement the browser loader

```typescript
// libs/my-remote-loader/src/lib/remote-loader-browser.ts
import { loadRemoteModule } from '@nx/angular/mf';
import { RemoteLoader } from 'ngx-mf-remote-loader';

export class RemoteLoaderBrowser extends RemoteLoader {
  load(remoteName: string, remoteModule: string): Promise<any> {
    return loadRemoteModule(remoteName, './' + remoteModule).then((m) => {
      return remoteModule === 'Module' ? m.RemoteEntryModule : m;
    });
  }
}
```

### Step 3: Implement the server-side loader

```typescript
// libs/my-remote-loader/src/lib/remote-loader-server.ts
import { RemoteLoader } from 'ngx-mf-remote-loader';

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

### Step 4: Create a remotes.d.ts file

```typescript
// libs/my-remote-loader/src/lib/remotes.d.ts
// Type declarations for remote modules will be added here by the generator
```

### Step 5: Export your implementations

```typescript
// libs/my-remote-loader/src/index.ts
// We only export our custom implementations
export * from './lib/remote-loader-browser';
export * from './lib/remote-loader-server';

export function remoteLoader(remoteName: string) {
  return () => import('./lib/remote-loader-component').then(
    (m) => m.createRemoteModule(remoteName)
  );
}
```

### Step 6: Use your implementation via dependency injection

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
// Still import from ngx-mf-remote-loader - your implementation will be used through DI
import { RemoteLoader } from 'ngx-mf-remote-loader';
// Import your custom implementation
import { RemoteLoaderBrowser } from './path-to-your-implementation';
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

### Step 7: Generate components with your custom library

```bash
nx g nx-mf-remote-loader-generator:remoteComponent \
  --remote=my-remote-app \
  --name=MyComponent \
  --remoteLoaderProject=my-remote-loader
```

With this approach, your application uses the `ngx-mf-remote-loader` interfaces, but your custom implementation is injected at runtime.

## License

MIT
