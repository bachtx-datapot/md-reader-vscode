import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'
import mSub from 'markdown-it-sub'
import mSup from 'markdown-it-sup'
import mIns from 'markdown-it-ins'
import mAbbr from 'markdown-it-abbr'
import mMark from 'markdown-it-mark'
import mEmoji from 'markdown-it-emoji'
import mDeflist from 'markdown-it-deflist'
import mFootnote from 'markdown-it-footnote'
import mTaskLists from 'markdown-it-task-lists'
import mAnchor from 'markdown-it-anchor'
import mToc from 'markdown-it-table-of-contents'
import mKatex from '@traptitech/markdown-it-katex'
import mMermaid from '@md-reader/markdown-it-mermaid'
import mAlert from '@/plugins/alert'
import mMultimdTable from 'markdown-it-multimd-table'
import MD_PLUGINS from '@/config/md-plugins'
import className from '@/config/class-name'
import { escapeHtml } from 'markdown-it/lib/common/utils'

type Plugins = { [p: string]: ((a: MdOptions) => any[]) | any[] }
const PLUGINS: Plugins = {
  Emoji: [mEmoji],
  Sub: [mSub],
  Sup: [mSup],
  Ins: [mIns],
  Abbr: [mAbbr],
  Katex: [mKatex],
  Mermaid: ({ theme }) => [
    mMermaid,
    { theme: theme === 'dark' ? 'dark' : 'default', themeVariables: undefined },
  ],
  Mark: [mMark],
  Deflist: [mDeflist],
  Footnote: [mFootnote],
  TaskLists: [mTaskLists],
  TOC: [mToc],
  Alert: [mAlert],
}

export interface MdOptions {
  [key: string]: any
  config?: MarkdownIt.Options
  plugins?: Array<string>
}

// Copy button as raw HTML string — no DOM dependency
const copyButtonHtml = `<button class="${className.MD_BUTTON} ${className.COPY_BTN}" title="Copy"><svg class="icon-copy" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 225 225" fill="currentColor"><path d="M9,189.78V98.22A26.22,26.22,0,0,1,35.22,72h91.56A26.22,26.22,0,0,1,153,98.22v91.56A26.22,26.22,0,0,1,126.78,216H35.22A26.22,26.22,0,0,1,9,189.78Zm18-85.65v79.74A14.13,14.13,0,0,0,41.13,198h79.74A14.13,14.13,0,0,0,135,183.87V104.13A14.13,14.13,0,0,0,120.87,90H41.13A14.13,14.13,0,0,0,27,104.13Z"/><path d="M54,117h54a9,9,0,0,1,9,9h0a9,9,0,0,1-9,9H54a9,9,0,0,1-9-9h0A9,9,0,0,1,54,117Z"/><rect x="45" y="153" width="72" height="18" rx="9"/><path d="M72,54V36.43A27.43,27.43,0,0,1,99.43,9h90.09A26.47,26.47,0,0,1,216,35.48v90.09A27.43,27.43,0,0,1,188.57,153H171a9,9,0,0,1-9-9h0a9,9,0,0,1,9-9h13.32A13.67,13.67,0,0,0,198,121.32V40.68A13.67,13.67,0,0,0,184.32,27H103.68A13.67,13.67,0,0,0,90,40.68V54a9,9,0,0,1-9,9h0A9,9,0,0,1,72,54Z"/></svg><svg class="icon-success" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="m939.75 218.69c-27-27-70.77-27-97.77 0l-440 440-220-220c-27-27-70.77-27-97.77 0s-27 70.77 0 97.77l268.87 268.87c.78.78 1.53 1.5 2.28 2.16 27.13 24.81 69.24 24.09 95.5-2.16l488.86-488.86c27-27 27-70.77 0-97.77z"/></svg></button>`

function initRender({ config = {}, plugins = [...MD_PLUGINS] }: MdOptions) {
  const md = new MarkdownIt({
    html: true,
    breaks: false,
    linkify: true,
    xhtmlOut: true,
    typographer: true,
    highlight(str: string, language: string) {
      if (language && hljs.getLanguage(language)) {
        try {
          return `<pre class="hljs-pre md-reader__code-block"><code class="hljs" lang="${language}">${
            hljs.highlight(str, { language, ignoreIllegals: true }).value
          }</code>${copyButtonHtml}</pre>`
        } catch (err) {
          console.error(err)
          return 'parse error'
        }
      }
      const code = escapeHtml(str)
      return `<pre class="hljs-pre md-reader__code-block"><code class="hljs ${language}">${code}</code>${copyButtonHtml}</pre>`
    },
    ...config,
  })

  // parse email
  md.linkify.set({ fuzzyEmail: true })
  // builtin plugins
  md.use(mMultimdTable)

  // Anchor plugin — adds id attrs to headings (required for TOC sidebar)
  md.use(mAnchor, { permalink: false })

  // custom plugins
  plugins.forEach(name => {
    let plugin = PLUGINS[name]
    if (typeof plugin === 'function') {
      plugin = plugin(arguments[0])
    }
    plugin && md.use(plugin[0], ...plugin.slice(1))
  })

  return md
}

// identify & filter frontmatter
function removeFrontmatter(content: string): string {
  const frontmatterRegex = /^---[\s\S]+?---\n/
  return content.replace(frontmatterRegex, '')
}

interface MdRender {
  (code: string, options: MdOptions): string
  md?: MarkdownIt
}
export const mdRender: MdRender = (code, options): string => {
  if (!mdRender.md || options) {
    mdRender.md = initRender(options)
  }
  // filter frontmatter
  const filteredCode = removeFrontmatter(code)
  return mdRender.md.render(filteredCode)
}

export default initRender
