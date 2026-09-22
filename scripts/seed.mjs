/**
 * Seed realista para validacao final de MVP.
 *
 * Uso:
 * - npm run seed
 * - npm run seed:clear
 *
 * O seed evita documentos fiscais mockados. As vendas abaixo ficam prontas
 * para emissao real/homologacao via Focus NFe pela propria aplicacao.
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
    throw new Error('.env nao encontrado. Copie .env.example e preencha.')
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

function today(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
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
  let total = 0

  for (const build of builders) {
    build(batch)
    ops += 1
    total += 1

    if (ops >= 450) {
      await batch.commit()
      batch = writeBatch(db)
      ops = 0
    }
  }

  if (ops > 0) await batch.commit()
  console.log(`  committed ${total} docs/ops.`)
}

const now = Timestamp.now()

const clients = [
  {
    id: 'cliente-maria-silva',
    name: 'Maria Aparecida Silva',
    document: '39053344705',
    stateRegistrationIndicator: '9',
    stateRegistration: '',
    email: 'maria.silva@example.com',
    phone: '82991000001',
    address: 'Rua Marques de Pombal',
    addressNumber: '214',
    district: 'Ponta Grossa',
    city: 'Maceio',
    state: 'AL',
    zipCode: '57014020',
    notes: 'Cliente CPF para teste de NFC-e.',
  },
  {
    id: 'cliente-joao-santos',
    name: 'Joao Batista dos Santos',
    document: '11144477735',
    stateRegistrationIndicator: '9',
    stateRegistration: '',
    email: 'joao.santos@example.com',
    phone: '82992000002',
    address: 'Avenida Fernandes Lima',
    addressNumber: '1580',
    district: 'Farol',
    city: 'Maceio',
    state: 'AL',
    zipCode: '57055172',
    notes: 'Cliente CPF para teste de NF-e com endereco completo.',
  },
  {
    id: 'cliente-ana-costa',
    name: 'Ana Paula Costa',
    document: '93541134780',
    stateRegistrationIndicator: '9',
    stateRegistration: '',
    email: 'ana.costa@example.com',
    phone: '82993000003',
    address: 'Rua Doutor Antonio Cansancao',
    addressNumber: '725',
    district: 'Ponta Verde',
    city: 'Maceio',
    state: 'AL',
    zipCode: '57035190',
    notes: 'Cliente fiado para validar contas a receber.',
  },
  {
    id: 'cliente-mercadinho-central',
    name: 'Mercadinho Central Ltda',
    document: '11222333000181',
    stateRegistrationIndicator: '9',
    stateRegistration: '',
    email: 'financeiro@mercadinhocentral.example',
    phone: '82994000004',
    address: 'Rua do Comercio',
    addressNumber: '98',
    district: 'Centro',
    city: 'Maceio',
    state: 'AL',
    zipCode: '57020000',
    notes: 'Cliente CNPJ nao contribuinte para validar NF-e pessoa juridica.',
  },
]

const sellers = [
  {
    id: 'vendedor-balcao',
    name: 'Atendimento Balcao',
    email: 'balcao@jose.com',
    phone: '82995000001',
    active: true,
  },
  {
    id: 'entregador-carlos',
    name: 'Carlos Entregador',
    email: 'carlos@jose.com',
    phone: '82995000002',
    active: true,
  },
  {
    id: 'entregador-rafael',
    name: 'Rafael Entregador',
    email: 'rafael@jose.com',
    phone: '82995000003',
    active: true,
  },
]

const inventoryItems = [
  {
    id: 'produto-gas-p13',
    name: 'Gas GLP P13',
    sku: 'GLP-P13',
    quantity: 42,
    unit: 'UN',
    defaultUnitPrice: 115,
    ncm: '27111910',
    cfop: '5102',
    cest: '0600700',
    icmsOrigin: '0',
    icmsSituation: '102',
    pisSituation: '49',
    cofinsSituation: '49',
    notes: 'Botijao P13 para venda direta e entrega.',
  },
  {
    id: 'produto-agua-20l',
    name: 'Agua mineral 20L',
    sku: 'AGUA-20L',
    quantity: 85,
    unit: 'UN',
    defaultUnitPrice: 12,
    ncm: '22011000',
    cfop: '5102',
    cest: '',
    icmsOrigin: '0',
    icmsSituation: '102',
    pisSituation: '49',
    cofinsSituation: '49',
    notes: 'Galao de agua mineral retornavel.',
  },
  {
    id: 'produto-agua-500ml-cx12',
    name: 'Agua mineral 500ml caixa com 12',
    sku: 'AGUA-500-CX12',
    quantity: 30,
    unit: 'CX',
    defaultUnitPrice: 24,
    ncm: '22011000',
    cfop: '5102',
    cest: '',
    icmsOrigin: '0',
    icmsSituation: '102',
    pisSituation: '49',
    cofinsSituation: '49',
    notes: 'Caixa com 12 unidades para cliente empresa.',
  },
]

const sales = [
  {
    id: 'venda-nfce-cpf-pronta',
    clientId: 'cliente-maria-silva',
    sellerId: 'vendedor-balcao',
    productId: 'produto-gas-p13',
    quantity: 1,
    unitPrice: 115,
    deliveryFee: 0,
    paymentMethod1: 'pix',
    paymentFee1: 0,
    paymentMethod2: '',
    paymentFee2: 0,
    dueDate: today(),
    soldAt: today(),
    description: 'Venda balcao para emissao de NFC-e em homologacao.',
    deliveryStatus: 'delivered',
  },
  {
    id: 'venda-nfe-cpf-pronta',
    clientId: 'cliente-joao-santos',
    sellerId: 'entregador-carlos',
    productId: 'produto-agua-20l',
    quantity: 3,
    unitPrice: 12,
    deliveryFee: 8,
    paymentMethod1: 'dinheiro',
    paymentFee1: 0,
    paymentMethod2: '',
    paymentFee2: 0,
    dueDate: today(),
    soldAt: today(),
    description: 'Entrega de agua para emissao de NF-e em homologacao.',
    deliveryStatus: 'out_for_delivery',
  },
  {
    id: 'venda-fiado-entrega',
    clientId: 'cliente-ana-costa',
    sellerId: 'entregador-rafael',
    productId: 'produto-gas-p13',
    quantity: 1,
    unitPrice: 115,
    deliveryFee: 10,
    paymentMethod1: 'fiado',
    paymentFee1: 0,
    paymentMethod2: '',
    paymentFee2: 0,
    dueDate: today(15),
    soldAt: today(-1),
    description: 'Venda fiado com entrega concluida.',
    deliveryStatus: 'delivered',
  },
  {
    id: 'venda-cnpj-sem-nf',
    clientId: 'cliente-mercadinho-central',
    sellerId: 'entregador-carlos',
    productId: 'produto-agua-500ml-cx12',
    quantity: 2,
    unitPrice: 24,
    deliveryFee: 12,
    paymentMethod1: 'pix',
    paymentFee1: 0,
    paymentMethod2: '',
    paymentFee2: 0,
    dueDate: today(-1),
    soldAt: today(-1),
    description: 'Venda para cliente CNPJ nao contribuinte.',
    deliveryStatus: 'delivered',
  },
]

const expenses = [
  {
    id: 'despesa-combustivel',
    description: 'Combustivel das entregas',
    category: 'operacional',
    amount: 180,
    expenseDate: today(),
  },
  {
    id: 'despesa-aluguel',
    description: 'Aluguel do ponto comercial',
    category: 'administrativa',
    amount: 1800,
    expenseDate: today(-5),
  },
  {
    id: 'despesa-manutencao-moto',
    description: 'Manutencao preventiva da moto',
    category: 'operacional',
    amount: 260,
    expenseDate: today(-2),
  },
]

const accountsPayable = [
  {
    id: 'pagar-fornecedor-gas',
    description: 'Fornecedor de gas - remessa P13',
    amount: 5200,
    dueDate: today(7),
    status: 'pendente',
  },
  {
    id: 'pagar-fornecedor-agua',
    description: 'Fornecedor de agua mineral',
    amount: 950,
    dueDate: today(3),
    status: 'pendente',
  },
  {
    id: 'pagar-internet',
    description: 'Internet e telefone da loja',
    amount: 149.9,
    dueDate: today(-2),
    status: 'pago',
  },
]

const manualCashMovements = [
  {
    id: 'caixa-abertura-dia',
    type: 'entrada',
    description: 'Troco inicial do caixa',
    amount: 250,
    movementDate: today(),
  },
  {
    id: 'caixa-sangria-parcial',
    type: 'saida',
    description: 'Sangria parcial para cofre',
    amount: 120,
    movementDate: today(),
  },
]

function byId(items) {
  return new Map(items.map((item) => [item.id, item]))
}

async function main() {
  console.log('=== Seed Jose Gestao ===')
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
      'cashClosings',
      'fiscalEmissionLocks',
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

  const clientMap = byId(clients)
  const sellerMap = byId(sellers)
  const productMap = byId(inventoryItems)
  const receivables = []
  const cashMovements = [...manualCashMovements]

  console.log('Seeding clients, sellers and inventory...')
  await commitInChunks(db, [
    ...clients.map((client) => (batch) => {
      batch.set(doc(db, 'clients', client.id), {
        ...client,
        createdAt: now,
        updatedAt: now,
      })
    }),
    ...sellers.map((seller) => (batch) => {
      batch.set(doc(db, 'sellers', seller.id), {
        ...seller,
        createdAt: now,
        updatedAt: now,
      })
    }),
    ...inventoryItems.map((item) => (batch) => {
      batch.set(doc(db, 'inventoryItems', item.id), {
        ...item,
        createdAt: now,
        updatedAt: now,
      })
    }),
  ])

  console.log('Seeding sales and linked cash/receivables...')
  await commitInChunks(
    db,
    sales.map((sale) => (batch) => {
      const client = clientMap.get(sale.clientId)
      const seller = sellerMap.get(sale.sellerId)
      const product = productMap.get(sale.productId)
      const amount = Number(
        (
          sale.quantity * sale.unitPrice +
          sale.deliveryFee +
          sale.paymentFee1 +
          sale.paymentFee2
        ).toFixed(2),
      )
      const receivableId =
        sale.paymentMethod1 === 'fiado' ? `receber-${sale.id}` : null

      if (receivableId) {
        receivables.push({
          id: receivableId,
          description: `Venda fiado - ${client.name}`,
          amount,
          dueDate: sale.dueDate,
          status: 'pendente',
          clientId: client.id,
          clientName: client.name,
          saleId: sale.id,
        })
      } else {
        cashMovements.push({
          id: `caixa-${sale.id}`,
          type: 'entrada',
          description: `Recebimento venda - ${client.name}`,
          amount,
          movementDate: sale.soldAt,
        })
      }

      batch.set(doc(db, 'sales', sale.id), {
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        clientAddress: `${client.address}, ${client.addressNumber} - ${client.district}, ${client.city}/${client.state}`,
        sellerId: seller.id,
        sellerName: seller.name,
        productId: product.id,
        productName: product.name,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        deliveryFee: sale.deliveryFee,
        paymentMethod1: sale.paymentMethod1,
        paymentFee1: sale.paymentFee1,
        paymentMethod2: sale.paymentMethod2,
        paymentFee2: sale.paymentFee2,
        dueDate: sale.dueDate,
        amount,
        description: sale.description,
        soldAt: sale.soldAt,
        receivableId,
        fiscalDocumentId: null,
        fiscalStatus: null,
        fiscalRef: null,
        deliveryStatus: sale.deliveryStatus,
        createdAt: now,
        updatedAt: now,
      })
    }),
  )

  console.log('Seeding expenses, payables, receivables and cash movements...')
  await commitInChunks(db, [
    ...expenses.map((expense) => (batch) => {
      batch.set(doc(db, 'expenses', expense.id), {
        ...expense,
        createdAt: now,
        updatedAt: now,
      })
    }),
    ...accountsPayable.map((payable) => (batch) => {
      batch.set(doc(db, 'accountsPayable', payable.id), {
        ...payable,
        createdAt: now,
        updatedAt: now,
      })
    }),
    ...receivables.map((receivable) => (batch) => {
      batch.set(doc(db, 'accountsReceivable', receivable.id), {
        ...receivable,
        createdAt: now,
        updatedAt: now,
      })
    }),
    ...cashMovements.map((movement) => (batch) => {
      batch.set(doc(db, 'cashMovements', movement.id), {
        ...movement,
        createdAt: now,
        updatedAt: now,
      })
    }),
  ])

  console.log('\nSeed concluido.')
  console.log(
    JSON.stringify(
      {
        clients: clients.length,
        sellers: sellers.length,
        inventoryItems: inventoryItems.length,
        sales: sales.length,
        fiscalDocuments: 0,
        accountsReceivable: receivables.length,
        accountsPayable: accountsPayable.length,
        expenses: expenses.length,
        cashMovements: cashMovements.length,
        readyForTests: {
          nfce: 'venda-nfce-cpf-pronta',
          nfe: 'venda-nfe-cpf-pronta',
          receivable: 'venda-fiado-entrega',
          cnpj: 'venda-cnpj-sem-nf',
        },
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error('Seed falhou:', error)
  process.exit(1)
})
