import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'
import type { ChecklistRecord, GeneratorChecklist, LvAcMotorChecklist, NumericOrNA } from '../types/checklist'

const INK = '#111827'
const MUTED = '#6b7280'
const FAINT = '#9ca3af'
const LINE = '#e2dcf0'
const ACCENT = '#6D28D9'
const ACCENT_SOFT = '#f3effc'
const DONE = '#15803d'
const DONE_SOFT = '#eafaf1'
const FLAGGED = '#b45309'
const FLAGGED_SOFT = '#fdf3e3'

const PAGE_MARGIN = 40
const LOGO_PATH = [path.join(__dirname, '../../assets/logo.png'), path.join(__dirname, '../../assets/logo.jpg')].find((p) =>
  fs.existsSync(p),
)

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// A measurement is a number, "N/A", or unset — never append a unit to "N/A".
function formatMeasurement(value: NumericOrNA | undefined, unit: string): string {
  if (value === undefined) return '—'
  if (value === 'N/A') return 'N/A'
  return `${value} ${unit}`
}

function decodeImageBuffer(dataUrl: string): { buffer: Buffer; kind: 'png' | 'jpeg' } | null {
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/)
  if (!match) return null
  const kind = match[1] === 'png' ? 'png' : 'jpeg'
  return { buffer: Buffer.from(match[2], 'base64'), kind }
}

function contentWidth(doc: PDFKit.PDFDocument): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  const bottom = doc.page.height - doc.page.margins.bottom
  if (doc.y + height > bottom) {
    doc.addPage()
  }
}

function drawHeader(doc: PDFKit.PDFDocument, record: ChecklistRecord, templateLabel: string) {
  const top = doc.y
  const logoSize = 34

  if (LOGO_PATH) {
    doc.image(LOGO_PATH, PAGE_MARGIN, top, { width: logoSize, height: logoSize, fit: [logoSize, logoSize] })
  }

  const textX = LOGO_PATH ? PAGE_MARGIN + logoSize + 10 : PAGE_MARGIN
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(INK).text('ALDUR-2 POWER & WATER SERVICES', textX, top + 2)
  doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Electrical Maintenance Department · NOMAC', textX, top + 15)

  // Status badge, right-aligned
  const badge = STATUS_BADGE[record.status] ?? STATUS_BADGE.submitted
  const badgeLabel = badge.label.toUpperCase()
  doc.font('Helvetica-Bold').fontSize(8.5)
  const badgeTextWidth = doc.widthOfString(badgeLabel)
  const badgeWidth = badgeTextWidth + 18
  const badgeX = doc.page.width - doc.page.margins.right - badgeWidth
  doc.roundedRect(badgeX, top, badgeWidth, 20, 10).fill(badge.soft)
  doc.fillColor(badge.color).text(badgeLabel, badgeX, top + 6, { width: badgeWidth, align: 'center' })

  doc.y = top + Math.max(logoSize, 24) + 12
  doc.x = PAGE_MARGIN

  doc.font('Helvetica-Bold').fontSize(18).fillColor(INK).text(record.equipmentDescription || 'Untitled equipment')
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(MUTED)
    .text(`${templateLabel}  ·  KKS ${record.kksCode || '—'}`)

  doc.moveDown(0.6)
  doc.moveTo(PAGE_MARGIN, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).lineWidth(1.5).strokeColor(ACCENT).stroke()
  doc.moveDown(0.9)
}

const STATUS_BADGE: Record<string, { label: string; color: string; soft: string }> = {
  submitted: { label: 'Awaiting review', color: ACCENT, soft: ACCENT_SOFT },
  reviewed: { label: 'Reviewed', color: DONE, soft: DONE_SOFT },
}

function drawSectionHeading(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 40)
  doc.moveDown(0.4)
  const y = doc.y
  doc.rect(PAGE_MARGIN, y + 2, 3, 11).fill(ACCENT)
  doc
    .font('Helvetica-Bold')
    .fontSize(10.5)
    .fillColor(INK)
    .text(title.toUpperCase(), PAGE_MARGIN + 9, y, { characterSpacing: 0.4 })
  doc.moveDown(0.5)
}

function drawKeyValueGrid(doc: PDFKit.PDFDocument, pairs: [string, string][], cols: number) {
  const width = contentWidth(doc)
  const colWidth = width / cols
  const rowHeight = 34
  const rows = Math.ceil(pairs.length / cols)
  ensureSpace(doc, rowHeight * rows + 4)

  const startX = PAGE_MARGIN
  const startY = doc.y

  doc.rect(startX, startY, width, rowHeight * rows).strokeColor(LINE).lineWidth(1).stroke()
  for (let c = 1; c < cols; c++) {
    doc.moveTo(startX + c * colWidth, startY).lineTo(startX + c * colWidth, startY + rowHeight * rows).strokeColor(LINE).stroke()
  }
  for (let r = 1; r < rows; r++) {
    doc.moveTo(startX, startY + r * rowHeight).lineTo(startX + width, startY + r * rowHeight).strokeColor(LINE).stroke()
  }

  pairs.forEach(([label, value], index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const cellX = startX + col * colWidth + 10
    const cellY = startY + row * rowHeight + 7
    doc.font('Helvetica').fontSize(7.5).fillColor(FAINT).text(label.toUpperCase(), cellX, cellY, { width: colWidth - 20, characterSpacing: 0.3 })
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(INK)
      .text(value || '—', cellX, cellY + 11, { width: colWidth - 20 })
  })

  doc.y = startY + rowHeight * rows + 12
  doc.x = PAGE_MARGIN
}

interface TableColumn {
  header: string
  width: number
  align?: 'left' | 'center' | 'right'
}

function drawTable(doc: PDFKit.PDFDocument, columns: TableColumn[], rows: string[][], rowColors?: (string | undefined)[]) {
  const width = contentWidth(doc)
  const startX = PAGE_MARGIN
  const cellPad = 6
  const headerHeight = 20

  function drawHeaderRow() {
    const y = doc.y
    doc.rect(startX, y, width, headerHeight).fill(ACCENT_SOFT)
    let x = startX
    doc.font('Helvetica-Bold').fontSize(8)
    columns.forEach((col) => {
      doc.fillColor(ACCENT).text(col.header.toUpperCase(), x + cellPad, y + 6, { width: col.width - cellPad * 2, align: col.align ?? 'left' })
      x += col.width
    })
    doc.y = y + headerHeight
    doc.x = startX
  }

  ensureSpace(doc, headerHeight + 24)
  drawHeaderRow()

  rows.forEach((row, rowIndex) => {
    doc.font('Helvetica').fontSize(8.5)
    const heights = row.map((cell, i) => doc.heightOfString(cell, { width: columns[i].width - cellPad * 2 }))
    const rowHeight = Math.max(18, ...heights) + cellPad * 2 - 4

    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage()
      drawHeaderRow()
    }

    const y = doc.y
    const bg = rowColors?.[rowIndex]
    doc.rect(startX, y, width, rowHeight).fill(bg ?? (rowIndex % 2 === 0 ? '#ffffff' : '#faf9fc'))
    doc.rect(startX, y, width, rowHeight).strokeColor(LINE).lineWidth(0.75).stroke()

    let x = startX
    row.forEach((cell, i) => {
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(INK)
        .text(cell, x + cellPad, y + cellPad - 2, { width: columns[i].width - cellPad * 2, align: columns[i].align ?? 'left' })
      x += columns[i].width
    })

    doc.y = y + rowHeight
    doc.x = startX
  })

  // outer border
  doc.moveDown(0.5)
}

function addFootersAndPageNumbers(doc: PDFKit.PDFDocument, record: ChecklistRecord) {
  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)

    // Drawing this close to the bottom edge can otherwise trigger PDFKit's
    // auto-pagination and silently append blank pages — suppress it while
    // we draw the footer, then restore so later pages paginate normally.
    const originalBottomMargin = doc.page.margins.bottom
    doc.page.margins.bottom = 0

    const bottom = doc.page.height - originalBottomMargin + 14
    doc.moveTo(PAGE_MARGIN, bottom - 6).lineTo(doc.page.width - doc.page.margins.right, bottom - 6).strokeColor(LINE).lineWidth(0.75).stroke()
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(FAINT)
      .text(`PM Logbook · ${record.kksCode || 'Checklist'} · Generated ${new Date().toLocaleString('en-GB')}`, PAGE_MARGIN, bottom, {
        width: contentWidth(doc) - 60,
        lineBreak: false,
      })
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(FAINT)
      .text(`Page ${i - range.start + 1} of ${range.count}`, doc.page.width - doc.page.margins.right - 60, bottom, {
        width: 60,
        align: 'right',
        lineBreak: false,
      })

    doc.page.margins.bottom = originalBottomMargin
  }
}

