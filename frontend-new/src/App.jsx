import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { toastConfig } from './config/toastConfig'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import AuthListener from './components/AuthListener'
import StaticPage from './components/StaticPage'

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
          <Route path="clients" element={<Clients />} />
          <Route path="create" element={<div>Create Content</div>} />
          <Route path="settings" element={<div>Settings</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App