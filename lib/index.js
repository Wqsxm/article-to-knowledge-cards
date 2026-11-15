// 生图：把输入框里写的文字当提示词，调用免费出图接口，存进相册。
// 运行在 DSH 引擎（Node）里；App 只负责画胶囊和转发点按。
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'

export const name = 'local-imagegen'

const API = 'https://image.pollinations.ai/prompt/'

function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

async function saveJpeg(buf) {
  const dirs = ['/sdcard/Pictures/DSH-Go', '/sdcard/Download/DSH-Go', join(homedir(), 'Pictures', 'DSH-Go')]
  let name = `gen-${stamp()}.jpg`
  for (const dir of dirs) {
    try {
      await mkdir(dir, { recursive: true })
      const file = join(dir, name)
      await writeFile(file, buf)
      return file
    } catch {
      // 换下一个目录
    }
  }
  return null
}

export function apply(ctx) {
  ctx.inject(['dshGo'], (ctx) => {
    ctx.dshGo.on('gen', (scope, event) => {
      const zh = !String(event.locale).startsWith('en')
      const prompt = String(scope.draft ?? '').trim()
      if (prompt === '') {
        return { toast: zh ? '先在输入框写要画什么' : 'Type a prompt first' }
      }
      return {
        pending: { label: zh ? '正在画' : 'Drawing', timeoutMs: 55_000 },
        result: async (signal) => {
          const seed = Math.floor(Math.random() * 900000)
          const url = `${API}${encodeURIComponent(prompt.slice(0, 400))}?width=768&height=1024&nologo=true&seed=${seed}`
          let res
          try {
            res = await fetch(url, { signal })
          } catch {
            return { toast: zh ? '网络没通，等会儿再试' : 'Network failed' }
          }
          if (!res.ok) {
            return { toast: zh ? `出图失败 ${res.status}` : `Failed ${res.status}` }
          }
          let buf
          try {
            buf = Buffer.from(await res.arrayBuffer())
          } catch {
            return { toast: zh ? '图没收全，再试一次' : 'Download interrupted' }
          }
          if (buf.length < 1000) {
            return { toast: zh ? '这次没画出来，再试' : 'No image this time' }
          }
          const file = await saveJpeg(buf)
          if (!file) {
            return { toast: zh ? '图存不进去，检查存储' : 'Cannot save image' }
          }
          return { toast: zh ? '画好了，去相册 DSH-Go 看' : 'Saved to gallery / DSH-Go' }
        },
      }
    })
  })
}
