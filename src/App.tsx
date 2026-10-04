import { Navbar } from '@/components/Navbar'
import { FloatingShapes } from '@/components/FloatingShapes'
import { LandingPage } from '@/pages/LandingPage'

export default function App() {
  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      <FloatingShapes />
      <Navbar />
      <main>
        <LandingPage />
      </main>
    </div>
  )
}
