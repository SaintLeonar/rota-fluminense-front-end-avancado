import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Locais from './pages/Locais'
import DetalheLocal from './pages/DetalheLocal'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/locais" element={<Locais />} />
      <Route path="/locais/:id" element={<DetalheLocal />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}