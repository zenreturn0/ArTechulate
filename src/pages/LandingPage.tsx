import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gamepad2,
  Cpu,
  Stethoscope,
  Activity,
  Mic,
  Mail,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Monitor,
  Target,
  Sparkles,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { ActivityCarousel } from '@/components/ActivityCarousel'
import { categories } from '@/data/speechCards'
import { cn } from '@/lib/utils'

// Accurate, real-world hardware breakdown of the ArTechulate IoT unit
const devicePhotos = [
  {
    src: '/images/artechulate_iot_headset_top.jpg',
    alt: 'ArTechulate IoT Hardware Unit Top View with Headset',
    title: 'Top View: Tactile Joystick & Wired Headset',
    subtitle: '3.5mm Headset Connected',
  },
  {
    src: '/images/artechulate_iot_perspective.jpg',
    alt: 'ArTechulate IoT Hardware Unit Perspective Angle',
    title: 'Perspective View: Tactile Controls & Enclosure',
    subtitle: 'Sturdy Pediatric Enclosure',
  },
  {
    src: '/images/artechulate_iot_top.jpg',
    alt: 'ArTechulate IoT Hardware Unit Angle View',
    title: 'Connected View: Audio Jack & DC Power',
    subtitle: 'ESP32 Wi-Fi Enabled',
  },
]
const hardwareParts = [
  {
    icon: Gamepad2,
    name: 'Analog Thumb Joystick',
    desc: 'Tactile navigation for interactive motor-speech games, letting children physicalize choices and engage actively.',
  },
  {
    icon: Monitor,
    name: '16x2 LCD Status Screen',
    desc: 'Displays live device connection, current practice word, and real-time visual session cues.',
  },
  {
    icon: Headphones,
    name: '3.5mm Wired Headset & Earphones',
    desc: 'Audio pronunciation models are heard directly through the headset on demand, helping the child hear words clearly without room distractions.',
  },
  {
    icon: Mic,
    name: 'In-Line Voice Microphone',
    desc: 'Captures the child’s speech directly for live phonetic evaluation and clarity scoring without ambient room interference.',
  },
]

// Real system glimpses from actual platform accounts
const systemGlimpses = [
  {
    id: 'game',
    title: 'Speech Quest (IoT Game)',
    badge: 'ESP32 Joystick Connected',
    desc: 'Children navigate interactive adventures using the physical IoT joystick while speaking target words into the headset mic.',
    image: '/images/system/speech_quest.png',
    alt: 'ArTechulate Speech Quest IoT Game view',
  },
  {
    id: 'practice',
    title: 'Interactive Practice Mode',
    badge: 'Real-time Phonetic Scoring',
    desc: 'Word cards with click-to-listen pronunciation models and instant visual feedback on spoken speech accuracy.',
    image: '/images/system/practice_mode.png',
    alt: 'ArTechulate Practice Mode interface',
  },
  {
    id: 'reports',
    title: 'Therapist Progress & Analytics',
    badge: 'Clinical Portal',
    desc: 'Speech-language pathologists monitor student sessions, track longitudinal accuracy, and review structured articulation reports.',
    image: '/images/system/therapist_progress.png',
    alt: 'ArTechulate Therapist Progress and Analytics dashboard',
  },
]

// The 3 core pillars of the ArTechulate platform
const corePillars = [
  {
    icon: Target,
    title: 'Targeted Sound Practice',
    desc: 'Curated card decks organized by speech sound (TH, R, S, L, blends, and vowels) to help children practice specific phonemes.',
  },
  {
    icon: Activity,
    title: 'Live Speech Feedback',
    desc: 'Words spoken into the microphone are transcribed and evaluated in real time, giving immediate encouragement and clarity scores.',
  },
  {
    icon: Stethoscope,
    title: 'Therapist Tracking',
    desc: 'Speech therapists can monitor student practice sessions, track accuracy over time, and download structured progress reports.',
  },
]

