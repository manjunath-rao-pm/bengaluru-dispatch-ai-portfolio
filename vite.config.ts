import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Record package names actually observed in main and worker chunks; never emit machine paths.
function bundleInventory(scope: string): Plugin {
  return {
    name: 'release-bundle-inventory',
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).filter(item => item.type === 'chunk').map(chunk => ({
        file: chunk.fileName,
        packages: [...new Set(Object.keys(chunk.modules).flatMap(id => {
          const match = id.replaceAll('\\', '/').match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)
          return match ? [match[1]] : []
        }))].sort(),
      }))
      this.emitFile({ type: 'asset', fileName: scope + '-bundle-package-inventory.json', source: JSON.stringify({ scope: 'Observed chunk module IDs; prebundled worker internals may not be individually exposed.', chunks }, null, 2) })
    },
  }
}
export default defineConfig({
  plugins: [react(), bundleInventory('main')],
  worker: { plugins: () => [bundleInventory('worker')] },
})
