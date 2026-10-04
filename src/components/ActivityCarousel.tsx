import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { speechCards, type Category } from '@/data/speechCards'
import { speak } from '@/lib/speak'

interface ActivityCarouselProps {
  categories: Category[]
}

const colorMap: Record<string, string> = {
  'text-coral': 'from-coral to-peach',
  'text-sky': 'from-sky to-lavender',
  'text-mint': 'from-mint to-sky',
  'text-lavender': 'from-lavender to-coral',
  'text-peach': 'from-peach to-sunshine',
  'text-sunshine': 'from-sunshine to-peach',
}

function CategoryCard({
  category,
  index,
}: {
  category: Category
  index: number
}) {
  const [hovered, setHovered] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  const sampleWords = speechCards
    .filter((c) => c.category === category.name)
    .slice(0, 4)
    .map((c) => c.word)

  const hearWord = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const word = sampleWords[Math.floor(Math.random() * sampleWords.length)]
    if (!word) return
    setSpeaking(true)
    speak(word)
    setTimeout(() => setSpeaking(false), 1200)
  }

  return (
    <div className="flex-shrink-0">
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className={cn(
          'relative w-72 h-80 overflow-hidden rounded-3xl p-6 bg-gradient-to-br cursor-default',
          colorMap[category.color] || 'from-coral to-peach'
        )}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08 }}
        whileHover={{ scale: 1.04, y: -8 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Decorative shapes */}
        <motion.div
          className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/20"
          animate={hovered ? { scale: 1.25, rotate: 25 } : { scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 120 }}
        />
        <div className="absolute -bottom-5 -left-5 h-24 w-24 rounded-full bg-white/10" />
        {/* Shine sweep on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ x: '-120%' }}
              animate={{ x: '120%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/20 blur-md"
            />
          )}
        </AnimatePresence>

        <div className="relative z-10 flex h-full flex-col">
          <motion.span
            className="mb-4 inline-block text-6xl"
            animate={{ y: [0, -8, 0], rotate: hovered ? [0, -6, 6, 0] : 0 }}
            transition={{ duration: hovered ? 0.6 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {category.icon}
          </motion.span>

          <h3 className="mb-2 text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            {category.name}
          </h3>

          {/* Description ↔ sample-word peek swap on hover */}
          <div className="relative flex-1">
            <AnimatePresence mode="wait">
              {hovered && sampleWords.length ? (
                <motion.div
                  key="words"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-wrap gap-2"
                >
                  {sampleWords.map((w) => (
                    <span
                      key={w}
                      className="rounded-full bg-white/25 px-3 py-1 text-sm font-semibold text-white"
                    >
                      {w}
                    </span>
                  ))}
                </motion.div>
              ) : (
                <motion.p
                  key="desc"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-white/80"
                >
                  {category.description}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-white/90">{category.cardCount} cards</span>
            <motion.button
              type="button"
              onClick={hearWord}
              aria-label={`Hear a ${category.name} word`}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 hover:bg-white/50 cursor-pointer"
            >
              <Volume2 className={cn('h-5 w-5 text-white', speaking && 'animate-pulse')} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function ActivityCarousel({ categories }: ActivityCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: direction === 'left' ? -320 : 320,
        behavior: 'smooth',
      })
      setTimeout(checkScroll, 300)
    }
  }

  return (
    <div className="relative">
      <p className="mb-4 text-center text-sm text-muted-foreground">
        Tap speaker to hear a word · hover a card to peek at examples
      </p>

      {canScrollLeft && (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-xl cursor-pointer"
          onClick={() => scroll('left')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </motion.button>
      )}

      {canScrollRight && (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 translate-x-4 items-center justify-center rounded-full border border-border bg-card shadow-xl cursor-pointer"
          onClick={() => scroll('right')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="h-6 w-6 text-foreground" />
        </motion.button>
      )}

      <div
        ref={containerRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide px-2 pb-4"
        onScroll={checkScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
