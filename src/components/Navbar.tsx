import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Mail, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/Logo'

const navLinks = [
  { id: 'home', label: 'Home' },
  { id: 'device', label: 'IoT Device' },
  { id: 'system', label: 'System Glimpse' },
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'contact', label: 'Contact' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [logoHover, setLogoHover] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const scrollToSection = (id: string) => {
    setIsOpen(false)
    if (id === 'home') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        navigate('/', { replace: false })
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 150)
      }
      return
    }

    if (location.pathname === '/') {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/', { replace: false })
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 250)
    }
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto max-w-7xl">
        <div className="relative flex h-16 items-center justify-between gap-4 rounded-3xl border border-white/50 bg-gradient-to-r from-lavender/35 via-card/70 to-peach/30 px-4 shadow-lg shadow-primary/5 backdrop-blur-xl sm:px-6">
          {/* Brand Logo (Left) */}
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center z-10 shrink-0"
            onMouseEnter={() => setLogoHover(true)}
            onMouseLeave={() => setLogoHover(false)}
          >
            <motion.div
              className="inline-flex items-center gap-2 sm:gap-2.5"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <LogoMark size={36} className="sm:w-[42px] sm:h-[42px]" spinning={logoHover} eyes={logoHover ? 'open' : 'closed'} />
              <span
                className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
                style={{ fontFamily: 'Fredoka, system-ui, sans-serif' }}
              >
                ArTechulate
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation Links - Centered (visible on lg+ screens to prevent tablet collision) */}
          <div className="hidden lg:flex items-center gap-1 rounded-full border border-border/50 bg-card/70 px-2.5 py-1 shadow-sm backdrop-blur absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <motion.button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                className="rounded-full px-3 py-1.5 text-xs xl:text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary/12 hover:text-primary cursor-pointer"
              >
                {link.label}
              </motion.button>
            ))}
          </div>

          {/* Right end spacer / Mobile Menu toggle (visible on screens < lg) */}
          <div className="flex items-center justify-end z-10">
            <motion.button
              className="rounded-full border border-border/60 bg-card/70 p-2 text-foreground lg:hidden cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
              whileTap={{ scale: 0.92 }}
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto mt-2 max-w-7xl overflow-hidden rounded-3xl border border-white/50 bg-gradient-to-br from-lavender/40 via-card/95 to-peach/30 shadow-xl backdrop-blur-xl lg:hidden"
          >
            <div className="space-y-1 p-3 sm:p-4">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="block w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm sm:text-base text-foreground hover:bg-primary/10 hover:text-primary transition cursor-pointer"
                  >
                    {link.label}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar
