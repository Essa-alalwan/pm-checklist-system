import PDFDocument from 'pdfkit'
import type { ChecklistRecord } from '../types/checklist'

const INK = '#111827'
const MUTED = '#4b5563'
const FLAGGED = '#b45309'
const RULE = '#d1d5db'

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function sectionTitle(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(0.75)
  doc.fillColor(INK).fontSize(12).font('Helvetica-Bold').text(text.toUpperCase())
  doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - doc.page.margins.right, doc.y + 2).strokeColor(RULE).stroke()
  doc.moveDown(0.5)
}

function keyValueRow(doc: PDFKit.PDFDocument, pairs: [string, string][]) {
  const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / pairs.length
  const startX = doc.x
  const startY = doc.y
  pairs.forEach(([label, value], index) => {
    doc.fontSize(8).font('Helvetica').fillColor(MUTED).text(label.toUpperCase(), startX + index * colWidth, startY, { width: colWidth - 10 })
    doc.fontSize(10).font('Helvetica-Bold').fillColor(INK).text(value || '—', startX + index * colWidth, startY + 12, { width: colWidth - 10 })
  })
  doc.y = startY + 34
  doc.x = startX
}

function decodeImageBuffer(dataUrl: string): { buffer: Buffer; kind: 'png' | 'jpeg' } | null {
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/)
  if (!match) return null
  const kind = match[1] === 'png' ? 'png' : 'jpeg'
  return { buffer: Buffer.from(match[2], 'base64'), kind }
}

export function generateRecordPdf(record: ChecklistRecord, templateLabel: string): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: 42 })

  doc.fontSize(9).fillColor(MUTED).text('ALDUR-2 POWER & WATER SERVICES — ELECTRICAL MAINTENANCE (NOMAC)')
  doc.moveDown(0.2)
  doc.fontSize(16).font('Helvetica-Bold').fillColor(INK).text(record.equipmentDescription || 'Untitled equipment')
  doc.fontSize(10).font('Helvetica').fillColor(MUTED).text(`${templateLabel} · KKS ${record.kksCode || '—'} · Status: ${record.status.toUpperCase()}`)

  const flaggedItems = record.items.filter((i) => i.status === 'flagged')
  if (flaggedItems.length > 0) {
    sectionTitle(doc, `${flaggedItems.length} Item${flaggedItems.length === 1 ? '' : 's'} Flagged`)
    flaggedItems.forEach((item) => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor(FLAGGED).text(`• ${item.label}`)
      if (item.note) doc.fontSize(9).font('Helvetica').fillColor(MUTED).text(item.note, { indent: 12 })
    })
  }

  sectionTitle(doc, 'Sign-off Information')
  keyValueRow(doc, [
    ['Prepared By', record.preparedBy],
    ['Done By', record.doneBy],
    ['Helpers', String(record.numberOfHelpers)],
  ])
  keyValueRow(doc, [
    ['Date', formatDate(record.date)],
    ['Reviewed By', record.reviewedBy ?? 'Pending review'],
    ['Reviewed At', record.reviewedAt ? formatDateTime(record.reviewedAt) : '—'],
  ])

  sectionTitle(doc, 'Checklist Items')
  record.items.forEach((item, index) => {
    const color = item.status === 'flagged' ? FLAGGED : INK
    doc.fontSize(9.5).font('Helvetica').fillColor(color).text(`${index + 1}. ${item.label} — ${item.status.toUpperCase()}`)
    if (item.note) doc.fontSize(8.5).fillColor(MUTED).text(item.note, { indent: 14 })
  })

  sectionTitle(doc, 'Measurements')
  if (record.type === 'lv-ac-motor') {
    doc.fontSize(9).font('Helvetica-Bold').fillColor(INK).text('Winding Resistance & Inductance')
    record.windingResistance.forEach((row) => {
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(INK)
        .text(`${row.phase}: ${row.resistanceOhm ?? '—'} Ω, ${row.inductanceMh ?? '—'} mH`)
    })
    doc.moveDown(0.3)
    doc
      .fontSize(9)
      .text(`Space Heater Resistance: ${record.spaceHeaterResistanceOhm ?? '—'} Ω`)
      .text(`Space Heater Insulation: ${record.spaceHeaterInsulationMOhm ?? '—'} MΩ`)
      .text(`Phase-to-Earth Insulation: ${record.phaseToEarthInsulationMOhm ?? '—'} MΩ`)
      .text(`Ambient Temperature: ${record.ambientTempC ?? '—'} °C`)
      .text(`Humidity: ${record.humidityPercent ?? '—'} %`)
  } else {
    doc.fontSize(9).font('Helvetica-Bold').fillColor(INK).text('Shaft Grounding Brush Lengths')
    doc
      .font('Helvetica')
      .fontSize(9)
      .text(record.shaftGroundingBrushes.map((b) => `Holder ${b.holderNumber}: ${b.lengthMm ?? '—'} mm`).join('   '))
    doc.moveDown(0.3)
    doc.font('Helvetica-Bold').text('Carbon Brush Length Table')
    doc.font('Helvetica')
    record.brushLengths.forEach((row) => {
      doc.text(`Holder ${row.holderNumber} ${row.side}: ${row.lengthMm ?? '—'} mm`)
    })
    doc.moveDown(0.3)
    doc
      .fontSize(9)
      .text(`H2 Pressure: ${record.h2PressureBar ?? '—'} bar`)
      .text(`IPB Pressure: ${record.ipbPressureBar ?? '—'} bar`)
      .text(`IPB Temperature: ${record.ipbTempC ?? '—'} °C`)
      .text(`IPB Humidity: ${record.ipbHumidityPercent ?? '—'} %`)
      .text(`GT Running Hours: ${record.gtRunningHours ?? '—'}`)
  }

  if (record.remarks) {
    sectionTitle(doc, 'Remarks')
    doc.fontSize(9.5).font('Helvetica').fillColor(INK).text(record.remarks)
  }

  sectionTitle(doc, 'Technician Signature')
  const decoded = decodeImageBuffer(record.signatureDataUrl)
  if (decoded) {
    doc.image(decoded.buffer, { width: 160, height: 60 })
  } else {
    doc.fontSize(9).fillColor(MUTED).text('Signature on file (not renderable in PDF export).')
  }

  doc.end()
  return doc
}
