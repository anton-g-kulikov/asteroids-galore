// Reads the transmissions out of the story script (_meta/story-script.md), so the Writer's text is
// the one copy of what is said. A transmission is a run of quoted lines: the first is the sender in
// bold, optionally followed by an italic note such as "(faint)"; the rest are its lines. Each one
// keeps the headings it sits under and the last plain paragraph before it, which is how the
// script marks its tellings ("**Another freighter went in.**", "If the captain drops it:").

import type { Voice } from './view'

export interface ScriptBlock {
  /** The `##` heading it sits under, e.g. `m00n`, `Endings`. */
  section: string
  /** The `###` heading, e.g. `After the first trip to m00n`, `The commission`; empty when there is none. */
  part: string
  /** The last plain paragraph before it within the same part, trimmed; empty when there is none. */
  before: string
  sender: string
  voice: Voice
  faint: boolean
  lines: string[]
}

/** Who a sender is, by how the script signs them (see "Who speaks"). */
export function voiceOf(sender: string): Voice {
  if (sender.startsWith('CONTROL')) return 'control'
  if (sender === 'LANTERN') return 'lantern'
  if (sender.startsWith('SURVEYOR,')) return 'first'
  if (sender.startsWith('FOREMAN,')) return 'foreman'
  return 'survivor'
}

export function parseScript(text: string): ScriptBlock[] {
  const blocks: ScriptBlock[] = []
  let section = '', part = '', before = ''
  let cur: ScriptBlock | null = null
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    if (line.startsWith('> ')) {
      const body = line.slice(2)
      const head = /^\*\*(.+?)\*\*\s*(\*\((.+)\)\*)?$/.exec(body)
      if (!cur && head) {
        cur = { section, part, before, sender: head[1], voice: voiceOf(head[1]), faint: /faint/.test(head[3] ?? ''), lines: [] }
        blocks.push(cur)
      } else if (cur) cur.lines.push(body)
      continue
    }
    cur = null
    if (line.startsWith('### ')) { part = line.slice(4).trim(); before = '' }
    else if (line.startsWith('## ')) { section = line.slice(3).trim(); part = ''; before = '' }
    else if (line.trim()) before = line.trim()
  }
  return blocks
}
