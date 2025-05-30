export interface RemoteComponentGeneratorSchema {
  remote: string
  name: string
  selector: string
  inlineTemplate: boolean
  changeDetection: 'Default' | 'OnPush'
  style: 'css' | 'scss' | 'sass' | 'less' | 'none'
  displayBlock: boolean
  remoteLoaderProject?: string
}
