import { Navigate, Route, Routes } from 'react-router-dom'
import {
  AppShell,
  ProtectedRoute,
} from '@/presentation/components/layout/AppShell'
import { ClientFormPage } from '@/presentation/pages/clients/ClientFormPage'
import { ClientsPage } from '@/presentation/pages/clients/ClientsPage'
import { DashboardPage } from '@/presentation/pages/DashboardPage'
import { ExpenseFormPage } from '@/presentation/pages/expenses/ExpenseFormPage'
import { ExpensesPage } from '@/presentation/pages/expenses/ExpensesPage'
import { LoginPage } from '@/presentation/pages/LoginPage'
import { ModulePlaceholderPage } from '@/presentation/pages/ModulePlaceholderPage'
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
          <Route path="despesas" element={<ExpensesPage />} />
          <Route path="despesas/nova" element={<ExpenseFormPage />} />
          <Route path="despesas/:id" element={<ExpenseFormPage />} />
          <Route
            path="financeiro"
            element={
              <ModulePlaceholderPage
                title="Financeiro"
                description="Contas a pagar e receber — Sprint 5."
              />
            }
          />
          <Route
            path="estoque"
            element={
              <ModulePlaceholderPage
                title="Estoque"
                description="Cadastro e acompanhamento de itens — Sprint 6."
              />
            }
          />
          <Route
            path="caixa"
            element={
              <ModulePlaceholderPage
                title="Caixa"
                description="Entradas, saídas e saldo — Sprint 6."
              />
            }
          />
          <Route
            path="dre"
            element={
              <ModulePlaceholderPage
                title="DRE"
                description="Receitas, despesas e resultado — Sprint 7."
              />
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
