// Synthetic .docx buffers built in-memory via the `docx` package, covering
// the real-world patterns the parser needs to handle correctly. Nothing
// here is a real company document — these are small hand-built shapes
// standing in for the patterns actually seen across this project's source
// files, so nothing binary ever needs to be committed to the repo.
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx'

const NUMBERING_REFERENCE = 'items'

function numberedParagraph(text: string): Paragraph {
  return new Paragraph({ text, numbering: { reference: NUMBERING_REFERENCE, level: 0 } })
}

function cell(text: string, opts?: { rowSpan?: number; columnSpan?: number }): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun(text)] })],
    rowSpan: opts?.rowSpan,
    columnSpan: opts?.columnSpan,
  })
}

function row(cells: TableCell[]): TableRow {
  return new TableRow({ children: cells })
}

function buildDoc(children: (Paragraph | Table)[]): Document {
  return new Document({
    numbering: {
      config: [
        {
          reference: NUMBERING_REFERENCE,
          levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: 'start' }],
        },
      ],
    },
    sections: [{ children }],
  })
}

async function toBuffer(doc: Document): Promise<Buffer> {
  return Packer.toBuffer(doc)
}

// A plain Word numbered-list checklist — the primary case the parser has
// always handled, kept as a baseline regression check.
export async function buildNumberedListDocx(): Promise<Buffer> {
  return toBuffer(
    buildDoc([
      new Paragraph({ text: 'PM Check List for Sample Equipment' }),
      numberedParagraph('Clean the equipment enclosure'),
      numberedParagraph('Check terminal tightness and tighten if required'),
      numberedParagraph('Measure and record insulation resistance'),
    ]),
  )
}

// Items living inside a table row (description cell + a checkbox-style
// placeholder cell) — the case the original parser dropped entirely.
export async function buildItemsInTableDocx(): Promise<Buffer> {
  return toBuffer(
    buildDoc([
      new Paragraph({ text: 'Check List for MV Switchgear' }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          row([cell('Sl.No'), cell('Description of Checks'), cell('Remarks')]),
          row([cell('1'), cell('MV breaker in rack out position'), cell('(   )')]),
          row([cell('2'), cell('Is primary earthing switch applied'), cell('(   )')]),
          row([cell('3'), cell('Is shutter & earthing locked'), cell('(   )')]),
        ],
      }),
    ]),
  )
}

// A small fixed measurement grid — named equipment rows (KKS), each with its
// own distinct identity, blank reading columns — with a deliberate rowspan
// on a *grouping* column (not the row-identity column, which is how
// merges actually showed up across this project's real source documents:
// e.g. a "1st Set"/"2nd Set" label spanning two holder rows), to exercise
// the matrix-merge logic through a real docx round trip, not just cheerio.
export async function buildMeasurementGridDocx(): Promise<Buffer> {
  return toBuffer(
    buildDoc([
      new Paragraph({ text: 'Quarterly Check List of Oil-Filled Transformers' }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          row([cell('KKS'), cell('Cooling Group'), cell('OTI (°C)'), cell('WTI - HV (°C)')]),
          row([cell('11BAT01'), cell('Group A', { rowSpan: 2 }), cell(''), cell('')]),
          row([cell('11BBT01'), cell(''), cell('')]),
          row([cell('12BAT01'), cell('Group B'), cell(''), cell('')]),
        ],
      }),
    ]),
  )
}

// A header-only open-ended register — no rows pre-listed at all, matching
// the "blank template" registers (Online PD, Earthing & Grounding, etc).
export async function buildLogTableDocx(): Promise<Buffer> {
  return toBuffer(
    buildDoc([
      new Paragraph({ text: 'Check List for Online PD of MV, HV Power Cables' }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [row([cell('S.NO'), cell('KKS'), cell('Peak Cable PD (pC)'), cell('Observation')])],
      }),
    ]),
  )
}

// A fully-populated reference/legend table — nothing blank to fill in, so
// it should be skipped rather than modeled as a fillable field.
export async function buildReferenceTableDocx(): Promise<Buffer> {
  return toBuffer(
    buildDoc([
      new Paragraph({ text: 'Check List for Online PD of MV, HV Power Cables' }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          row([cell('Severity'), cell('Peak PD (pC)'), cell('Action')]),
          row([cell('Normal'), cell('< 100'), cell('No action required')]),
          row([cell('Warning'), cell('100 - 500'), cell('Monitor closely')]),
          row([cell('Critical'), cell('> 500'), cell('Immediate investigation')]),
        ],
      }),
    ]),
  )
}