const simpleFaqs = [
  {
    q: 'What is ArTechulate?',
    a: 'ArTechulate is an interactive speech therapy system combining web-based articulation exercises with a custom tactile IoT hardware controller for children.',
  },
  {
    q: 'How does the IoT device help with therapy?',
    a: 'Traditional articulation repetition can become repetitive. The physical joystick, audio cues, and LCD screen turn speech drills into engaging, hands-on games that kids look forward to.',
  },
  {
    q: 'Can this be used at home or in a clinic?',
    a: 'Yes. It is designed for speech-language pathologists (SLPs) to use during clinical therapy sessions, as well as for guided home practice under clinician supervision.',
  },
  {
    q: 'How do children hear the words and speak into the system?',
    a: 'Children wear a comfortable 3.5mm wired headset plugged into the hardware unit. Pronunciations are heard clearly through the earphones when clicked, and the child’s speech is picked up via the in-line microphone to isolate voice from room echo.',
  },
  {
    q: 'How do therapists and parents track articulation progress?',
    a: 'Every completed practice attempt logs accuracy percentages, target phonemes, and attempt histories in real time. Clinicians and parents can review longitudinal progress charts and export structured reports.',
  },
]

export function LandingPage() {
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeGlimpse, setActiveGlimpse] = useState(0)
  const [deviceSlide, setDeviceSlide] = useState(0)

  const nextDeviceSlide = () => {
    setDeviceSlide((prev) => (prev + 1) % devicePhotos.length)
  }

  const prevDeviceSlide = () => {
    setDeviceSlide((prev) => (prev - 1 + devicePhotos.length) % devicePhotos.length)
  }

  const handleCopyEmail = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText('artechulate.alchemist@gmail.com')
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2500)
    }
  }

  return (
    <div className="relative overflow-hidden bg-background text-foreground w-full">
      {/* 1. Hero Section */}
      <section id="home" className="relative pt-28 sm:pt-36 pb-14 sm:pb-20 px-4 sm:px-8 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 sm:mb-5">
          <Cpu className="w-3.5 h-3.5" />
          <span>Smart Speech Therapy System &amp; IoT</span>
        </div>

        <h1
          className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] mb-4 sm:mb-5 text-foreground"
          style={{ fontFamily: 'Fredoka, system-ui, sans-serif' }}
        >
          Making Speech Therapy{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral via-peach to-amber-500">
            Interactive &amp; Fun
          </span>
        </h1>

        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
          ArTechulate connects speech therapy software with custom tactile IoT hardware.
          Children practice target sounds through gamified joystick activities while therapists
          and parents track real-time speech accuracy.
        </p>

        {/* Direct Contact Button */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-3.5 justify-center items-center">
          <a
            href="mailto:artechulate.alchemist@gmail.com?subject=ArTechulate%20Inquiry"
            className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-coral to-peach text-white font-bold rounded-2xl shadow-lg shadow-coral/25 flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 transition-all text-sm sm:text-base"
          >
            <Mail className="w-4 h-4" />
            <span>Contact Our Team</span>
          </a>
        </div>

        {/* Email quick copy snippet */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground max-w-full px-2">
          <span>Email:</span>
          <span className="font-mono font-semibold text-foreground text-[11px] sm:text-xs select-all break-all">
            artechulate.alchemist@gmail.com
          </span>
          <button
            type="button"
            onClick={handleCopyEmail}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer shrink-0"
            title="Copy email"
          >
            {copiedEmail ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </section>

      {/* 2. Real IoT Hardware Showcase Section */}
      <section id="device" className="py-14 sm:py-20 px-4 sm:px-8 bg-muted/25 border-y border-border/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>Physical Hardware Unit</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground mb-3"
              style={{ fontFamily: 'Fredoka, system-ui, sans-serif' }}
            >
              The ArTechulate IoT Device
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
              Designed specifically for pediatric speech therapy sessions. Simple, sturdy, and easy for kids to interact with.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Real device photo carousel */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative rounded-3xl border border-border bg-card p-3 sm:p-4 shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden">
                {/* Image display container */}
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-border/50">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={deviceSlide}
                      src={devicePhotos[deviceSlide].src}
                      alt={devicePhotos[deviceSlide].alt}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="w-full h-full object-contain p-2"
                    />
                  </AnimatePresence>

                  {/* Left navigation arrow */}
                  <button
                    type="button"
                    onClick={prevDeviceSlide}
                    aria-label="Previous hardware image"
                    className="absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-background/85 hover:bg-background text-foreground shadow-md backdrop-blur border border-border/60 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Right navigation arrow */}
                  <button
                    type="button"
                    onClick={nextDeviceSlide}
                    aria-label="Next hardware image"
                    className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-background/85 hover:bg-background text-foreground shadow-md backdrop-blur border border-border/60 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Subtitle & Dot Indicators */}
                <div className="mt-3 sm:mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground px-1">
                  <div>
                    <p className="font-bold text-foreground text-xs sm:text-sm">
                      {devicePhotos[deviceSlide].title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {devicePhotos[deviceSlide].subtitle}
                    </p>
                  </div>

                  {/* Dot Indicators */}
                  <div className="flex items-center gap-1.5">
                    {devicePhotos.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDeviceSlide(idx)}
                        aria-label={`Jump to slide ${idx + 1}`}
                        className={cn(
                          'h-2 rounded-full transition-all cursor-pointer',
                          deviceSlide === idx
                            ? 'w-6 bg-primary'
                            : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Hardware Component Highlights */}
            <div className="lg:col-span-6 space-y-3 sm:space-y-4">
              {hardwareParts.map((part) => {
                const Icon = part.icon
                return (
                  <div
                    key={part.name}
                    className="flex items-start gap-3 sm:gap-4 rounded-2xl border border-border/80 bg-card p-3 sm:p-4 shadow-xs"
                  >
                    <div className="rounded-xl bg-primary/10 p-2 sm:p-2.5 text-primary shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground">{part.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        {part.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. A Glimpse Inside the System (Real Screenshots) */}
      <section id="system" className="py-14 sm:py-20 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Overview</span>
          </div>
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground mb-3"
            style={{ fontFamily: 'Fredoka, system-ui, sans-serif' }}
          >
            A Glimpse of the System
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
            Real views of ArTechulate in action across child gameplay, speech practice, and therapist monitoring.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-8">
          {systemGlimpses.map((item, index) => {
            const isActive = activeGlimpse === index
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveGlimpse(index)}
                className={cn(
                  'px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer border',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground'
                )}
              >
                {item.title}
              </button>
            )
          })}
        </div>

        {/* Active Screenshot Display */}
        <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-3 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-border/60">
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-peach/20 text-coral text-[11px] font-bold uppercase tracking-wider mb-1">
                {systemGlimpses[activeGlimpse].badge}
              </div>
              <h3 className="text-base sm:text-xl font-bold text-foreground">
                {systemGlimpses[activeGlimpse].title}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              {systemGlimpses[activeGlimpse].desc}
            </p>
          </div>

          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-border/80 bg-slate-950/5 shadow-inner flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.img
                key={systemGlimpses[activeGlimpse].id}
                src={systemGlimpses[activeGlimpse].image}
                alt={systemGlimpses[activeGlimpse].alt}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="w-full h-auto rounded-xl object-contain max-h-[280px] sm:max-h-[440px] lg:max-h-[580px] mx-auto"
              />
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 4. Core Features */}
      <section id="features" className="py-14 sm:py-20 px-4 sm:px-8 bg-muted/20 border-t border-border/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground mb-3"
              style={{ fontFamily: 'Fredoka, system-ui, sans-serif' }}
            >
              How ArTechulate Helps
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              A cohesive system built for children, speech therapists, and parents.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {corePillars.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-start"
                >
                  <div className="rounded-2xl bg-coral/10 p-2.5 sm:p-3 text-coral w-fit mb-3 sm:mb-4">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5 sm:mb-2" style={{ fontFamily: 'Fredoka, system-ui, sans-serif' }}>
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5. Sound Decks Preview */}
      <section className="py-12 sm:py-16 px-3 sm:px-8 border-t border-border/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2"
              style={{ fontFamily: 'Fredoka, system-ui, sans-serif' }}
            >
              Sound Categories &amp; Decks
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground px-2">
              Word collections organized for targeted articulation practice. Tap the speaker icon on any card to hear the sample pronunciation on click.
            </p>
          </div>

          <ActivityCarousel categories={categories} />
        </div>
      </section>

      {/* 6. How It Works (Simple 3 Steps) */}
      <section id="how-it-works" className="py-14 sm:py-20 px-4 sm:px-8 border-t border-border/60 max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-14">
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground mb-2"
            style={{ fontFamily: 'Fredoka, system-ui, sans-serif' }}
          >
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Simple 3-step articulation workflow</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
          <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
            <span className="text-xl sm:text-2xl font-black text-primary/40 block mb-2" style={{ fontFamily: 'Fredoka' }}>
              01
            </span>
            <h3 className="text-sm sm:text-base font-bold text-foreground mb-1">Pick a Target Sound</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Select specific consonant or vowel decks assigned by the therapist.
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
            <span className="text-xl sm:text-2xl font-black text-primary/40 block mb-2" style={{ fontFamily: 'Fredoka' }}>
              02
            </span>
            <h3 className="text-sm sm:text-base font-bold text-foreground mb-1">Play &amp; Speak</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Navigate games with the IoT joystick while speaking words clearly into the headset mic.
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
            <span className="text-xl sm:text-2xl font-black text-primary/40 block mb-2" style={{ fontFamily: 'Fredoka' }}>
              03
            </span>
            <h3 className="text-sm sm:text-base font-bold text-foreground mb-1">Track Progress</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              View immediate phonetic feedback and review saved progress reports.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Animated Common Questions (5 FAQs) */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 bg-muted/20 border-t border-border/60">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl font-extrabold text-foreground text-center mb-6 sm:mb-8"
            style={{ fontFamily: 'Fredoka, system-ui, sans-serif' }}
          >
            Common Questions
          </h2>

          <div className="space-y-2.5 sm:space-y-3">
            {simpleFaqs.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left font-semibold text-xs sm:text-sm text-foreground hover:bg-muted/40 transition cursor-pointer gap-2"
                  >
                    <span>{faq.q}</span>
                    <ChevronRight
                      className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
                        isOpen && 'rotate-90'
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 8. Contact Banner */}
      <section id="contact" className="py-14 sm:py-20 px-4 sm:px-8 border-t border-border/60">
        <div className="max-w-4xl mx-auto rounded-2xl sm:rounded-3xl bg-gradient-to-r from-coral via-peach to-amber-500 p-6 sm:p-10 md:p-12 text-center text-white shadow-xl">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 tracking-tight"
            style={{ fontFamily: 'Fredoka, system-ui, sans-serif' }}
          >
            Interested in the ArTechulate System?
          </h2>
          <p className="text-white/95 text-xs sm:text-sm md:text-base mb-5 sm:mb-6 max-w-xl mx-auto leading-relaxed">
            For deployment inquiries, pilot programs, or device demonstrations, contact our team directly:
          </p>

          <div className="inline-flex max-w-full items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-white/30 text-white font-mono text-xs sm:text-sm md:text-base font-bold mb-5 sm:mb-6 select-all break-all">
            <Mail className="w-4 h-4 shrink-0 text-white" />
            <span className="truncate">{/* email */}artechulate.alchemist@gmail.com</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="mailto:artechulate.alchemist@gmail.com?subject=ArTechulate%20Inquiry"
              className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 bg-white text-coral font-bold rounded-2xl shadow-md hover:bg-slate-50 transition text-xs sm:text-sm cursor-pointer"
            >
              Email Us Directly
            </a>

            <button
              type="button"
              onClick={handleCopyEmail}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold rounded-2xl text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2"
            >
              {copiedEmail ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedEmail ? 'Email Copied!' : 'Copy Email Address'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 9. Simple Clean Footer: Exactly 1 Logo, No Duplicate */}
      <footer className="py-8 sm:py-10 px-4 sm:px-8 border-t border-border bg-card">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground text-center sm:text-left">
          <div className="flex items-center">
            <Logo size={28} textClassName="text-sm sm:text-base" />
          </div>

          <p>&copy; {new Date().getFullYear()} ArTechulate Speech Therapy System. All rights reserved.</p>

          <a
            href="mailto:artechulate.alchemist@gmail.com"
            className="hover:text-foreground transition-colors font-medium text-foreground break-all"
          >
            artechulate.alchemist@gmail.com
          </a>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
