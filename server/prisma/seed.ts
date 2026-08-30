import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { buildGeneratorReadings, buildLvAcMotorReadings } from '../src/mappers/readings'

const prisma = new PrismaClient()

const SCRIBBLE_PATHS = [
  'M8 38 C 18 12, 28 52, 40 30 S 58 8, 70 34 S 92 46, 108 22 S 130 40, 148 28',
  'M6 30 C 20 8, 26 50, 44 26 S 66 44, 82 18 S 104 12, 118 36 S 140 20, 150 32',
  'M10 34 C 24 46, 30 10, 48 32 S 70 50, 86 20 S 108 40, 126 24 S 142 38, 150 26',
]

function makeSignatureDataUrl(seedIndex: number): string {
  const path = SCRIBBLE_PATHS[seedIndex % SCRIBBLE_PATHS.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60" viewBox="0 0 160 60"><rect width="160" height="60" rx="4" fill="#f7f5ef"/><path d="${path}" fill="none" stroke="#1c2530" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const LV_AC_MOTOR_ITEMS = [
  { itemKey: 'visual-inspection', label: 'Visual inspection for physical damage, corrosion, and cleanliness' },
  { itemKey: 'foundation-bolts', label: 'Foundation bolts and mounting tightness' },
  { itemKey: 'coupling-alignment', label: 'Coupling / belt alignment and guard condition' },
  { itemKey: 'terminal-box', label: 'Terminal box condition and cable gland integrity' },
  { itemKey: 'terminal-connections', label: 'Terminal connections tightness (torque check)' },
  { itemKey: 'cooling-fan', label: 'Cooling fan and fan cover condition' },
  { itemKey: 'bearing-condition', label: 'Bearing condition, noise, and vibration check' },
  { itemKey: 'lubrication', label: 'Lubrication / grease condition and quantity' },
  { itemKey: 'earthing', label: 'Earthing connection condition and continuity' },
  { itemKey: 'space-heater-operation', label: 'Space heater operation check' },
  { itemKey: 'nameplate', label: 'Motor nameplate and data legibility' },
  { itemKey: 'housekeeping', label: 'General housekeeping around motor and baseplate' },
]

const GENERATOR_ITEMS = [
  { itemKey: 'visual-inspection', label: 'Visual inspection for physical damage, corrosion, and cleanliness' },
  { itemKey: 'carbon-brush-condition', label: 'Carbon brush condition and free movement in holders' },
  { itemKey: 'slip-ring-condition', label: 'Slip ring surface condition and wear pattern' },
  { itemKey: 'shaft-grounding-brush', label: 'Shaft grounding brush condition and contact' },
  { itemKey: 'bearing-condition', label: 'Bearing condition, noise, and vibration check' },
  { itemKey: 'terminal-box', label: 'Terminal box and cable connection condition' },
  { itemKey: 'cooling-system', label: 'Cooling system (H2 / air) condition and leak check' },
  { itemKey: 'protection-indication', label: 'Instrumentation and protection relay indication check' },
  { itemKey: 'housekeeping', label: 'General housekeeping around generator and enclosure' },
]

async function main() {
  console.log('Seeding users...')
  const technicianPasswordHash = await bcrypt.hash('technician123', 10)
  const supervisorPasswordHash = await bcrypt.hash('supervisor123', 10)

  const technician = await prisma.user.upsert({
    where: { username: 'faisal' },
    update: {},
    create: {
      username: 'faisal',
      name: 'Faisal Al-Otaibi',
      passwordHash: technicianPasswordHash,
      role: 'technician',
      department: 'Electrical Maintenance',
    },
  })

  const supervisor = await prisma.user.upsert({
    where: { username: 'omar' },
    update: {},
    create: {
      username: 'omar',
      name: 'Eng. Omar Al-Sayed',
      passwordHash: supervisorPasswordHash,
      role: 'supervisor',
      department: 'Electrical Maintenance',
    },
  })

  console.log('Seeding checklist templates...')
  const lvAcMotorTemplate = await prisma.checklistTemplate.upsert({
    where: { type: 'lv-ac-motor' },
    update: {},
    create: {
      type: 'lv-ac-motor',
      label: 'LV AC Motor PM Checklist',
      shortLabel: 'LV AC Motor',
      description: 'Low-voltage AC motor preventive maintenance inspection, winding tests, and insulation readings.',
      items: { create: LV_AC_MOTOR_ITEMS.map((item, index) => ({ ...item, sortOrder: index })) },
    },
    include: { items: true },
  })

  const generatorTemplate = await prisma.checklistTemplate.upsert({
    where: { type: 'generator' },
    update: {},
    create: {
      type: 'generator',
      label: 'Generator PM Checklist',
      shortLabel: 'Generator',
      description: 'Generator preventive maintenance inspection, brush and slip ring condition, and gas/IPB readings.',
      items: { create: GENERATOR_ITEMS.map((item, index) => ({ ...item, sortOrder: index })) },
    },
    include: { items: true },
  })

  const lvItemId = (key: string) => lvAcMotorTemplate.items.find((i) => i.itemKey === key)!.id
  const genItemId = (key: string) => generatorTemplate.items.find((i) => i.itemKey === key)!.id

  const existingRecords = await prisma.checklistRecord.count()
  if (existingRecords > 0) {
    console.log(`Skipping sample records — ${existingRecords} already exist.`)
    return
  }

  console.log('Seeding sample records...')

  function lvItems(overrides: Record<string, { status: 'done' | 'na' | 'flagged'; note?: string }> = {}) {
    return LV_AC_MOTOR_ITEMS.map((item) => ({
      templateItemId: lvItemId(item.itemKey),
      status: overrides[item.itemKey]?.status ?? ('done' as const),
      note: overrides[item.itemKey]?.note,
    }))
  }

  function genItems(overrides: Record<string, { status: 'done' | 'na' | 'flagged'; note?: string }> = {}) {
    return GENERATOR_ITEMS.map((item) => ({
      templateItemId: genItemId(item.itemKey),
      status: overrides[item.itemKey]?.status ?? ('done' as const),
      note: overrides[item.itemKey]?.note,
    }))
  }

  const motors = [
    {
      kksCode: '10MKA51AN001',
      equipmentDescription: 'Cooling Water Pump Motor A',
      date: daysAgo(2),
      preparedBy: 'Eng. Omar Al-Sayed',
      doneBy: 'Faisal Al-Otaibi',
      numberOfHelpers: 1,
      status: 'submitted' as const,
      items: lvItems(),
      readings: buildLvAcMotorReadings({
        windingResistance: [
          { phase: 'R-Y', resistanceOhm: 1.24, inductanceMh: 18.2 },
          { phase: 'Y-B', resistanceOhm: 1.26, inductanceMh: 18.0 },
          { phase: 'R-B', resistanceOhm: 1.23, inductanceMh: 18.3 },
        ],
        spaceHeaterResistanceOhm: 220,
        spaceHeaterInsulationMOhm: 450,
        phaseToEarthInsulationMOhm: 620,
        ambientTempC: 34,
        humidityPercent: 48,
      }),
      signatureIndex: 0,
      remarks: 'No abnormalities observed. Motor running within normal parameters.',
    },
    {
      kksCode: '10MKA52AN002',
      equipmentDescription: 'Condensate Extraction Pump Motor',
      date: daysAgo(5),
      preparedBy: 'Eng. Hana Al-Mutairi',
      doneBy: 'Abdullah Al-Qahtani',
      numberOfHelpers: 2,
      status: 'reviewed' as const,
      reviewedBy: 'Eng. Omar Al-Sayed',
      reviewedAt: daysAgo(4),
      items: lvItems({
        'bearing-condition': { status: 'flagged', note: 'Slight rumbling noise on DE bearing, no vibration alarm yet. Recommend re-check next PM.' },
      }),
      readings: buildLvAcMotorReadings({
        windingResistance: [
          { phase: 'R-Y', resistanceOhm: 0.98, inductanceMh: 14.6 },
          { phase: 'Y-B', resistanceOhm: 0.97, inductanceMh: 14.5 },
          { phase: 'R-B', resistanceOhm: 0.99, inductanceMh: 14.7 },
        ],
        spaceHeaterResistanceOhm: 198,
        spaceHeaterInsulationMOhm: 380,
        phaseToEarthInsulationMOhm: 540,
        ambientTempC: 33,
        humidityPercent: 51,
      }),
      signatureIndex: 1,
      remarks: 'Bearing noise slightly elevated on DE side, flagged for monitoring next cycle.',
    },
    {
      kksCode: '10MKA53AN003',
      equipmentDescription: 'Boiler Feed Pump Motor B',
      date: daysAgo(14),
      preparedBy: 'Eng. Hana Al-Mutairi',
      doneBy: 'Nasser Al-Ghamdi',
      numberOfHelpers: 2,
      status: 'submitted' as const,
      items: lvItems({
        'terminal-box': { status: 'flagged', note: 'Cable gland found loose; re-tightened on site. Recommend follow-up check in 2 weeks.' },
      }),
      readings: buildLvAcMotorReadings({
        windingResistance: [
          { phase: 'R-Y', resistanceOhm: 1.05, inductanceMh: 15.8 },
          { phase: 'Y-B', resistanceOhm: 1.06, inductanceMh: 15.9 },
          { phase: 'R-B', resistanceOhm: 1.04, inductanceMh: 15.7 },
        ],
        spaceHeaterResistanceOhm: 205,
        spaceHeaterInsulationMOhm: 400,
        phaseToEarthInsulationMOhm: 580,
        ambientTempC: 35,
        humidityPercent: 50,
      }),
      signatureIndex: 0,
      remarks: 'Terminal box gland slightly loose, tightened during inspection.',
    },
  ]

  const generators = [
    {
      kksCode: '10MKC10GM001',
      equipmentDescription: 'Unit 1 Main Generator',
      date: daysAgo(3),
      preparedBy: 'Eng. Hana Al-Mutairi',
      doneBy: 'Mohammed Al-Harbi',
      numberOfHelpers: 3,
      status: 'submitted' as const,
      items: genItems(),
      readings: buildGeneratorReadings({
        shaftGroundingBrushes: [
          { holderNumber: 1, lengthMm: 24.5 },
          { holderNumber: 2, lengthMm: 25.1 },
          { holderNumber: 3, lengthMm: 24.8 },
          { holderNumber: 4, lengthMm: 24.6 },
        ],
        brushLengths: Array.from({ length: 8 }, (_, i) => ({
          id: `seed-${i}`,
          holderNumber: Math.floor(i / 2) + 1,
          side: i % 2 === 0 ? 'DE' : 'NDE',
          lengthMm: 37 - i * 0.4,
        })),
        h2PressureBar: 3.1,
        ipbPressureBar: 0.42,
        ipbTempC: 41,
        ipbHumidityPercent: 38,
        gtRunningHours: 48211,
      }),
      signatureIndex: 2,
      remarks: 'Brush wear within limits. H2 purity normal.',
    },
    {
      kksCode: '20MKC10GM001',
      equipmentDescription: 'Unit 2 Main Generator',
      date: daysAgo(11),
      preparedBy: 'Eng. Omar Al-Sayed',
      doneBy: 'Khalid Al-Zahrani',
      numberOfHelpers: 2,
      status: 'reviewed' as const,
      reviewedBy: 'Eng. Hana Al-Mutairi',
      reviewedAt: daysAgo(10),
      items: genItems({
        'slip-ring-condition': { status: 'flagged', note: 'Light glazing on slip ring surface. Schedule polishing at next planned outage.' },
      }),
      readings: buildGeneratorReadings({
        shaftGroundingBrushes: [
          { holderNumber: 1, lengthMm: 21.2 },
          { holderNumber: 2, lengthMm: 20.9 },
          { holderNumber: 3, lengthMm: 21.4 },
          { holderNumber: 4, lengthMm: 21.0 },
        ],
        brushLengths: Array.from({ length: 8 }, (_, i) => ({
          id: `seed-${i}`,
          holderNumber: Math.floor(i / 2) + 1,
          side: i % 2 === 0 ? 'DE' : 'NDE',
          lengthMm: 35 - i * 0.4,
        })),
        h2PressureBar: 3.0,
        ipbPressureBar: 0.4,
        ipbTempC: 43,
        ipbHumidityPercent: 40,
        gtRunningHours: 51890,
      }),
      signatureIndex: 0,
      remarks: 'Slip ring surface shows light glazing, scheduled for polishing next outage.',
    },
    {
      kksCode: '20MKC20GM002',
      equipmentDescription: 'Unit 2 Excitation System Generator',
      date: daysAgo(27),
      preparedBy: 'Eng. Omar Al-Sayed',
      doneBy: 'Faisal Al-Otaibi',
      numberOfHelpers: 2,
      status: 'submitted' as const,
      items: genItems({
        'carbon-brush-condition': { status: 'flagged', note: 'Holders 3 and 4 below 15mm threshold. Replacement brushes requested.' },
        'shaft-grounding-brush': { status: 'flagged', note: 'Holder 2 grounding brush contact intermittent, recommend replacement.' },
      }),
      readings: buildGeneratorReadings({
        shaftGroundingBrushes: [
          { holderNumber: 1, lengthMm: 18.4 },
          { holderNumber: 2, lengthMm: 14.2 },
          { holderNumber: 3, lengthMm: 18.9 },
          { holderNumber: 4, lengthMm: 18.1 },
        ],
        brushLengths: Array.from({ length: 8 }, (_, i) => ({
          id: `seed-${i}`,
          holderNumber: Math.floor(i / 2) + 1,
          side: i % 2 === 0 ? 'DE' : 'NDE',
          lengthMm: 30 - i * 0.6,
        })),
        h2PressureBar: 2.9,
        ipbPressureBar: 0.39,
        ipbTempC: 44,
        ipbHumidityPercent: 42,
        gtRunningHours: 51920,
      }),
      signatureIndex: 2,
      remarks: 'Two brush holders showing accelerated wear, flagged for replacement.',
    },
  ]

  for (const m of motors) {
    await prisma.checklistRecord.create({
      data: {
        templateId: lvAcMotorTemplate.id,
        kksCode: m.kksCode,
        equipmentDescription: m.equipmentDescription,
        date: m.date,
        preparedBy: m.preparedBy,
        doneBy: m.doneBy,
        numberOfHelpers: m.numberOfHelpers,
        status: m.status,
        reviewedBy: 'reviewedBy' in m ? m.reviewedBy : undefined,
        reviewedAt: 'reviewedAt' in m && m.reviewedAt ? new Date(m.reviewedAt) : undefined,
        signatureDataUrl: makeSignatureDataUrl(m.signatureIndex),
        remarks: m.remarks,
        createdByUserId: technician.id,
        items: { create: m.items },
        readings: {
          create: m.readings.map((r) => ({ key: r.key, groupLabel: r.groupLabel, value: r.value, textValue: r.textValue, unit: r.unit, sortOrder: r.sortOrder })),
        },
        auditEvents: { create: { action: 'created', actorUserId: technician.id } },
      },
    })
  }

  for (const g of generators) {
    await prisma.checklistRecord.create({
      data: {
        templateId: generatorTemplate.id,
        kksCode: g.kksCode,
        equipmentDescription: g.equipmentDescription,
        date: g.date,
        preparedBy: g.preparedBy,
        doneBy: g.doneBy,
        numberOfHelpers: g.numberOfHelpers,
        status: g.status,
        reviewedBy: 'reviewedBy' in g ? g.reviewedBy : undefined,
        reviewedAt: 'reviewedAt' in g && g.reviewedAt ? new Date(g.reviewedAt) : undefined,
        signatureDataUrl: makeSignatureDataUrl(g.signatureIndex),
        remarks: g.remarks,
        createdByUserId: technician.id,
        items: { create: g.items },
        readings: {
          create: g.readings.map((r) => ({ key: r.key, groupLabel: r.groupLabel, value: r.value, textValue: r.textValue, unit: r.unit, sortOrder: r.sortOrder })),
        },
        auditEvents: { create: { action: 'created', actorUserId: technician.id } },
      },
    })
  }

  console.log('Seed complete.')
  console.log(`  Technician login: username=faisal password=technician123`)
  console.log(`  Supervisor login: username=omar password=supervisor123`)
  void supervisor
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
