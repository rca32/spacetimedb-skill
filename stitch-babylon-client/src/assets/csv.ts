export function parseCsv(text: string): Record<string, string>[] {
  const sanitized = text.replace(/^\uFEFF/, '')
  const lines = sanitized.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) {
    return []
  }

  const headers = splitCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line)
    const row: Record<string, string> = {}
    for (let index = 0; index < headers.length; index += 1) {
      row[headers[index] ?? `col_${index}`] = values[index] ?? ''
    }
    return row
  })
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"') {
      if (quoted && next === '"') {
        current += '"'
        index += 1
        continue
      }
      quoted = !quoted
      continue
    }

    if (char === ',' && !quoted) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}
