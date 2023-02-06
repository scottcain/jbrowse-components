import { Feature } from '@jbrowse/core/util'

const coreFields = [
  'uniqueId',
  'refName',
  'source',
  'type',
  'start',
  'end',
  'strand',
  'parent',
  'parentId',
  'score',
  'subfeatures',
  'phase',
]

const retitle = {
  id: 'ID',
  name: 'Name',
  alias: 'Alias',
  parent: 'Parent',
  target: 'Target',
  gap: 'Gap',
  derives_from: 'Derives_from',
  note: 'Note',
  description: 'Note',
  dbxref: 'Dbxref',
  ontology_term: 'Ontology_term',
  is_circular: 'Is_circular',
} as { [key: string]: string }

function fmt(obj: unknown): string {
  if (Array.isArray(obj)) {
    return obj.map(o => fmt(o)).join(',')
  } else if (typeof obj === 'object') {
    return JSON.stringify(obj)
  } else {
    return `${obj}`
  }
}

function formatFeat(f: Feature, parentId?: string) {
  return [
    f.get('refName'),
    f.get('source') || '.',
    f.get('type') || '.',
    f.get('start') + 1,
    f.get('end'),
    f.get('score') || '.',
    f.get('strand') || '.',
    f.get('phase') || '.',
    (parentId ? `Parent=${parentId};` : '') +
      f
        .tags()
        .filter(tag => !coreFields.includes(tag))
        .map(tag => [tag, fmt(f.get(tag))])
        .filter(tag => !!tag[1])
        .map(tag => `${retitle[tag[0]] || tag[0]}=${tag[1]}`)
        .join(';'),
  ].join('\t')
}
export function formatMultiLevelFeat(f: Feature, parentId?: string): string {
  const primary = formatFeat(f, parentId)
  const fId = f.get('id')
  const subs =
    f.get('subfeatures')?.map(sub => formatMultiLevelFeat(sub, fId)) || []
  return [primary, ...subs].join('\n')
}

export function stringifyGFF3(feats: Feature[]) {
  return ['##gff-version 3', ...feats.map(f => formatMultiLevelFeat(f))].join(
    '\n',
  )
}
// LOCUS       Exported                1699 bp DNA     linear   UNA 04-FEB-2023
// FEATURES             Location/Qualifiers
//     source          1..1699
//     CDS             join(428..659,794..1099)
//     CDS             complement(join(1278..1411,1515..1650))
// ORIGIN
//       1 ttaatttgaaatagtttccattttttgataataatgaaaagctgctgaaaaaatggtttggcagttagcaattccaggaattttttcgagataagccataaattttaaaattatggaaattgatttacgtgtgtttttttctaattctaaattttttggtgacgttttccacgttgatttatttatttttcgaacccccctttccctcaaccaaaatagtatttattcttcagtttcaatattgtcaaaaagctcgatgcccgagtattttgaatcttctgcgatttcaattagaagaaatgctgcaggaaacgacgttcaaaaggtaattgaaagcatttagaacatctcataaagatgatgtttcagaacaaagttcaaaattggcttcacagtgtgatcgagcgtctcaagtggtggagtcccggacgatgtcagcagctcttcgtcgagaatgagctcatcgagctatgctacagagctcgtgagcagttctggaaaaacaaagtgaagctagatgtacgtttagcgtatgagggattagcaattcattttctaataatttcagatcgaagctcctgtcaaaatctgtggagacattcacggacagttcgaggacttgatggctctgttcgagttgaatgggtggcctgaagagcataagtaagccgccaatttgaatttggattagtatatgttttcatttcagatatctctttcttggtgattatgttgaccgtggtccattctccattgaagtcatcacactcctcttcacctttcaaatattgatgcctgacaaagtcttccttcttcgaggaaaccacgaaagccgccccgtcaatatgcaatatggattttatctggaatgcaagaagcgctactcagtcgccttgtatgatgcatttcaacttgcattcaattgtatgccactgtgcgctgtcgtgagcaagaagatcatatgtatgcatggaggaatatctgaagatctgattgacttgacgtaagatctttttccaatttccttatgtacttcaacaaccaatttccagacaactcgaaaagattgatcgtccatttgatattccggacattggcgtcatctccgacttgacctgggctgatcccgacgagaaggtcttcggatatgccgattctccacgtggcgcgggacgttctttcggtccgaatgcggtcaagaagttccttcaaatgcacaacctggatctagtcgttcgtgcccatcaggtcgtcatggatggttatgaattctttgcggaccgccaacttgtcacagtcttctcggcaccatcatactgcggacaattcgacaatgctgctgccgtgatgaatgttgacgacaaattgctctgtactttcacaatcttccgcccggatttgaaagttggcgacttcaagaagaaggacaagtgatattttgatttatcgaaataaagcattttttgtaccgtcttgattttcaggttaggctcgaatcacgcgcgcctgcttctcgaccttaaaaatgcctccaggtacaccaggaggcgagcccgctaagcaagaattccagcgccttctcccttctctcccgcttcctgagaatattgatgacataatcggtattctttttgtgtgtgcctgtatccattattcacgcacacaagaacaccaacaagcatgctggttttcttatata
/// /
export function stringifyGenbank(
  feats: Feature[],
  { name = 'Exported', length = 100 }: { name?: string; length?: number },
) {
  const today = new Date()
  const month = today.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const day = today.toLocaleString('en-US', { day: 'numeric' })
  const year = today.toLocaleString('en-US', { year: 'numeric' })
  const date = `${day}-${month}-${year}`
  const l1 = `LOCUS       ${name}     ${length} bp DNA      linear    UNA  ${date}`
  const l2 = 'FEATURES             Location/Qualifiers'
  const l3 = `     source          1..${length}`
  return [l1, l2, l3].join('\n')
}
