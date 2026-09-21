import { Navigate, Route, Routes } from 'react-router-dom'
import {
  AppShell,
  ProtectedRoute,
} from '@/presentation/components/layout/AppShell'
import { CashFormPage } from '@/presentation/pages/cash/CashFormPage'
import { CashPage } from '@/presentation/pages/cash/CashPage'
import { ClientFormPage } from '@/presentation/pages/clients/ClientFormPage'
import { ClientsPage } from '@/presentation/pages/clients/ClientsPage'
import { DashboardPage } from '@/presentation/pages/DashboardPage'
import { DeliveriesPage } from '@/presentation/pages/deliveries/DeliveriesPage'
import { DrePage } from '@/presentation/pages/dre/DrePage'
import { ExpenseFormPage } from '@/presentation/pages/expenses/ExpenseFormPage'
import { ExpensesPage } from '@/presentation/pages/expenses/ExpensesPage'
import { FiscalDocumentsPage } from '@/presentation/pages/fiscal/FiscalDocumentsPage'
import { AccountPayableFormPage } from '@/presentation/pages/finance/AccountPayableFormPage'
import { AccountReceivableFormPage } from '@/presentation/pages/finance/AccountReceivableFormPage'
import { AccountsPayablePage } from '@/presentation/pages/finance/AccountsPayablePage'
import { AccountsReceivablePage } from '@/presentation/pages/finance/AccountsReceivablePage'
import { FinanceHubPage } from '@/presentation/pages/finance/FinanceHubPage'
import { InventoryFormPage } from '@/presentation/pages/inventory/InventoryFormPage'
import { InventoryPage } from '@/presentation/pages/inventory/InventoryPage'
import { LoginPage } from '@/presentation/pages/LoginPage'
import { SaleDetailPage } from '@/presentation/pages/sales/SaleDetailPage'
import { SaleFormPage } from '@/presentation/pages/sales/SaleFormPage'
import { SalesPage } from '@/presentation/pages/sales/SalesPage'
import { SellerFormPage } from '@/presentation/pages/sellers/SellerFormPage'
import { SellersPage } from '@/presentation/pages/sellers/SellersPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="clientes/novo" element={<ClientFormPage />} />
          <Route path="clientes/:id" element={<ClientFormPage />} />
          <Route path="vendedores" element={<SellersPage />} />
          <Route path="vendedores/novo" element={<SellerFormPage />} />
          <Route path="vendedores/:id" element={<SellerFormPage />} />
          <Route path="vendas" element={<SalesPage />} />
          <Route path="vendas/nova" element={<SaleFormPage />} />
          <Route path="vendas/:id" element={<SaleDetailPage />} />
          <Route path="vendas/:id/editar" element={<SaleFormPage />} />
          <Route path="entregas" element={<DeliveriesPage />} />
          <Route path="despesas" element={<ExpensesPage />} />
          <Route path="despesas/nova" element={<ExpenseFormPage />} />
          <Route path="despesas/:id" element={<ExpenseFormPage />} />
          <Route path="fiscal" element={<FiscalDocumentsPage />} />
          <Route path="financeiro" element={<FinanceHubPage />} />
          <Route path="financeiro/pagar" element={<AccountsPayablePage />} />
          <Route path="financeiro/pagar/novo" element={<AccountPayableFormPage />} />
          <Route path="financeiro/pagar/:id" element={<AccountPayableFormPage />} />
          <Route path="financeiro/receber" element={<AccountsReceivablePage />} />
          <Route
            path="financeiro/receber/novo"
            element={<AccountReceivableFormPage />}
          />
          <Route
            path="financeiro/receber/:id"
            element={<AccountReceivableFormPage />}
          />
          <Route path="estoque" element={<InventoryPage />} />
          <Route path="estoque/novo" element={<InventoryFormPage />} />
          <Route path="estoque/:id" element={<InventoryFormPage />} />
          <Route path="caixa" element={<CashPage />} />
          <Route path="caixa/nova" element={<CashFormPage />} />
          <Route path="caixa/:id" element={<CashFormPage />} />
          <Route path="dre" element={<DrePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
