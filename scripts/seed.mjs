/**
 * Seed de volume para validação de fluxos (Firestore).
 * Uso: npm run seed
 *
 * Volumes aproximados:
 * - 100 clientes, 20 vendedores
 * - 300 vendas + NF-e mock (fiscalDocuments)
 * - 150 despesas
 * - 100 contas a pagar, 100 a receber
 * - 150 movimentos de caixa
 * - 60 itens de estoque
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  writeBatch,
  Timestamp,
} from 'firebase/firestore'

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) {
    throw new Error('.env não encontrado. Copie .env.example e preencha.')
  }
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile()

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const EMAIL = process.env.SEED_EMAIL || 'admin@jose.com'
const PASSWORD = process.env.SEED_PASSWORD || 'borderless'
const CLEAR = process.argv.includes('--clear')

const COUNTS = {
  clients: 100,
  sellers: 20,
  sales: 300,
  expenses: 150,
  payable: 100,
  receivable: 100,
  cash: 150,
  inventory: 60,
}

const CATEGORIES = [
  'operacional',
  'administrativa',
  'comercial',
  'financeira',
  'outra',
]
const STATUSES = ['pendente', 'pago', 'cancelado']
const UNITS = ['un', 'cx', 'kg', 'lt']
const PAYMENTS = ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia']

function pad(n, size = 3) {
  return String(n).padStart(size, '0')
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2))
}

function daysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function addDays(base, days) {
  const d = new Date(`${base}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function cpfFake(i) {
  return String(10000000000 + i).slice(0, 11)
}

async function clearCollection(db, name) {
  const snap = await getDocs(query(collection(db, name)))
  let batch = writeBatch(db)
  let ops = 0
  let total = 0
  for (const item of snap.docs) {
    batch.delete(item.ref)
    ops += 1
    total += 1
    if (ops >= 450) {
      await batch.commit()
      batch = writeBatch(db)
      ops = 0
    }
  }
  if (ops > 0) await batch.commit()
  console.log(`  cleared ${name}: ${total}`)
}

async function commitInChunks(db, builders) {
  let batch = writeBatch(db)
  let ops = 0
  let committed = 0
  for (const build of builders) {
    build(batch)
    ops += 1
    if (ops >= 450) {
      await batch.commit()
      committed += ops
      batch = writeBatch(db)
      ops = 0
      process.stdout.write(`\r  committed ${committed} ops...`)
    }
  }
  if (ops > 0) {
    await batch.commit()
    committed += ops
  }
  console.log(`\r  committed ${committed} ops.`)
}

async function main() {
  console.log('=== Seed José Gestão ===')
  console.log(`Auth: ${EMAIL}`)
  console.log(`Clear first: ${CLEAR}`)

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  await signInWithEmailAndPassword(auth, EMAIL, PASSWORD)
  console.log('Authenticated.')

  if (CLEAR) {
    console.log('Clearing collections...')
    for (const name of [
      'fiscalDocuments',
      'sales',
      'expenses',
      'accountsPayable',
      'accountsReceivable',
      'cashMovements',
      'inventoryItems',
      'clients',
      'sellers',
    ]) {
      await clearCollection(db, name)
    }
  }

  const now = Timestamp.now()
  const clientIds = []
  const sellerIds = []
  const saleIds = []
  const inventoryIds = []
  const inventoryNames = []

  console.log('Seeding clients...')
  await commitInChunks(
    db,
    Array.from({ length: COUNTS.clients }, (_, i) => (batch) => {
      const ref = doc(collection(db, 'clients'))
      clientIds.push(ref.id)
      batch.set(ref, {
        name: `SEED Cliente ${pad(i + 1)}`,
        email: `cliente${pad(i + 1)}@seed.jose.com`,
        phone: `1199${pad(i, 7)}`,
        address: `Rua Seed ${pad(i + 1)}, ${100 + i} — Centro`,
        document: cpfFake(i + 1),
        notes: i % 5 === 0 ? 'Cliente prioritário seed' : '',
        createdAt: now,
        updatedAt: now,
      })
    }),
  )

  console.log('Seeding sellers...')
  const sellerNames = []
  await commitInChunks(
    db,
    Array.from({ length: COUNTS.sellers }, (_, i) => (batch) => {
      const ref = doc(collection(db, 'sellers'))
      sellerIds.push(ref.id)
      const name = `SEED Vendedor ${pad(i + 1, 2)}`
      sellerNames.push(name)
      batch.set(ref, {
        name,
        email: `vendedor${pad(i + 1, 2)}@seed.jose.com`,
        phone: `1188${pad(i, 7)}`,
        active: i % 17 !== 0,
        createdAt: now,
        updatedAt: now,
      })
    }),
  )

  const activeSellers = sellerIds
    .map((id, i) => ({ id, name: sellerNames[i], active: i % 17 !== 0 }))
    .filter((s) => s.active)

  console.log('Seeding inventory...')
  await commitInChunks(
    db,
    Array.from({ length: COUNTS.inventory }, (_, i) => (batch) => {
      const ref = doc(collection(db, 'inventoryItems'))
      inventoryIds.push(ref.id)
      const name = `SEED Item ${pad(i + 1)}`
      inventoryNames.push(name)
      batch.set(ref, {
        name,
        sku: `SKU-SEED-${pad(i + 1)}`,
        quantity: randomInt(50, 500),
        unit: UNITS[i % UNITS.length],
        notes: i % 4 === 0 ? 'Estoque crítico monitorado' : '',
        createdAt: now,
        updatedAt: now,
      })
    }),
  )

  console.log('Seeding sales + fiscalDocuments (NF-e mock)...')
  const saleBuilders = []
  const fiscalBuilders = []
  const saleMeta = []
  for (let i = 0; i < COUNTS.sales; i += 1) {
    const saleRef = doc(collection(db, 'sales'))
    const fiscalRef = doc(collection(db, 'fiscalDocuments'))
    saleIds.push(saleRef.id)
    const clientIndex = i % clientIds.length
    const clientId = clientIds[clientIndex]
    const seller = activeSellers[i % activeSellers.length]
    const productIndex = i % inventoryIds.length
    const productId = inventoryIds[productIndex]
    const productName = inventoryNames[productIndex]
    const quantity = randomInt(1, 5)
    const unitPrice = randomAmount(20, 400)
    const deliveryFee = i % 3 === 0 ? randomAmount(5, 45) : 0
    const paymentMethod1 = PAYMENTS[i % PAYMENTS.length]
    const paymentFee1 = i % 4 === 0 ? randomAmount(1, 15) : 0
    const paymentMethod2 = i % 5 === 0 ? PAYMENTS[(i + 2) % PAYMENTS.length] : ''
    const paymentFee2 = paymentMethod2 && i % 7 === 0 ? randomAmount(1, 10) : 0
    const amount = Number(
      (quantity * unitPrice + deliveryFee + paymentFee1 + paymentFee2).toFixed(2),
    )
    const soldAt = daysAgo(randomInt(0, 180))
    const dueDate = addDays(soldAt, 30)
    const focusRef = `sale-${saleRef.id}`
    const protocol = `MOCK-SEED-${pad(i + 1, 4)}`
    const clientName = `SEED Cliente ${pad(clientIndex + 1)}`
    const clientPhone = `1199${pad(clientIndex, 7)}`
    const clientAddress = `Rua Seed ${pad(clientIndex + 1)}, ${100 + clientIndex} — Centro`

    saleMeta.push({
      saleId: saleRef.id,
      clientId,
      clientName,
      amount,
      dueDate,
      productName,
    })

    saleBuilders.push((batch) => {
      batch.set(saleRef, {
        clientId,
        clientName,
        clientPhone,
        clientAddress,
        sellerId: seller.id,
        sellerName: seller.name,
        productId,
        productName,
        quantity,
        unitPrice,
        deliveryFee,
        paymentMethod1,
        paymentFee1,
        paymentMethod2,
        paymentFee2,
        dueDate,
        amount,
        description: `Pedido seed #${pad(i + 1, 4)} — ${productName}`,
        soldAt,
        receivableId: null,
        fiscalDocumentId: fiscalRef.id,
        fiscalStatus: 'authorized',
        fiscalRef: focusRef,
        createdAt: now,
        updatedAt: now,
      })
    })

    fiscalBuilders.push((batch) => {
      batch.set(fiscalRef, {
        focusRef,
        referenceType: 'sale',
        referenceId: saleRef.id,
        documentType: 'nfe',
        status: 'authorized',
        providerMode: 'mock',
        amount,
        description: `Pedido seed #${pad(i + 1, 4)} — ${productName}`,
        recipientName: clientName,
        recipientDocument: cpfFake(clientIndex + 1),
        externalId: `NFe${protocol}`,
        protocol,
        message: 'Mock Focus NFe: NF-e autorizada (seed).',
        rawResponse: { status: 'autorizado', ref: focusRef, seed: true },
        createdAt: now,
        updatedAt: now,
      })
    })
  }
  await commitInChunks(db, saleBuilders)
  await commitInChunks(db, fiscalBuilders)

  console.log('Seeding expenses...')
  await commitInChunks(
    db,
    Array.from({ length: COUNTS.expenses }, (_, i) => (batch) => {
      const ref = doc(collection(db, 'expenses'))
      batch.set(ref, {
        description: `SEED Despesa ${pad(i + 1)} — ${CATEGORIES[i % CATEGORIES.length]}`,
        category: CATEGORIES[i % CATEGORIES.length],
        amount: randomAmount(30, 4200),
        expenseDate: daysAgo(randomInt(0, 150)),
        createdAt: now,
        updatedAt: now,
      })
    }),
  )

  console.log('Seeding accounts payable...')
  await commitInChunks(
    db,
    Array.from({ length: COUNTS.payable }, (_, i) => (batch) => {
      const ref = doc(collection(db, 'accountsPayable'))
      batch.set(ref, {
        description: `SEED Conta a pagar ${pad(i + 1)}`,
        amount: randomAmount(50, 6000),
        dueDate: daysAgo(randomInt(-40, 60)),
        status: STATUSES[i % STATUSES.length],
        createdAt: now,
        updatedAt: now,
      })
    }),
  )

  console.log('Seeding accounts receivable (ligadas a vendas + extras)...')
  const receivableBuilders = []
  for (let i = 0; i < Math.min(COUNTS.receivable, saleMeta.length); i += 1) {
    const meta = saleMeta[i]
    const ref = doc(collection(db, 'accountsReceivable'))
    receivableBuilders.push((batch) => {
      batch.set(ref, {
        description: `Venda — ${meta.clientName} — ${meta.productName}`,
        amount: meta.amount,
        dueDate: meta.dueDate,
        status: STATUSES[i % STATUSES.length],
        clientId: meta.clientId,
        clientName: meta.clientName,
        saleId: meta.saleId,
        createdAt: now,
        updatedAt: now,
      })
      batch.update(doc(db, 'sales', meta.saleId), {
        receivableId: ref.id,
        updatedAt: now,
      })
    })
  }
  for (let i = saleMeta.length; i < COUNTS.receivable; i += 1) {
    const clientIndex = i % clientIds.length
    const ref = doc(collection(db, 'accountsReceivable'))
    receivableBuilders.push((batch) => {
      batch.set(ref, {
        description: `SEED Conta a receber avulsa ${pad(i + 1)}`,
        amount: randomAmount(50, 7000),
        dueDate: daysAgo(randomInt(-40, 60)),
        status: STATUSES[i % STATUSES.length],
        clientId: clientIds[clientIndex],
        clientName: `SEED Cliente ${pad(clientIndex + 1)}`,
        saleId: null,
        createdAt: now,
        updatedAt: now,
      })
    })
  }
  await commitInChunks(db, receivableBuilders)

  console.log('Seeding cash movements...')
  await commitInChunks(
    db,
    Array.from({ length: COUNTS.cash }, (_, i) => (batch) => {
      const ref = doc(collection(db, 'cashMovements'))
      const type = i % 3 === 0 ? 'saida' : 'entrada'
      batch.set(ref, {
        type,
        description: `SEED ${type === 'entrada' ? 'Entrada' : 'Saída'} ${pad(i + 1)}`,
        amount: randomAmount(20, 3500),
        movementDate: daysAgo(randomInt(0, 120)),
        createdAt: now,
        updatedAt: now,
      })
    }),
  )

  console.log('\nSeed concluído.')
  console.log(
    JSON.stringify(
      {
        clients: clientIds.length,
        sellers: sellerIds.length,
        sales: saleIds.length,
        fiscalDocuments: saleIds.length,
        expenses: COUNTS.expenses,
        payable: COUNTS.payable,
        receivable: COUNTS.receivable,
        cash: COUNTS.cash,
        inventory: inventoryIds.length,
      },
      null,
      2,
    ),
  )
  console.log('Dica: rode com --clear para limpar antes de reseedar.')
  process.exit(0)
}

main().catch((error) => {
  console.error('Seed falhou:', error)
  process.exit(1)
})
