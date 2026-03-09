import imageViewerPlugin from './img-viewer'
import blockCopyPlugin from './block-copy'
import { usePlugin, initPlugins } from '@/core/plugin'

usePlugin([blockCopyPlugin, imageViewerPlugin])

export { initPlugins }