export function generateRecordPdf(record: ChecklistRecord, templateLabel: string): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true })

  drawHeader(doc, record, templateLabel)

  const flaggedItems = record.items.filter((i) => i.status === 'flagged')
  if (flaggedItems.length > 0) {
    drawSectionHeading(doc, `${flaggedItems.length} Item${flaggedItems.length === 1 ? '' : 's'} Flagged`)
    const width = contentWidth(doc)
    flaggedItems.forEach((item) => {
      const text = item.note ? `${item.label}\n${item.note}` : item.label
      const h = doc.heightOfString(text, { width: width - 24 }) + 14
      ensureSpace(doc, h)
      const y = doc.y
      doc.roundedRect(PAGE_MARGIN, y, width, h, 4).fill(FLAGGED_SOFT)
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(FLAGGED).text(item.label, PAGE_MARGIN + 12, y + 7, { width: width - 24 })
      if (item.note) {
        doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(item.note, PAGE_MARGIN + 12, doc.y + 1, { width: width - 24 })
      }
      doc.y = y + h + 6
      doc.x = PAGE_MARGIN
    })
  }

  drawSectionHeading(doc, 'Sign-off Information')
  drawKeyValueGrid(
    doc,
    [
      ['Prepared By', record.preparedBy],
      ['Done By', record.doneBy],
      ['Helpers', String(record.numberOfHelpers)],
      ['Date', formatDate(record.date)],
      ['Reviewed By', record.reviewedBy ?? 'Pending review'],
      ['Reviewed At', record.reviewedAt ? formatDateTime(record.reviewedAt) : '—'],
    ],
    3,
  )

  drawSectionHeading(doc, 'Checklist Items')
  const itemColumns: TableColumn[] = [
    { header: '#', width: 24, align: 'center' },
    { header: 'Item', width: contentWidth(doc) - 24 - 80 - 100 },
    { header: 'Status', width: 80, align: 'center' },
    { header: 'Note', width: 100 },
  ]
  drawTable(
    doc,
    itemColumns,
    record.items.map((item, index) => [String(index + 1), item.label, item.status.toUpperCase(), item.note ?? '—']),
  )

  if (record.type === 'lv-ac-motor') {
    const lv = record as LvAcMotorChecklist
    drawSectionHeading(doc, 'Measurements')
    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text('Winding Resistance & Inductance')
    doc.moveDown(0.3)
    drawTable(
      doc,
      [
        { header: 'Phase', width: contentWidth(doc) / 3 },
        { header: 'Resistance (ohm)', width: contentWidth(doc) / 3 },
        { header: 'Inductance (mH)', width: contentWidth(doc) / 3 },
      ],
      lv.windingResistance.map((row) => [row.phase, String(row.resistanceOhm ?? '—'), String(row.inductanceMh ?? '—')]),
    )
    drawKeyValueGrid(
      doc,
      [
        ['Space Heater Resistance', formatMeasurement(lv.spaceHeaterResistanceOhm, 'ohm')],
        ['Space Heater Insulation', formatMeasurement(lv.spaceHeaterInsulationMOhm, 'Mohm')],
        ['Phase-Earth Insulation', formatMeasurement(lv.phaseToEarthInsulationMOhm, 'Mohm')],
        ['Ambient Temperature', formatMeasurement(lv.ambientTempC, '°C')],
        ['Humidity', formatMeasurement(lv.humidityPercent, '%')],
      ],
      3,
    )
  } else if (record.type === 'generator') {
    const gen = record as GeneratorChecklist
    drawSectionHeading(doc, 'Measurements')
    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text('Shaft Grounding Brush Lengths')
    doc.moveDown(0.3)
    drawKeyValueGrid(
      doc,
      gen.shaftGroundingBrushes.map((b) => [`Holder ${b.holderNumber}`, formatMeasurement(b.lengthMm, 'mm')]),
      4,
    )
    if (gen.brushLengths.length > 0) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text('Carbon Brush Length Table')
      doc.moveDown(0.3)
      drawTable(
        doc,
        [
          { header: 'Holder #', width: contentWidth(doc) / 3 },
          { header: 'Side', width: contentWidth(doc) / 3 },
          { header: 'Length (mm)', width: contentWidth(doc) / 3 },
        ],
        gen.brushLengths.map((row) => [String(row.holderNumber), row.side, String(row.lengthMm ?? '—')]),
      )
    }
    drawKeyValueGrid(
      doc,
      [
        ['H2 Pressure', formatMeasurement(gen.h2PressureBar, 'bar')],
        ['IPB Pressure', formatMeasurement(gen.ipbPressureBar, 'bar')],
        ['IPB Temperature', formatMeasurement(gen.ipbTempC, '°C')],
        ['IPB Humidity', formatMeasurement(gen.ipbHumidityPercent, '%')],
        ['GT Running Hours', formatMeasurement(gen.gtRunningHours, 'hrs')],
      ],
      3,
    )
  }

  if (record.remarks) {
    drawSectionHeading(doc, 'Remarks')
    const width = contentWidth(doc)
    const h = doc.heightOfString(record.remarks, { width: width - 24 }) + 16
    ensureSpace(doc, h)
    const y = doc.y
    doc.roundedRect(PAGE_MARGIN, y, width, h, 4).fillAndStroke('#faf9fc', LINE)
    doc.font('Helvetica').fontSize(9.5).fillColor(INK).text(record.remarks, PAGE_MARGIN + 12, y + 8, { width: width - 24 })
    doc.y = y + h + 6
    doc.x = PAGE_MARGIN
  }

  drawSectionHeading(doc, 'Technician Signature')
  ensureSpace(doc, 74)
  const sigBoxY = doc.y
  doc.roundedRect(PAGE_MARGIN, sigBoxY, 200, 70, 4).fillAndStroke('#f7f5ef', LINE)
  const decoded = decodeImageBuffer(record.signatureDataUrl)
  if (decoded) {
    doc.image(decoded.buffer, PAGE_MARGIN + 10, sigBoxY + 8, { width: 180, height: 54, fit: [180, 54] })
  } else {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('Signature on file (not renderable in PDF export).', PAGE_MARGIN + 10, sigBoxY + 28, {
      width: 180,
    })
  }
  doc.y = sigBoxY + 78
  doc.font('Helvetica').fontSize(8).fillColor(FAINT).text(`Signed by ${record.doneBy || 'technician'}`, PAGE_MARGIN, doc.y)

  addFootersAndPageNumbers(doc, record)

  doc.end()
  return doc
}
