import { Route, Routes } from 'react-router-dom'

import DetalheLocal from './pages/DetalheLocal'
import Home from './pages/Home'
import Locais from './pages/Locais'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/locais" element={<Locais />} />
      <Route path="/locais/:slug" element={<DetalheLocal />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
