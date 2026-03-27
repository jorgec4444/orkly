import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { toastConfig } from './config/toastConfig'
import { Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import AuthListener from './components/AuthListener'
import StaticPage from './components/StaticPage'
import ClientDetail from './pages/ClientDetail'
import CreateContent from './pages/CreateContent'
import Settings from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
    <Toaster {...toastConfig} />
    <AuthListener />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/terms" element={<StaticPage src="/terms.html" />} />
        <Route path="/privacy" element={<StaticPage src="/privacy.html" />} />
        <Route path="/dashboard" element={<Dashboard />}>
        <Route index element={<Navigate to="clients" replace />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="create" element={<CreateContent />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App