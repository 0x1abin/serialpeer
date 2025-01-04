import sharp from 'sharp'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '../public')

async function generateIcons() {
  const sizes = [192, 512]
  const source = path.join(publicDir, 'logo.svg')

  for (const size of sizes) {
    await sharp(source)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `pwa-${size}x${size}.png`))
  }

  console.log('PWA icons generated successfully!')
}

generateIcons().catch(console.error) 