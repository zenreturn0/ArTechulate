(() => {
  'use strict'

  var soundEnabled = true
  var audioCtx = null
  var masterGain = null
  var bgmGain = null
  var sfxGain = null
  var bgmInterval = null
  var bgmPlaying = false
  var bgmStep = 0

  const levels = {
    s: { number: 1, sound: '/S/', name: 'Cloverfield Crossing', objects: [
      { word: 'SUN', icon: '☀️', x: 380, y: 160 },
      { word: 'SOCK', icon: '🧦', x: 800, y: 440 },
      { word: 'SOAP', icon: '🧼', x: 1430, y: 160 },
      { word: 'SNAKE', icon: '🐍', x: 590, y: 1000 },
      { word: 'STAR', icon: '⭐', x: 1640, y: 1000 },
    ] },
    p: { number: 2, sound: '/P/', name: 'Pinecone Point', objects: [
      { word: 'PIG', icon: '🐷', x: 380, y: 160 },
      { word: 'PAN', icon: '🍳', x: 800, y: 440 },
      { word: 'PIZZA', icon: '🍕', x: 1430, y: 160 },
      { word: 'PENCIL', icon: '✏️', x: 590, y: 1000 },
      { word: 'POT', icon: '🍯', x: 1640, y: 1000 },
    ] },
    b: { number: 3, sound: '/B/', name: 'Bluebell Bay', objects: [
      { word: 'BALL', icon: '⚽', x: 380, y: 160 },
      { word: 'BUS', icon: '🚌', x: 800, y: 440 },
      { word: 'BIRD', icon: '🐦', x: 1430, y: 160 },
      { word: 'BOOK', icon: '📖', x: 590, y: 1000 },
      { word: 'BANANA', icon: '🍌', x: 1640, y: 1000 },
    ] },
  }

  const WORLD = { width: 1800, height: 1150 }
  const gridOrigin = { x: 170, y: 160 }
  const gridStep = { x: 210, y: 280 }
  const gridPosition = (x, y) => {
    return {
      x: gridOrigin.x + x * gridStep.x,
      y: gridOrigin.y + y * gridStep.y
    }
  }
  const startPosition = gridPosition(0, 0)
  const player = { 
    x: startPosition.x, 
    y: startPosition.y, 
    targetX: startPosition.x, 
    targetY: startPosition.y, 
    dx: 0, 
    dy: 0, 
    face: 1, 
    happyUntil: 0,
    walkCycle: 0,
    blinkUntil: 0,
    nextBlink: 2500
  }
  const movement = { x: 0, y: 0 }
  const waypoints = []
  let currentGridX = 0
  let currentGridY = 0
  const collected = new Set()
  const particles = []
  const dustPuffs = []
  const ambientMotes = []
  const trees = []
  const flowers = []

  // Ensure grid points are never blocked by decorative obstacles
  const isNearAnyGrid = (x, y, radius = 55) => {
    for (let gx = 0; gx < 8; gx++) {
      for (let gy = 0; gy < 4; gy++) {
        if (isWaterGrid(gx, gy)) continue
        const gp = gridPosition(gx, gy)
        if (Math.hypot(x - gp.x, y - gp.y) < radius) return true
      }
    }
    return false
  }

  // Beautiful pond covering water grid cells (5, 2) and (6, 2)
  const water = { x: 1325, y: 660, rx: 215, ry: 145, rot: -0.12 }

  function isWater(x, y, padding = 15) {
    const dx = x - water.x
    const dy = y - water.y
    const cos = 0.992808
    const sin = -0.119712
    const rx = dx * cos + dy * sin
    const ry = -dx * sin + dy * cos
    const effRx = water.rx + padding
    const effRy = water.ry + padding
    return ((rx * rx) / (effRx * effRx) + (ry * ry) / (effRy * effRy)) < 1.0
  }

  function isWaterGrid(gx, gy) {
    return (gx === 5 && gy === 2) || (gx === 6 && gy === 2)
  }

  const rocks = [
    { x: 430, y: 330, r: 24 }, { x: 980, y: 360, r: 28 }, { x: 350, y: 900, r: 22 },
    { x: 1080, y: 850, r: 24 }, { x: 1600, y: 470, r: 26 }, { x: 875, y: 670, r: 20 },
  ].filter(r => !isNearAnyGrid(r.x, r.y, r.r + 30) && !isWater(r.x, r.y, 25))

  const houses = [
    { x: 1040, y: 80, w: 160, h: 125, roof: '#e0533c', wall: '#fff5dc', trim: '#6a3c24' },
    { x: 100, y: 810, w: 160, h: 125, roof: '#3b82f6', wall: '#fefce8', trim: '#1e3a8a' },
  ]

  // Generate trees with clearance around quest stars, walkable grid stops, and water pond
  for (let i = 0; i < 46; i++) {
    const x = 50 + ((i * 197 + 73) % 1700)
    const y = 50 + ((i * 283 + 119) % 1040)
    const tooCloseToQuest = levels.s.objects.some((object) => Math.hypot(x - object.x, y - object.y) < 110)
    const tooCloseToSpawn = Math.hypot(x - startPosition.x, y - startPosition.y) < 95
    const tooCloseToGrid = isNearAnyGrid(x, y, 62)
    const inPond = isWater(x, y, 30)
    if (!tooCloseToQuest && !tooCloseToSpawn && !tooCloseToGrid && !inPond) {
      trees.push({ 
        x, 
        y, 
        size: 24 + (i * 13 % 16), 
        hue: i % 3, 
        type: i % 4 === 0 ? 'pine' : 'oak',
        hasApples: i % 3 === 0
      })
    }
  }

  // 6 Child-Friendly Themed Biomes with vibrant aesthetics
  const BIOMES = [
    {
      id: 'emerald',
      name: 'Cloverfield Crossing',
      badge: 'Emerald Meadow',
      bg: '#7bc865',
      hillTop: '#68b852',
      hillBottom: '#59a844',
      pathShadow: 'rgba(15, 51, 40, 0.18)',
      pathBorder: '#b39563',
      pathInner: '#faeec7',
      waterBorder: '#489f66',
      waterGrad: ['#67e8f9', '#38bdf8', '#0284c7'],
      treeFoliage: [
        ['#1e5e38', '#2a7c4a', '#3fb067'],
        ['#256b3e', '#348d53', '#4fc476'],
        ['#1d5635', '#2b7949', '#38a15e']
      ],
      treeFruit: '#ef4444',
      moteColor: (a, p) => `rgba(254, 240, 138, ${a * p})`
    },
    {
      id: 'candy',
      name: 'Sugarplum Summit',
      badge: 'Candy Cloud Valley',
      bg: '#f472b6',
      hillTop: '#ec4899',
      hillBottom: '#db2777',
      pathShadow: 'rgba(131, 24, 67, 0.25)',
      pathBorder: '#f9a8d4',
      pathInner: '#fdf2f8',
      waterBorder: '#c084fc',
      waterGrad: ['#fbcfe8', '#e879f9', '#a855f7'],
      treeFoliage: [
        ['#7e22ce', '#9333ea', '#c084fc'],
        ['#6b21a8', '#a855f7', '#d8b4fe'],
        ['#581c87', '#7c3aed', '#a78bfa']
      ],
      treeFruit: '#fbbf24',
      moteColor: (a, p) => `rgba(253, 224, 71, ${a * p})`
    },
    {
      id: 'autumn',
      name: 'Pinecone Point',
      badge: 'Golden Honey Grove',
      bg: '#f59e0b',
      hillTop: '#d97706',
      hillBottom: '#b45309',
      pathShadow: 'rgba(67, 20, 7, 0.25)',
      pathBorder: '#92400e',
      pathInner: '#fef3c7',
      waterBorder: '#b45309',
      waterGrad: ['#60a5fa', '#3b82f6', '#1d4ed8'],
      treeFoliage: [
        ['#9a3412', '#c2410c', '#ea580c'],
        ['#b45309', '#d97706', '#f59e0b'],
        ['#78350f', '#a16207', '#ca8a04']
      ],
      treeFruit: '#dc2626',
      moteColor: (a, p) => `rgba(251, 191, 36, ${a * p})`
    },
    {
      id: 'galaxy',
      name: 'Cosmic Bay',
      badge: 'Crystal Star Galaxy',
      bg: '#312e81',
      hillTop: '#252163',
      hillBottom: '#1e1b4b',
      pathShadow: 'rgba(10, 5, 40, 0.35)',
      pathBorder: '#6366f1',
      pathInner: '#c7d2fe',
      waterBorder: '#4338ca',
      waterGrad: ['#22d3ee', '#818cf8', '#6366f1'],
      treeFoliage: [
        ['#312e81', '#4338ca', '#6366f1'],
        ['#3730a3', '#4f46e5', '#818cf8'],
        ['#2e1065', '#581c87', '#7c3aed']
      ],
      treeFruit: '#38bdf8',
      moteColor: (a, p) => `rgba(192, 132, 252, ${a * p})`
    },
    {
      id: 'tropical',
      name: 'Sunken Pearl Cove',
      badge: 'Tropical Coral Bay',
      bg: '#2dd4bf',
      hillTop: '#14b8a6',
      hillBottom: '#0d9488',
      pathShadow: 'rgba(19, 78, 74, 0.25)',
      pathBorder: '#f59e0b',
      pathInner: '#fef08a',
      waterBorder: '#0f766e',
      waterGrad: ['#67e8f9', '#06b6d4', '#0284c7'],
      treeFoliage: [
        ['#064e3b', '#047857', '#10b981'],
        ['#065f46', '#059669', '#34d399'],
        ['#134e4a', '#0d9488', '#2dd4bf']
      ],
      treeFruit: '#f43f5e',
      moteColor: (a, p) => `rgba(254, 240, 138, ${a * p})`
    },
    {
      id: 'frosty',
      name: 'Snowflake Ridge',
      badge: 'Frosty Wonderland',
      bg: '#a5f3fc',
      hillTop: '#67e8f9',
      hillBottom: '#22d3ee',
      pathShadow: 'rgba(14, 116, 144, 0.22)',
      pathBorder: '#38bdf8',
      pathInner: '#f0fdfa',
      waterBorder: '#0284c7',
      waterGrad: ['#bae6fd', '#38bdf8', '#0369a1'],
      treeFoliage: [
        ['#042f2e', '#0f766e', '#14b8a6'],
        ['#164e63', '#0891b2', '#06b6d4'],
        ['#0c4a6e', '#0284c7', '#38bdf8']
      ],
      treeFruit: '#f43f5e',
      moteColor: (a, p) => `rgba(255, 255, 255, ${a * p})`
    }
  ]

  // Dynamic Weather Particle Engine per Biome
  const weatherParticles = []
  const shootingStars = []

  function initWeather(biomeId) {
    weatherParticles.length = 0
    shootingStars.length = 0

    const count = biomeId === 'galaxy' ? 110 : biomeId === 'frosty' ? 80 : biomeId === 'autumn' ? 65 : 50
    for (let i = 0; i < count; i++) {
      weatherParticles.push({
        x: Math.random() * WORLD.width,
        y: Math.random() * WORLD.height,
        vx: 0,
        vy: 0,
        size: 1.5 + Math.random() * 3.5,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 3,
        phase: Math.random() * Math.PI * 2,
        type: biomeId,
        color: '#ffffff'
      })
    }
  }

  // Automatically randomize biome on launch or set by map selector
  let currentBiomeIndex = Math.floor(Math.random() * BIOMES.length)
  initWeather(BIOMES[currentBiomeIndex].id)

  function setBiome(index) {
    currentBiomeIndex = (index + BIOMES.length) % BIOMES.length
    const b = BIOMES[currentBiomeIndex]
    const area = document.querySelector('#area-name')
    if (area) area.textContent = b.badge
    initWeather(b.id)
    playBiomeFanfare(b.id)
  }
  function randomizeBiome() {
    setBiome(Math.floor(Math.random() * BIOMES.length))
  }

  // Generate lush wildflowers
  const flowerTypes = ['daisy', 'poppy', 'lavender', 'buttercup']
  for (let i = 0; i < 140; i++) {
    flowers.push({ 
      x: 20 + ((i * 137 + 43) % 1760), 
      y: 20 + ((i * 229 + 79) % 1110), 
      type: flowerTypes[i % flowerTypes.length],
      scale: 0.8 + (i % 5) * 0.1
    })
  }

  // Floating cartoon clouds for young children
  const clouds = [
    { x: 120, y: 70, w: 140, h: 48, speed: 8 },
    { x: 580, y: 130, w: 180, h: 56, speed: 12 },
    { x: 1040, y: 55, w: 130, h: 44, speed: 9 },
    { x: 1520, y: 110, w: 160, h: 52, speed: 11 }
  ]

  // Fluttering friendly butterflies
  const butterflies = [
    { x: 380, y: 340, color: '#f43f5e', phase: 0 },
    { x: 880, y: 260, color: '#fbbf24', phase: 1.6 },
    { x: 1340, y: 440, color: '#38bdf8', phase: 3.2 }
  ]

  // Cute hopping meadow bunny rabbits
  const bunnies = [
    { x: 340, y: 740, minX: 290, maxX: 460, dir: 1, timer: 0 },
    { x: 740, y: 220, minX: 680, maxX: 850, dir: -1, timer: 1800 }
  ]

  // Friendly singing birds
  const songbirds = [
    { x: 1165, y: 72, color: '#38bdf8', belly: '#fef08a', beak: '#f97316' },
    { x: 130, y: 795, color: '#f43f5e', belly: '#fed7aa', beak: '#fbbf24' }
  ]

  // Magical storybook fairy mushrooms with white polka dots
  const fairyMushrooms = [
    { x: 390, y: 350, r: 10, color: '#ef4444' },
    { x: 405, y: 355, r: 7, color: '#f43f5e' },
    { x: 1000, y: 380, r: 9, color: '#8b5cf6' },
    { x: 1012, y: 385, r: 6, color: '#ec4899' },
    { x: 1625, y: 490, r: 11, color: '#ef4444' },
    { x: 895, y: 695, r: 8, color: '#f59e0b' }
  ]

  // Generate ambient floating sunlight motes
  for (let i = 0; i < 35; i++) {
    ambientMotes.push({
      x: Math.random() * WORLD.width,
      y: Math.random() * WORLD.height,
      vx: 10 + Math.random() * 20,
      vy: -15 - Math.random() * 25,
      size: 1.5 + Math.random() * 2.5,
      alpha: 0.2 + Math.random() * 0.5
    })
  }

  const canvas = document.querySelector('#game-world')
  const ctx = canvas.getContext('2d')
  const controllerStatus = document.querySelector('#controller-status span:last-child')
  const challenge = document.querySelector('#challenge')
  const celebration = document.querySelector('#celebration')
  const micIndicator = document.querySelector('#mic-indicator')
  const micLabel = document.querySelector('#mic-label')
  const feedback = document.querySelector('#feedback')
  const scoreOutput = document.querySelector('#score')
  const foundOutput = document.querySelector('#found-count')
  const progressBar = document.querySelector('#progress-bar')
  const progressFill = document.querySelector('#progress-fill')
  const levelLabel = document.querySelector('#level-label')
  const areaName = document.querySelector('#area-name')
  const playerTag = document.querySelector('#player-tag')
  const audioBanner = document.querySelector('#audio-banner')

  const params = new URLSearchParams(window.location.search)
  const playerName = params.get('player') || ''

  // Selected adventure map / biome chosen from star unlocks
  const mapParam = (params.get('map') || params.get('biome') || '').toLowerCase().trim()
  if (mapParam) {
    const biomeIdx = BIOMES.findIndex((b) => b.id === mapParam || b.id.includes(mapParam) || mapParam.includes(b.id))
    if (biomeIdx >= 0) {
      setBiome(biomeIdx)
    }
  } else if (areaName && BIOMES[currentBiomeIndex]) {
    areaName.textContent = BIOMES[currentBiomeIndex].badge
  }

  // Student gender detection (strictly driven by student profile)
  const rawGender = (params.get('gender') || '').trim().toLowerCase()
  const playerGender = rawGender === 'female' ? 'female' : 'male'

  function updatePlayerTag() {
    const role = playerGender === 'female' ? 'Girl Explorer' : 'Boy Explorer'
    playerTag.textContent = playerName ? `${playerName}'s ${role}` : role
  }
  updatePlayerTag()

  function hideAudioBanner() {
    if (audioBanner) audioBanner.classList.add('hidden-audio')
  }

  function activateAudio() {
    initAudio()
    if (audioCtx && audioCtx.state === 'running') {
      hideAudioBanner()
    }
  }

  if (audioBanner) {
    audioBanner.addEventListener('click', () => {
      activateAudio()
      hideAudioBanner()
    })
  }

  const rawWordsParam = params.get('words') || ''
  const passedWords = rawWordsParam.split('|').map((w) => w.trim().toUpperCase()).filter(Boolean)
  const QUEST_POSITIONS = [
    { x: 380, y: 160 },
    { x: 800, y: 440 },
    { x: 1430, y: 160 },
    { x: 590, y: 1000 },
    { x: 1640, y: 1000 },
  ]
  const WORD_ICONS = {
    APPLE: '🍎', BALL: '⚽', CAT: '🐱', DOG: '🐶', FISH: '🐟', SUN: '☀️', TREE: '🌳', STAR: '⭐',
    CAR: '🚗', CUP: '☕', HAT: '🎩', BOOK: '📖', BIRD: '🐦', DUCK: '🦆', BOAT: '⛵', BEAR: '🐻',
    SOCK: '🧦', SOAP: '🧼', SNAKE: '🐍', PIG: '🐷', PAN: '🍳', PIZZA: '🍕', PENCIL: '✏️', POT: '🍯',
    ROOSTER: '🐓', RAINBOW: '🌈', RACE: '🏎️', ROAR: '🦁', DOOR: '🚪', BATH: '🛁'
  }
  if (passedWords.length > 0) {
    const count = Math.min(QUEST_POSITIONS.length, passedWords.length)
    const dynamicObjects = passedWords.slice(0, count).map((w, idx) => ({
      word: w,
      icon: WORD_ICONS[w] || '⭐',
      x: QUEST_POSITIONS[idx].x,
      y: QUEST_POSITIONS[idx].y,
    }))
    levels.s.objects = dynamicObjects
    levels.p.objects = dynamicObjects
    levels.b.objects = dynamicObjects
  }

  let currentLevel = 's'
  let currentTarget = null
  let score = 0
  let lastFrame = 0
  let viewWidth = 800
  let viewHeight = 520
  let scale = 1
  let isCelebrating = false
  let evaluationPending = false
  let speechReady = false

  function setMovement(x, y) {
    const magnitude = Math.hypot(x, y)
    if (magnitude > 1) { x /= magnitude; y /= magnitude }
    movement.x = x
    movement.y = y
    if (magnitude > 0.1) {
      if (Math.abs(x) > Math.abs(y) * 0.65) player.face = x < 0 ? -1 : 1
    }
  }

  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return

    if (event.data?.type === 'SPEECH_QUEST_UNLOCK_AUDIO' || event.data?.type === 'SPEECH_QUEST_DEVICE_POSITION') {
      activateAudio()
    }

    if (event.data?.type === 'SPEECH_QUEST_SET_MAP' || event.data?.type === 'SET_MAP' || event.data?.type === 'SET_BIOME') {
      const mapKey = String(event.data.map || event.data.biome || '').toLowerCase().trim()
      const biomeIdx = BIOMES.findIndex((b) => b.id === mapKey || b.id.includes(mapKey) || mapKey.includes(b.id))
      if (biomeIdx >= 0) {
        setBiome(biomeIdx)
      }
      return
    }

    if (event.data?.type === 'SPEECH_QUEST_SPEAK_READY') {
      if (!currentTarget || challenge.hidden || evaluationPending) return
      speechReady = true
      micLabel.textContent = 'STARTING MICROPHONE…'
      feedback.textContent = 'The device is recording your voice…'
      requestDeviceRecording()
      return
    }
    if (event.data?.type === 'SPEECH_QUEST_RECOGNITION_STATUS') {
      if (event.data.state === 'EVALUATING') {
        micIndicator.dataset.state = 'evaluating'
        micLabel.textContent = 'EVALUATING…'
        feedback.textContent = 'Checking pronunciation…'
      } else if (event.data.state === 'LISTENING') {
        micIndicator.dataset.state = 'listening'
        micLabel.textContent = 'LISTENING…'
        feedback.textContent = 'Speak clearly into the microphone…'
      }
      return
    }
    if (event.data?.type === 'SPEECH_QUEST_EVALUATION_RESULT') {
      if (!evaluationPending || !currentTarget || event.data.word !== currentTarget.word) return
      evaluationPending = false
      if (event.data.error || typeof event.data.correct !== 'boolean') {
        speechReady = false
        micIndicator.dataset.state = 'waiting'
        micLabel.textContent = 'GET READY…'
        feedback.className = 'feedback'
        feedback.textContent = event.data.error || 'Could not evaluate word. Please try again.'
        sendQuestStatus('TRY_AGAIN')
        return
      }
      finishEvaluation(
        String(event.data.said || ''),
        event.data.correct
      )
      return
    }
    if (event.data?.type === 'SPEECH_QUEST_MOVE') {
      const dx = Number(event.data.dx) || 0
      const dy = Number(event.data.dy) || 0
      moveByOffset(dx, dy)
      return
    }
    if (event.data?.type !== 'SPEECH_QUEST_DEVICE_POSITION') return
    const gridX = Number(event.data.x)
    const gridY = Number(event.data.y)
    if (!Number.isInteger(gridX) || !Number.isInteger(gridY) || gridX < 0 || gridX > 7 || gridY < 0 || gridY > 3) return
    enqueueGridStep(gridX, gridY)
    controllerStatus.textContent = 'ESP32 JOYSTICK CONNECTED'

    // If audio is suspended and joystick event arrives, try to resume
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        if (soundEnabled && !bgmPlaying) startBgm()
        hideAudioBanner()
      }).catch(() => {})
    }
  })
  
  // Movement is driven by the ESP32 IoT joystick device or keyboard controls
  // Queued cleanly with zero lag and strict water/pond collision prevention.
  const MAX_QUEUED_STEPS = 2
  function enqueueGridStep(gridX, gridY) {
    // Enforce strict 4-way orthogonal movement: Up, Down, Left, Right ONLY.
    // If both X and Y changed simultaneously, resolve to dominant cardinal axis.
    const diffX = gridX - currentGridX
    const diffY = gridY - currentGridY
    if (diffX !== 0 && diffY !== 0) {
      if (Math.abs(diffX) >= Math.abs(diffY)) {
        gridY = currentGridY
      } else {
        gridX = currentGridX
      }
    }

    if (isWaterGrid(gridX, gridY)) return
    const target = gridPosition(gridX, gridY)
    if (isWater(target.x, target.y, 10)) return

    currentGridX = gridX
    currentGridY = gridY

    const last = waypoints.length
      ? waypoints[waypoints.length - 1]
      : { x: player.targetX, y: player.targetY }
    if (last.x === target.x && last.y === target.y) return
    const idle = Math.hypot(player.targetX - player.x, player.targetY - player.y) <= 1.5
    if (idle && waypoints.length === 0) {
      player.targetX = target.x
      player.targetY = target.y
      return
    }
    waypoints.push(target)
    while (waypoints.length > MAX_QUEUED_STEPS) waypoints.shift()
  }

  function moveByOffset(dx, dy) {
    if (!challenge.hidden || !celebration.hidden || isCelebrating) return
    // Strict 4-way orthogonal: strictly Up, Down, Left, or Right
    if (dx !== 0 && dy !== 0) {
      if (Math.abs(dx) >= Math.abs(dy)) dy = 0
      else dx = 0
    }
    const nextX = Math.max(0, Math.min(7, currentGridX + dx))
    const nextY = Math.max(0, Math.min(3, currentGridY + dy))
    if (nextX === currentGridX && nextY === currentGridY) return
    if (isWaterGrid(nextX, nextY)) {
      // Trying to walk into the pond: strictly blocked!
      dustPuffs.push({ x: player.x, y: player.y, life: 1, maxLife: 0.35, size: 14 })
      return
    }
    enqueueGridStep(nextX, nextY)
  }

  window.addEventListener('keydown', (e) => {
    if (!challenge.hidden || !celebration.hidden || isCelebrating) return
    const key = e.key
    const code = e.code
    if (key === 'ArrowUp' || code === 'KeyW' || key === 'w' || key === 'W') {
      moveByOffset(0, -1)
    } else if (key === 'ArrowDown' || code === 'KeyS' || key === 's' || key === 'S') {
      moveByOffset(0, 1)
    } else if (key === 'ArrowLeft' || code === 'KeyA' || key === 'a' || key === 'A') {
      moveByOffset(-1, 0)
    } else if (key === 'ArrowRight' || code === 'KeyD' || key === 'd' || key === 'D') {
      moveByOffset(1, 0)
    }
  })

  if (window.parent === window) {
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = window.location.hostname || 'localhost'
    const directSocket = new WebSocket(`${wsProto}//${wsHost}:4000/client-ws`)

    directSocket.addEventListener('open', () => {
      directSocket.send(JSON.stringify({ type: 'CMD_SET_MODE', mode: 'GARDEN' }))
    })

    directSocket.addEventListener('message', (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'JOYSTICK_GARDEN') {
          const gridX = Number(msg.x)
          const gridY = Number(msg.y)
          if (Number.isInteger(gridX) && Number.isInteger(gridY) && gridX >= 0 && gridX <= 7 && gridY >= 0 && gridY <= 3) {
            enqueueGridStep(gridX, gridY)
            controllerStatus.textContent = 'ESP32 JOYSTICK CONNECTED'
            if (audioCtx && audioCtx.state === 'suspended') {
              audioCtx.resume().then(() => {
                if (soundEnabled && !bgmPlaying) startBgm()
                hideAudioBanner()
              }).catch(() => {})
            }
          }
        } else if (msg.type === 'SPEECH_RECORDING_SAVED') {
          const recording = msg.recording
          if (recording && currentTarget) {
            evaluationPending = false
            const said = String(recording.transcript || '')
            const isCorrect = recording.is_correct === true || recording.is_correct === 1 || recording.isCorrect === true
            finishEvaluation(said, isCorrect)
          }
        }
      } catch {}
    })

    window._directSocket = directSocket
  }

  window.parent.postMessage({ type: 'SPEECH_QUEST_READY' }, window.location.origin)

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.max(1, Math.round(rect.width * dpr))
    canvas.height = Math.max(1, Math.round(rect.height * dpr))
    scale = rect.width / 800
    viewWidth = rect.width / scale
    viewHeight = rect.height / scale
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0)
  }
  new ResizeObserver(resizeCanvas).observe(canvas)
  window.addEventListener('resize', resizeCanvas)
  resizeCanvas()

  function roundedRect(x, y, w, h, r) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
  }

  // --- DRAWING FUNCTIONS ---

  // Distinct Architecture for each of the 6 Adventure Biomes
  function drawHouse(house, now, biome) {
    const { x, y, w, h } = house
    const bId = biome.id

    // Drop shadow
    ctx.fillStyle = bId === 'galaxy' ? 'rgba(5, 2, 25, 0.45)' : 'rgba(15, 51, 40, 0.24)'
    ctx.beginPath()
    ctx.ellipse(x + w / 2, y + h + 8, w * 0.58, 14, 0, 0, Math.PI * 2)
    ctx.fill()

    if (bId === 'candy') {
      // --- SUGARPLUM SUMMIT: GINGERBREAD COTTAGE ---
      // Gingerbread Cookie Wall
      ctx.fillStyle = '#854d0e'
      roundedRect(x, y + 36, w, h - 46, 14); ctx.fill()
      ctx.fillStyle = '#a16207'
      roundedRect(x + 4, y + 40, w - 8, h - 54, 10); ctx.fill()

      // Royal Icing Corner Piping
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(x + 8, y + 42, 6, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + w - 8, y + 42, 6, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + 8, y + h - 14, 6, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + w - 8, y + h - 14, 6, 0, Math.PI * 2); ctx.fill()

      // Cotton Candy Marshmallow Chimney
      ctx.fillStyle = '#fce7f3'
      roundedRect(x + w - 38, y - 6, 22, 45, 6); ctx.fill()
      ctx.fillStyle = '#f472b6'
      roundedRect(x + w - 41, y - 8, 28, 8, 4); ctx.fill()
      // Rising sweet cotton-candy smoke puffs
      for (let s = 0; s < 3; s++) {
        const age = (now / 900 + s * 1.2) % 3.6
        const sx = (x + w - 27) + Math.sin(age * 2) * 9
        const sy = (y - 12) - age * 22
        const sr = 7 + age * 6
        ctx.fillStyle = `rgba(244, 114, 182, ${Math.max(0, 0.45 - age * 0.12)})`
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill()
      }

      // Frosted Roof with Royal Icing Drips
      ctx.fillStyle = '#ec4899'
      ctx.beginPath()
      ctx.moveTo(x - 16, y + 42)
      ctx.lineTo(x + w / 2, y - 20)
      ctx.lineTo(x + w + 16, y + 42)
      ctx.closePath(); ctx.fill()

      // Alternating Peppermint Roof Stripes
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x - 16, y + 42); ctx.lineTo(x + w / 2, y - 20); ctx.lineTo(x + w + 16, y + 42); ctx.closePath()
      ctx.clip()
      for (let s = -30; s < w + 40; s += 24) {
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.moveTo(x + s, y + 45)
        ctx.lineTo(x + s + 12, y + 45)
        ctx.lineTo(x + w / 2, y - 20)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()

      // Dripping White Marshmallow Icicles
      ctx.fillStyle = '#ffffff'
      for (let d = x - 12; d < x + w + 12; d += 16) {
        const dripLen = 8 + (Math.sin(d * 1.7) * 5 + 5)
        ctx.beginPath()
        ctx.arc(d, y + 42, 6, Math.PI, 0)
        ctx.lineTo(d, y + 42 + dripLen)
        ctx.arc(d, y + 42 + dripLen, 3, 0, Math.PI)
        ctx.closePath(); ctx.fill()
      }

      // Center Giant Peppermint Swirl Candy Wheel
      const pcX = x + w / 2, pcY = y + 16
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(pcX, pcY, 14, 0, Math.PI * 2); ctx.fill()
      for (let p = 0; p < 6; p++) {
        ctx.fillStyle = p % 2 === 0 ? '#ef4444' : '#ffffff'
        ctx.beginPath()
        ctx.moveTo(pcX, pcY)
        ctx.arc(pcX, pcY, 13, p * Math.PI / 3, (p + 1) * Math.PI / 3)
        ctx.closePath(); ctx.fill()
      }
      ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(pcX, pcY, 14, 0, Math.PI * 2); ctx.stroke()

      // Sugar Wafer Door with Gumdrop Knob
      ctx.fillStyle = '#fde68a'
      roundedRect(x + w * 0.40, y + h - 56, 34, 52, [14, 14, 3, 3]); ctx.fill()
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2
      roundedRect(x + w * 0.40, y + h - 56, 34, 52, [14, 14, 3, 3]); ctx.stroke()
      // Gumdrop knob
      ctx.fillStyle = '#38bdf8'
      ctx.beginPath(); ctx.arc(x + w * 0.40 + 7, y + h - 28, 4, 0, Math.PI * 2); ctx.fill()

      // Caramel Glow Windows
      const winPositions = [x + 16, x + w - 44]
      winPositions.forEach(wx => {
        ctx.fillStyle = '#fef08a'
        roundedRect(wx, y + 54, 26, 26, 6); ctx.fill()
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3
        roundedRect(wx, y + 54, 26, 26, 6); ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(wx + 13, y + 54); ctx.lineTo(wx + 13, y + 80)
        ctx.moveTo(wx, y + 67); ctx.lineTo(wx + 26, y + 67)
        ctx.stroke()
      })

    } else if (bId === 'autumn') {
      // --- PINECONE POINT: RUSTIC TIMBER LOG CABIN ---
      // Stacked Interlocking Timber Logs
      const numLogs = 5
      const logHeight = (h - 46) / numLogs
      for (let i = 0; i < numLogs; i++) {
        const ly = y + 36 + i * logHeight
        ctx.fillStyle = i % 2 === 0 ? '#78350f' : '#92400e'
        roundedRect(x - 4, ly, w + 8, logHeight + 1, 4); ctx.fill()
        // Round end cut notch on logs
        ctx.fillStyle = '#b45309'
        ctx.beginPath(); ctx.ellipse(x - 2, ly + logHeight / 2, 4, logHeight * 0.45, 0, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.ellipse(x + w + 2, ly + logHeight / 2, 4, logHeight * 0.45, 0, 0, Math.PI * 2); ctx.fill()
      }

      // Stone Hearth Chimney
      ctx.fillStyle = '#475569'
      roundedRect(x + w - 38, y - 8, 24, 48, 4); ctx.fill()
      ctx.fillStyle = '#64748b'
      roundedRect(x + w - 40, y - 10, 28, 8, 3); ctx.fill()
      // Animated cozy woodfire smoke
      for (let s = 0; s < 3; s++) {
        const age = (now / 1100 + s * 1.3) % 3.6
        const sx = (x + w - 26) + Math.sin(age * 2) * 8
        const sy = (y - 14) - age * 22
        const sr = 6 + age * 5
        ctx.fillStyle = `rgba(254, 243, 199, ${Math.max(0, 0.45 - age * 0.12)})`
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill()
      }

      // Cedar Shake Amber Shingle Roof
      ctx.fillStyle = '#451a03'
      ctx.beginPath()
      ctx.moveTo(x - 18, y + 42); ctx.lineTo(x + w / 2, y - 20); ctx.lineTo(x + w + 18, y + 42); ctx.closePath(); ctx.fill()
      ctx.strokeStyle = '#b45309'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(x - 12, y + 38); ctx.lineTo(x + w / 2, y - 16); ctx.stroke()

      // Wooden Plank Door
      ctx.fillStyle = '#542d13'
      roundedRect(x + w * 0.42, y + h - 56, 32, 52, [10, 10, 2, 2]); ctx.fill()
      // Brass handle
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath(); ctx.arc(x + w * 0.42 + 6, y + h - 28, 3, 0, Math.PI * 2); ctx.fill()

      // Hanging Amber Lantern
      const lanX = x + w * 0.42 - 12, lanY = y + h - 36
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(lanX, lanY - 8); ctx.lineTo(lanX, lanY); ctx.stroke()
      ctx.fillStyle = '#fbbf24'
      roundedRect(lanX - 4, lanY, 8, 10, 2); ctx.fill()
      ctx.fillStyle = 'rgba(251, 191, 36, 0.35)'
      ctx.beginPath(); ctx.arc(lanX, lanY + 5, 14, 0, Math.PI * 2); ctx.fill()

      // Warm Golden Hearth Windows
      const winPositions = [x + 16, x + w - 44]
      winPositions.forEach(wx => {
        ctx.fillStyle = '#fef08a'
        roundedRect(wx, y + 54, 26, 26, 4); ctx.fill()
        ctx.strokeStyle = '#291b12'; ctx.lineWidth = 2.5
        roundedRect(wx, y + 54, 26, 26, 4); ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(wx + 13, y + 54); ctx.lineTo(wx + 13, y + 80)
        ctx.moveTo(wx, y + 67); ctx.lineTo(wx + 26, y + 67)
        ctx.stroke()
      })

    } else if (bId === 'tropical') {
      // --- SUNKEN PEARL COVE: BAMBOO TIKI HUT ---
      // Bamboo Stilt Foundation
      ctx.fillStyle = '#d97706'
      roundedRect(x + 10, y + h - 16, 12, 20, 3); ctx.fill()
      roundedRect(x + w - 22, y + h - 16, 12, 20, 3); ctx.fill()
      roundedRect(x + w / 2 - 6, y + h - 16, 12, 20, 3); ctx.fill()
      // Deck Platform
      ctx.fillStyle = '#b45309'
      roundedRect(x - 6, y + h - 18, w + 12, 10, 3); ctx.fill()

      // Bamboo Cane Walls
      ctx.fillStyle = '#fde68a'
      roundedRect(x, y + 36, w, h - 54, 8); ctx.fill()
      ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.5
      for (let bx = x + 8; bx < x + w; bx += 8) {
        ctx.beginPath(); ctx.moveTo(bx, y + 36); ctx.lineTo(bx, y + h - 18); ctx.stroke()
      }

      // Thatched Palm Frond Layered Roof
      const thatchColors = ['#92400e', '#b45309', '#d97706', '#f59e0b']
      for (let t = 0; t < 4; t++) {
        const ty = y - 18 + t * 14
        const tw = w + 36 - t * 6
        ctx.fillStyle = thatchColors[t]
        ctx.beginPath()
        ctx.moveTo(x + w / 2 - tw / 2, ty + 16)
        ctx.lineTo(x + w / 2, ty - 10)
        ctx.lineTo(x + w / 2 + tw / 2, ty + 16)
        // Jagged straw fringe
        for (let j = x + w / 2 + tw / 2; j >= x + w / 2 - tw / 2; j -= 10) {
          ctx.lineTo(j, ty + 20 + (j % 6 === 0 ? 5 : 0))
        }
        ctx.closePath(); ctx.fill()
      }

      // Propped Colorful Surfboard on Wall
      ctx.save()
      ctx.translate(x + 12, y + h - 22)
      ctx.rotate(-0.18)
      ctx.fillStyle = '#f43f5e'
      roundedRect(-6, -48, 14, 50, 7); ctx.fill()
      ctx.fillStyle = '#ffffff'
      roundedRect(-1, -48, 4, 50, 2); ctx.fill()
      ctx.restore()

      // Bamboo Tiki Torch with Animated Flame
      const torchX = x + w + 16, torchY = y + h - 35
      ctx.fillStyle = '#78350f'
      roundedRect(torchX - 3, torchY, 6, 38, 2); ctx.fill()
      // Flame
      const flameFlicker = Math.sin(now / 80) * 2
      ctx.fillStyle = '#f97316'
      ctx.beginPath()
      ctx.moveTo(torchX - 5, torchY)
      ctx.quadraticCurveTo(torchX, torchY - 14 + flameFlicker, torchX + 5, torchY)
      ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#fef08a'
      ctx.beginPath()
      ctx.arc(torchX, torchY - 2, 3.5, 0, Math.PI * 2); ctx.fill()

      // Arched Open Bamboo Entryway
      ctx.fillStyle = '#78350f'
      roundedRect(x + w * 0.44, y + h - 60, 32, 44, [16, 16, 0, 0]); ctx.fill()

    } else if (bId === 'frosty') {
      // --- SNOWFLAKE RIDGE: ALPINE SNOW CHALET ---
      // Frosted Blue Timber Clapboard Walls
      ctx.fillStyle = '#0284c7'
      roundedRect(x, y + 36, w, h - 46, 10); ctx.fill()
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5
      for (let sy = y + 42; sy < y + h - 12; sy += 8) {
        ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x + w, sy); ctx.stroke()
      }

      // Stone Chimney with Frosted Cap
      ctx.fillStyle = '#334155'
      roundedRect(x + w - 38, y - 8, 22, 45, 4); ctx.fill()
      ctx.fillStyle = '#f8fafc'
      roundedRect(x + w - 41, y - 12, 28, 8, 4); ctx.fill() // Heavy snow on chimney

      // Steep Chalet Timber Roof
      ctx.fillStyle = '#0c4a6e'
      ctx.beginPath()
      ctx.moveTo(x - 20, y + 42); ctx.lineTo(x + w / 2, y - 22); ctx.lineTo(x + w + 20, y + 42); ctx.closePath(); ctx.fill()

      // Thick 14px Fluffy White Snow Blanket
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(x - 22, y + 42)
      ctx.lineTo(x + w / 2, y - 26)
      ctx.lineTo(x + w + 22, y + 42)
      ctx.lineTo(x + w + 22, y + 32)
      ctx.lineTo(x + w / 2, y - 36)
      ctx.lineTo(x - 22, y + 32)
      ctx.closePath(); ctx.fill()
      // Snow shading
      ctx.fillStyle = '#bae6fd'
      ctx.beginPath()
      ctx.moveTo(x - 22, y + 42); ctx.lineTo(x + w + 22, y + 42)
      ctx.lineTo(x + w + 22, y + 37); ctx.lineTo(x - 22, y + 37)
      ctx.closePath(); ctx.fill()

      // Dripping Crystalline Icicles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
      for (let ic = x - 16; ic < x + w + 16; ic += 12) {
        const icLen = 6 + (Math.sin(ic * 2.3) * 6 + 6)
        ctx.beginPath()
        ctx.moveTo(ic - 2.5, y + 42)
        ctx.lineTo(ic, y + 42 + icLen)
        ctx.lineTo(ic + 2.5, y + 42)
        ctx.closePath(); ctx.fill()
      }

      // Wooden Chalet Door with Winter Holly Wreath
      ctx.fillStyle = '#1e3a8a'
      roundedRect(x + w * 0.42, y + h - 56, 32, 52, [10, 10, 2, 2]); ctx.fill()
      // Green Holly Wreath
      const wrX = x + w * 0.42 + 16, wrY = y + h - 38
      ctx.strokeStyle = '#15803d'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(wrX, wrY, 7, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = '#ef4444'
      ctx.beginPath(); ctx.arc(wrX, wrY - 7, 2, 0, Math.PI * 2); ctx.fill()

      // Warm Golden Stained Glass Windows
      const winPositions = [x + 16, x + w - 44]
      winPositions.forEach(wx => {
        ctx.fillStyle = '#fef08a'
        roundedRect(wx, y + 54, 26, 26, 4); ctx.fill()
        ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 2.5
        roundedRect(wx, y + 54, 26, 26, 4); ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(wx + 13, y + 54); ctx.lineTo(wx + 13, y + 80)
        ctx.moveTo(wx, y + 67); ctx.lineTo(wx + 26, y + 67)
        ctx.stroke()
      })

    } else if (bId === 'galaxy') {
      // --- COSMIC BAY: STARBASE OBSERVATION BIODOME ---
      // Titanium Composite Base Hull
      ctx.fillStyle = '#1e1b4b'
      roundedRect(x, y + 38, w, h - 48, 16); ctx.fill()
      ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5
      roundedRect(x, y + 38, w, h - 48, 16); ctx.stroke()

      // Neon Cyan Energy Conduit Perimeter
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x + 10, y + h - 14); ctx.lineTo(x + w - 10, y + h - 14)
      ctx.stroke()

      // Glowing Power Nodes
      for (let pn = x + 18; pn < x + w; pn += 24) {
        ctx.fillStyle = '#38bdf8'
        ctx.beginPath(); ctx.arc(pn, y + h - 14, 3, 0, Math.PI * 2); ctx.fill()
      }

      // Translucent Geodesic Observation Dome Canopy
      ctx.fillStyle = 'rgba(99, 102, 241, 0.45)'
      ctx.beginPath()
      ctx.ellipse(x + w / 2, y + 38, w * 0.52, 42, 0, Math.PI, Math.PI * 2)
      ctx.closePath(); ctx.fill()
      ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 2.5
      ctx.stroke()

      // Geodesic Grid Wireframe Struts
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)'; ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x + w / 2 - 35, y + 38); ctx.lineTo(x + w / 2, y - 2)
      ctx.moveTo(x + w / 2 + 35, y + 38); ctx.lineTo(x + w / 2, y - 2)
      ctx.moveTo(x + w / 2, y + 38); ctx.lineTo(x + w / 2, y - 4)
      ctx.stroke()

      // Communications Antenna Mast with Pulsing Signal Rings
      const antX = x + w / 2, antY = y - 4
      ctx.strokeStyle = '#e0e7ff'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(antX, antY + 8); ctx.lineTo(antX, antY - 24); ctx.stroke()
      // Beacon Sphere
      const beaconGlow = 0.6 + Math.sin(now / 200) * 0.4
      ctx.fillStyle = `rgba(34, 211, 238, ${beaconGlow})`
      ctx.beginPath(); ctx.arc(antX, antY - 24, 5, 0, Math.PI * 2); ctx.fill()
      // Expanding radio wave rings
      for (let r = 0; r < 2; r++) {
        const ringPhase = (now / 1000 + r * 0.5) % 1
        ctx.strokeStyle = `rgba(34, 211, 238, ${(1 - ringPhase) * 0.6})`
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(antX, antY - 24, 6 + ringPhase * 16, -Math.PI * 0.75, -Math.PI * 0.25); ctx.stroke()
      }

      // Hydraulic Airlock Door
      ctx.fillStyle = '#0f172a'
      roundedRect(x + w * 0.40, y + h - 54, 34, 46, [8, 8, 2, 2]); ctx.fill()
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2
      roundedRect(x + w * 0.40, y + h - 54, 34, 46, [8, 8, 2, 2]); ctx.stroke()
      // Status Diamond Indicator
      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.moveTo(x + w / 2, y + h - 44)
      ctx.lineTo(x + w / 2 + 4, y + h - 40)
      ctx.lineTo(x + w / 2, y + h - 36)
      ctx.lineTo(x + w / 2 - 4, y + h - 40)
      ctx.closePath(); ctx.fill()

      // Holographic Viewport Screens
      const winPositions = [x + 16, x + w - 42]
      winPositions.forEach(wx => {
        ctx.fillStyle = '#0284c7'
        roundedRect(wx, y + 48, 24, 24, 6); ctx.fill()
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2
        roundedRect(wx, y + 48, 24, 24, 6); ctx.stroke()
      })

    } else {
      // --- CLOVERFIELD CROSSING: STORYBOOK FAIRYTALE COTTAGE ---
      // Stone Foundation
      ctx.fillStyle = '#8f9a94'
      roundedRect(x + 5, y + h - 14, w - 10, 18, 6); ctx.fill()

      // Cottage Walls
      ctx.fillStyle = '#fff5dc'
      roundedRect(x, y + 36, w, h - 46, 12); ctx.fill()
      ctx.strokeStyle = '#e2d5b6'; ctx.lineWidth = 3; ctx.stroke()

      // Chimney & rising smoke
      ctx.fillStyle = '#b84333'
      roundedRect(x + w - 38, y - 6, 22, 45, 4); ctx.fill()
      ctx.fillStyle = '#8c2e22'
      roundedRect(x + w - 41, y - 8, 28, 7, 3); ctx.fill()
      for (let s = 0; s < 3; s++) {
        const smokeAge = (now / 1000 + s * 1.2) % 3.6
        const sx = (x + w - 27) + Math.sin(smokeAge * 2) * 8
        const sy = (y - 12) - smokeAge * 20
        const sr = 6 + smokeAge * 5
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, 0.5 - smokeAge * 0.14)})`
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill()
      }

      // Shingled Roof
      ctx.fillStyle = '#e0533c'
      ctx.beginPath()
      ctx.moveTo(x - 16, y + 42); ctx.lineTo(x + w / 2, y - 18); ctx.lineTo(x + w + 16, y + 42); ctx.closePath(); ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'; ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(x - 10, y + 38); ctx.lineTo(x + w / 2, y - 14); ctx.stroke()

      // Wooden arched door
      ctx.fillStyle = '#6a3c24'
      roundedRect(x + w * 0.42, y + h - 56, 32, 52, [12, 12, 2, 2]); ctx.fill()
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath(); ctx.arc(x + w * 0.42 + 6, y + h - 28, 3, 0, Math.PI * 2); ctx.fill()

      // Glowing Windows
      const winPositions = [x + 18, x + w - 46]
      winPositions.forEach(wx => {
        ctx.fillStyle = '#fef08a'
        roundedRect(wx, y + 56, 28, 28, 6); ctx.fill()
        ctx.strokeStyle = '#5a3d28'; ctx.lineWidth = 3
        roundedRect(wx, y + 56, 28, 28, 6); ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(wx + 14, y + 56); ctx.lineTo(wx + 14, y + 84)
        ctx.moveTo(wx, y + 70); ctx.lineTo(wx + 28, y + 70)
        ctx.stroke()
      })
    }
  }

  // Distinct Foliage and Flora for each of the 6 Adventure Biomes
  function drawTree(tree, now, biome) {
    const sway = Math.sin(now / 900 + tree.x * 0.01) * 2.5
    const bId = biome.id

    // Ground Shadow
    ctx.fillStyle = bId === 'galaxy' ? 'rgba(5, 2, 25, 0.4)' : 'rgba(15, 51, 40, 0.22)'
    ctx.beginPath()
    ctx.ellipse(tree.x + 8, tree.y + tree.size * 0.85, tree.size * 0.95, tree.size * 0.32, 0, 0, Math.PI * 2)
    ctx.fill()

    if (bId === 'candy') {
      // --- SUGARPLUM SUMMIT: GIANT SWIRL LOLLIPOP TREES ---
      // White Paper Lollipop Stick
      ctx.fillStyle = '#f1f5f9'
      roundedRect(tree.x - 4, tree.y - tree.size * 0.2, 8, tree.size * 1.1, 4); ctx.fill()
      ctx.fillStyle = '#cbd5e1'
      roundedRect(tree.x - 2, tree.y - tree.size * 0.2, 3, tree.size * 1.1, 2); ctx.fill()

      // Swirl Lollipop Disk
      const popColors = [
        ['#ec4899', '#f472b6', '#ffffff'],
        ['#8b5cf6', '#c084fc', '#ffffff'],
        ['#06b6d4', '#67e8f9', '#ffffff'],
      ][tree.hue % 3]

      const lollRadius = tree.size * 1.1
      const lollY = tree.y - tree.size * 0.3 + sway * 0.5
      ctx.fillStyle = popColors[0]
      ctx.beginPath(); ctx.arc(tree.x, lollY, lollRadius, 0, Math.PI * 2); ctx.fill()

      // Spiraling Candy Blades
      for (let s = 0; s < 6; s++) {
        ctx.fillStyle = s % 2 === 0 ? popColors[1] : popColors[2]
        ctx.beginPath()
        ctx.moveTo(tree.x, lollY)
        ctx.arc(tree.x, lollY, lollRadius, s * Math.PI / 3, (s + 0.6) * Math.PI / 3)
        ctx.closePath(); ctx.fill()
      }
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(tree.x, lollY, lollRadius, 0, Math.PI * 2); ctx.stroke()

      // Sugar Gumdrop Bush at Base
      ctx.fillStyle = popColors[1]
      ctx.beginPath(); ctx.arc(tree.x + tree.size * 0.4, tree.y + tree.size * 0.82, 7, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(tree.x + tree.size * 0.4, tree.y + tree.size * 0.80, 2, 0, Math.PI * 2); ctx.fill()

    } else if (bId === 'autumn') {
      // --- PINECONE POINT: FIERY MAPLE & GOLDEN BIRCH ---
      // Timber Trunk
      ctx.fillStyle = '#5c3d2e'
      roundedRect(tree.x - 6, tree.y + tree.size * 0.25, 12, tree.size * 0.85, 4); ctx.fill()

      // Fiery Autumn Canopy
      const autumnHues = [
        ['#9a3412', '#ea580c', '#f59e0b'],
        ['#b91c1c', '#dc2626', '#f87171'],
        ['#78350f', '#d97706', '#fbbf24']
      ][tree.hue % 3]

      ctx.fillStyle = autumnHues[0]
      ctx.beginPath()
      ctx.arc(tree.x - tree.size * 0.35 + sway * 0.5, tree.y + 4, tree.size * 0.78, 0, Math.PI * 2)
      ctx.arc(tree.x + tree.size * 0.35 + sway * 0.5, tree.y + 4, tree.size * 0.78, 0, Math.PI * 2)
      ctx.arc(tree.x + sway * 0.5, tree.y - tree.size * 0.45, tree.size * 0.82, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = autumnHues[1]
      ctx.beginPath()
      ctx.arc(tree.x - tree.size * 0.25 + sway, tree.y, tree.size * 0.72, 0, Math.PI * 2)
      ctx.arc(tree.x + tree.size * 0.25 + sway, tree.y, tree.size * 0.72, 0, Math.PI * 2)
      ctx.arc(tree.x + sway, tree.y - tree.size * 0.4, tree.size * 0.75, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = autumnHues[2]
      ctx.beginPath()
      ctx.arc(tree.x - tree.size * 0.2 + sway, tree.y - tree.size * 0.45, tree.size * 0.38, 0, Math.PI * 2)
      ctx.arc(tree.x + tree.size * 0.25 + sway, tree.y - tree.size * 0.35, tree.size * 0.32, 0, Math.PI * 2)
      ctx.fill()

      // Scattered Fallen Autumn Leaves around Base
      ctx.fillStyle = autumnHues[1]
      ctx.beginPath(); ctx.ellipse(tree.x - 12, tree.y + tree.size * 0.9, 4, 2, 0.4, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(tree.x + 14, tree.y + tree.size * 0.85, 3.5, 2, -0.6, 0, Math.PI * 2); ctx.fill()

    } else if (bId === 'tropical') {
      // --- SUNKEN PEARL COVE: SLANTED COCONUT PALM ---
      // Segmented Curved Trunk
      ctx.save()
      ctx.translate(tree.x, tree.y + tree.size * 0.9)
      ctx.rotate(0.12 + Math.sin(now / 1200 + tree.x) * 0.04)
      ctx.fillStyle = '#78350f'
      for (let s = 0; s < 6; s++) {
        const sy = -s * (tree.size * 0.24)
        const sw = 10 - s * 0.8
        roundedRect(-sw / 2 + Math.sin(s * 0.5) * 4, sy - 14, sw, 14, 3); ctx.fill()
      }
      const topX = Math.sin(3) * 4
      const topY = -6 * (tree.size * 0.24)

      // Coconut Clusters
      ctx.fillStyle = '#451a03'
      ctx.beginPath(); ctx.arc(topX - 4, topY + 4, 4.5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(topX + 5, topY + 4, 4.5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(topX, topY + 7, 4, 0, Math.PI * 2); ctx.fill()

      // Spreading Tropical Palm Fronds
      const frondAngles = [-0.7, -0.3, 0.1, 0.5, 0.9, 1.3]
      frondAngles.forEach((ang) => {
        const fSway = Math.sin(now / 700 + ang * 2) * 0.08
        ctx.save()
        ctx.translate(topX, topY)
        ctx.rotate(ang + fSway)
        ctx.fillStyle = '#059669'
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.quadraticCurveTo(tree.size * 0.6, -tree.size * 0.35, tree.size * 1.1, tree.size * 0.1)
        ctx.quadraticCurveTo(tree.size * 0.6, -tree.size * 0.1, 0, 0)
        ctx.closePath(); ctx.fill()
        ctx.restore()
      })
      ctx.restore()

    } else if (bId === 'frosty') {
      // --- SNOWFLAKE RIDGE: SNOW-COVERED EVERGREEN PINES ---
      // Trunk
      ctx.fillStyle = '#451a03'
      roundedRect(tree.x - 5, tree.y + tree.size * 0.35, 10, tree.size * 0.75, 3); ctx.fill()

      // Layered Frost Pine Branches with Heavy Snow Blankets
      const pineGreens = ['#0f766e', '#134e4a', '#064e3b']
      for (let layer = 0; layer < 3; layer++) {
        const ly = tree.y - layer * (tree.size * 0.55)
        const lw = tree.size * (1.2 - layer * 0.25)
        // Green Needles
        ctx.fillStyle = pineGreens[layer]
        ctx.beginPath()
        ctx.moveTo(tree.x + sway * 0.4, ly - tree.size * 0.75)
        ctx.lineTo(tree.x + lw, ly)
        ctx.lineTo(tree.x - lw, ly)
        ctx.closePath(); ctx.fill()

        // Heavy Pillowy White Snow Cap on branch shelf
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.moveTo(tree.x - lw, ly)
        ctx.quadraticCurveTo(tree.x - lw * 0.5, ly - 7, tree.x + sway * 0.4, ly - tree.size * 0.5)
        ctx.quadraticCurveTo(tree.x + lw * 0.5, ly - 7, tree.x + lw, ly)
        ctx.quadraticCurveTo(tree.x, ly + 5, tree.x - lw, ly)
        ctx.closePath(); ctx.fill()
      }

      // Little Red Winter Berries
      ctx.fillStyle = '#ef4444'
      ctx.beginPath(); ctx.arc(tree.x + 8, tree.y - 4, 3, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(tree.x - 10, tree.y + 12, 3, 0, Math.PI * 2); ctx.fill()

    } else if (bId === 'galaxy') {
      // --- COSMIC BAY: ALIEN CRYSTAL ENERGY SPIRES ---
      const spireH = tree.size * 1.5
      const spireW = tree.size * 0.6
      const levitate = Math.sin(now / 500 + tree.x * 0.05) * 4

      // Glowing Ground Energy Ring
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.ellipse(tree.x, tree.y + tree.size * 0.85, tree.size * 0.6, 6, 0, 0, Math.PI * 2); ctx.stroke()

      // Levitating Faceted Crystal Spire
      ctx.save()
      ctx.translate(tree.x, tree.y + levitate)
      // Left Facet (Deep Violet)
      ctx.fillStyle = '#4338ca'
      ctx.beginPath()
      ctx.moveTo(0, -spireH / 2)
      ctx.lineTo(-spireW / 2, spireH * 0.2)
      ctx.lineTo(0, spireH * 0.55)
      ctx.closePath(); ctx.fill()
      // Right Facet (Bright Cyan)
      ctx.fillStyle = '#06b6d4'
      ctx.beginPath()
      ctx.moveTo(0, -spireH / 2)
      ctx.lineTo(spireW / 2, spireH * 0.2)
      ctx.lineTo(0, spireH * 0.55)
      ctx.closePath(); ctx.fill()
      // Center Ridge Highlight
      ctx.strokeStyle = '#e0e7ff'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(0, -spireH / 2); ctx.lineTo(0, spireH * 0.55); ctx.stroke()

      // 3 Floating Orbiting Mini Shards
      for (let s = 0; s < 3; s++) {
        const sAng = now / 800 + s * (Math.PI * 2 / 3) + tree.x
        const sx = Math.cos(sAng) * (spireW * 0.9)
        const sy = Math.sin(sAng) * 8
        ctx.fillStyle = '#a855f7'
        ctx.beginPath()
        ctx.moveTo(sx, sy - 6); ctx.lineTo(sx + 3, sy); ctx.lineTo(sx, sy + 6); ctx.lineTo(sx - 3, sy); ctx.closePath(); ctx.fill()
      }
      ctx.restore()

    } else {
      // --- CLOVERFIELD CROSSING: CLASSIC STORYBOOK APPLE OAKS ---
      ctx.fillStyle = '#5c3d2e'
      roundedRect(tree.x - 6, tree.y + tree.size * 0.25, 12, tree.size * 0.85, 4); ctx.fill()

      if (tree.type === 'pine') {
        const pineGreens = ['#1d5b3a', '#247048', '#2e8b58']
        for (let layer = 0; layer < 3; layer++) {
          const ly = tree.y - layer * (tree.size * 0.55)
          const lw = tree.size * (1.2 - layer * 0.25)
          ctx.fillStyle = pineGreens[layer]
          ctx.beginPath()
          ctx.moveTo(tree.x + sway * (layer + 1) * 0.3, ly - tree.size * 0.75)
          ctx.lineTo(tree.x + lw, ly)
          ctx.lineTo(tree.x - lw, ly)
          ctx.closePath(); ctx.fill()
        }
      } else {
        const leafTones = biome.treeFoliage[tree.hue % biome.treeFoliage.length]
        ctx.fillStyle = leafTones[0]
        ctx.beginPath()
        ctx.arc(tree.x - tree.size * 0.35 + sway * 0.5, tree.y + 4, tree.size * 0.78, 0, Math.PI * 2)
        ctx.arc(tree.x + tree.size * 0.35 + sway * 0.5, tree.y + 4, tree.size * 0.78, 0, Math.PI * 2)
        ctx.arc(tree.x + sway * 0.5, tree.y - tree.size * 0.45, tree.size * 0.82, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = leafTones[1]
        ctx.beginPath()
        ctx.arc(tree.x - tree.size * 0.25 + sway, tree.y, tree.size * 0.72, 0, Math.PI * 2)
        ctx.arc(tree.x + tree.size * 0.25 + sway, tree.y, tree.size * 0.72, 0, Math.PI * 2)
        ctx.arc(tree.x + sway, tree.y - tree.size * 0.4, tree.size * 0.75, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = leafTones[2]
        ctx.beginPath()
        ctx.arc(tree.x - tree.size * 0.2 + sway, tree.y - tree.size * 0.45, tree.size * 0.38, 0, Math.PI * 2)
        ctx.arc(tree.x + tree.size * 0.25 + sway, tree.y - tree.size * 0.35, tree.size * 0.32, 0, Math.PI * 2)
        ctx.fill()

        if (tree.hasApples) {
          ctx.fillStyle = '#ef4444'
          const appleOffsets = [
            [-tree.size * 0.4, tree.size * 0.1],
            [tree.size * 0.35, -tree.size * 0.1],
            [0, -tree.size * 0.55],
            [-tree.size * 0.15, -tree.size * 0.2]
          ]
          appleOffsets.forEach(([ox, oy]) => {
            ctx.beginPath(); ctx.arc(tree.x + ox + sway * 0.8, tree.y + oy, 4.5, 0, Math.PI * 2); ctx.fill()
          })
        }
      }
    }
  }

  function drawFlower(flower, now) {
    const sway = Math.sin(now / 600 + flower.x * 0.05) * 1.5
    ctx.save()
    ctx.translate(flower.x + sway, flower.y)
    ctx.scale(flower.scale, flower.scale)

    if (flower.type === 'daisy') {
      ctx.fillStyle = '#ffffff'
      for (let p = 0; p < 5; p++) {
        const ang = p * Math.PI * 2 / 5
        ctx.beginPath(); ctx.ellipse(Math.cos(ang) * 4.5, Math.sin(ang) * 4.5, 3.5, 2, ang, 0, Math.PI * 2); ctx.fill()
      }
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill()
    } else if (flower.type === 'poppy') {
      ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#881337'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill()
    } else if (flower.type === 'lavender') {
      ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.ellipse(0, -3, 3, 5, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#c084fc'; ctx.beginPath(); ctx.arc(0, -6, 2.5, 0, Math.PI * 2); ctx.fill()
    } else {
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#d97706'; ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  function drawRainbow(now) {
    const cx = 900, cy = 420, r = 780
    const colors = [
      'rgba(244, 63, 94, 0.18)',
      'rgba(251, 146, 60, 0.18)',
      'rgba(250, 204, 21, 0.18)',
      'rgba(74, 222, 128, 0.18)',
      'rgba(56, 189, 248, 0.18)',
      'rgba(168, 85, 247, 0.18)'
    ]
    ctx.lineWidth = 14
    colors.forEach((col, i) => {
      ctx.strokeStyle = col
      ctx.beginPath()
      ctx.arc(cx, cy, r + i * 13, Math.PI * 1.08, Math.PI * 1.92)
      ctx.stroke()
    })
  }

  function drawDuckFamily(now) {
    const cx = water.x - 10, cy = water.y - 5
    const a = water.rx * 0.52, b = water.ry * 0.48
    const baseT = now / 5200

    const ducks = [
      { t: baseT, size: 1.0, isMama: true, color: '#facc15', bill: '#fb923c' },
      { t: baseT - 0.22, size: 0.58, isMama: false, color: '#fef08a', bill: '#f97316' },
      { t: baseT - 0.40, size: 0.52, isMama: false, color: '#fef08a', bill: '#f97316' }
    ]

    ducks.forEach((duck, idx) => {
      const dx = cx + Math.cos(duck.t) * a
      const dy = cy + Math.sin(duck.t) * b
      const vx = -Math.sin(duck.t) * a
      const vy = Math.cos(duck.t) * b
      const heading = Math.atan2(vy, vx)
      const bob = Math.sin(now / 350 + idx * 1.5) * 1.8

      ctx.save()
      ctx.translate(dx, dy + bob)
      ctx.rotate(heading)
      ctx.scale(duck.size, duck.size)

      ctx.fillStyle = duck.color
      ctx.beginPath(); ctx.ellipse(-2, 0, 15, 10, 0, 0, Math.PI * 2); ctx.fill()

      // Cute upturned tail
      ctx.beginPath(); ctx.moveTo(-12, -4); ctx.lineTo(-20, -7); ctx.lineTo(-14, 2); ctx.closePath(); ctx.fill()
      // Wing
      ctx.fillStyle = duck.isMama ? '#eab308' : '#fde047'
      ctx.beginPath(); ctx.ellipse(-2, -1, 9, 5, -0.15, 0, Math.PI * 2); ctx.fill()
      // Head & Bill
      const headBob = Math.sin(now / 220 + idx) * 1.2
      ctx.fillStyle = duck.color
      ctx.beginPath(); ctx.arc(8 + headBob, -4, 7.5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = duck.bill
      ctx.beginPath(); ctx.ellipse(16 + headBob, -3, 5, 2.8, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#1e293b'
      ctx.beginPath(); ctx.arc(10 + headBob, -6, 2, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(10.8 + headBob, -6.8, 0.8, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    })
  }

  // Adorable sliding penguins for the Frosty Biome Ice Rink
  function drawIceSkatingPenguins(now) {
    const penguins = [
      { t: now / 3400, r: 85, color: '#0f172a', scarf: '#ef4444' },
      { t: now / 4200 + Math.PI, r: 55, color: '#1e293b', scarf: '#38bdf8' }
    ]
    penguins.forEach((pen) => {
      const px = water.x + Math.cos(pen.t) * pen.r
      const py = water.y + Math.sin(pen.t) * (pen.r * 0.6)
      const tilt = Math.sin(pen.t * 2) * 0.25

      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(tilt)

      // Ice skate shadow
      ctx.fillStyle = 'rgba(14, 116, 144, 0.3)'
      ctx.beginPath(); ctx.ellipse(0, 14, 10, 3.5, 0, 0, Math.PI * 2); ctx.fill()

      // Penguin body
      ctx.fillStyle = pen.color
      roundedRect(-9, -12, 18, 24, 9); ctx.fill()
      // White belly
      ctx.fillStyle = '#ffffff'
      roundedRect(-6, -6, 12, 16, 6); ctx.fill()
      // Red winter scarf fluttering
      ctx.fillStyle = pen.scarf
      roundedRect(-9, -7, 18, 5, 2.5); ctx.fill()
      roundedRect(4, -5, 5, 9, 2); ctx.fill()
      // Beak
      ctx.fillStyle = '#f97316'
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(5, -6); ctx.lineTo(0, -3); ctx.closePath(); ctx.fill()
      // Cute eyes
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(-3, -10, 2, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#0f172a'
      ctx.beginPath(); ctx.arc(-3, -10, 1, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    })
  }

  function drawBunnies(now) {
    bunnies.forEach((bunny, bidx) => {
      const cycle = (now + bunny.timer) % 5200
      let hopY = 0
      let squashX = 1
      let squashY = 1
      let earWiggle = Math.sin(now / 180 + bidx) * 0.12

      if (cycle > 2600 && cycle < 4600) {
        const hopProgress = ((cycle - 2600) % 650) / 650
        hopY = -Math.sin(hopProgress * Math.PI) * 16
        bunny.x += bunny.dir * 0.45
        if (bunny.x > bunny.maxX) { bunny.dir = -1; bunny.x = bunny.maxX }
        if (bunny.x < bunny.minX) { bunny.dir = 1; bunny.x = bunny.minX }

        if (hopProgress < 0.2 || hopProgress > 0.8) {
          squashX = 1.14; squashY = 0.86
        } else {
          squashX = 0.88; squashY = 1.12
        }
      }

      ctx.save()
      ctx.translate(bunny.x, bunny.y + hopY)
      ctx.scale(bunny.dir * squashX, squashY)

      ctx.fillStyle = 'rgba(15, 51, 40, 0.2)'
      ctx.beginPath(); ctx.ellipse(0, 14 - hopY * 0.5, 14 * squashX, 5, 0, 0, Math.PI * 2); ctx.fill()

      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-13, 2, 4.5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.ellipse(-2, 3, 13, 10, -0.1, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(8, -4, 9, 0, Math.PI * 2); ctx.fill()

      // Ears
      ctx.save()
      ctx.translate(4, -10); ctx.rotate(-0.25 + earWiggle)
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, -9, 4, 10, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#f9a8d4'; ctx.beginPath(); ctx.ellipse(0, -8, 2, 7, 0, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      ctx.save()
      ctx.translate(10, -10); ctx.rotate(0.05 - earWiggle)
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, -9, 4, 10, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#f9a8d4'; ctx.beginPath(); ctx.ellipse(0, -8, 2, 7, 0, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      // Eye & Nose
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(10, -5, 2.5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(11, -6, 1, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(15, -3, 1.4, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    })
  }

  function drawSongbirds(now) {
    songbirds.forEach((bird, idx) => {
      const bob = Math.sin(now / 350 + idx * 2) * 1.5
      ctx.save()
      ctx.translate(bird.x, bird.y + bob)
      ctx.fillStyle = bird.color; ctx.beginPath(); ctx.ellipse(0, 0, 8, 6, 0.2, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = bird.belly; ctx.beginPath(); ctx.ellipse(2, 2, 5, 3.5, 0.2, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = bird.color; ctx.beginPath(); ctx.arc(6, -4, 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = bird.beak; ctx.beginPath(); ctx.moveTo(10, -5); ctx.lineTo(15, -3.5); ctx.lineTo(10, -2); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(7.5, -5, 1.2, 0, Math.PI * 2); ctx.fill()

      // Floating musical note
      const notePhase = (now / 2200 + idx * 0.6) % 1
      if (notePhase < 0.75) {
        ctx.fillStyle = `rgba(251, 191, 36, ${1 - notePhase})`
        ctx.font = 'bold 11px sans-serif'
        ctx.fillText('♪', 12 + Math.sin(notePhase * 6) * 6, -10 - notePhase * 25)
      }
      ctx.restore()
    })
  }

  // --- DYNAMIC WEATHER PARTICLE SIMULATION ---
  function drawWeatherEffects(now, biome) {
    const bId = biome.id

    if (bId === 'autumn') {
      // SWIRLING FALLING AUTUMN LEAVES
      weatherParticles.forEach((p) => {
        p.y += 1.4
        p.x += Math.sin(now / 400 + p.phase) * 1.8 + 0.8
        p.rot += p.rotSpeed * 0.03
        if (p.y > WORLD.height + 20) { p.y = -20; p.x = Math.random() * WORLD.width }
        if (p.x > WORLD.width + 20) p.x = -20

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = ['#dc2626', '#ea580c', '#f59e0b', '#b45309'][Math.floor(p.phase) % 4]
        // Maple leaf shape
        ctx.beginPath()
        ctx.moveTo(0, -p.size * 2)
        ctx.quadraticCurveTo(p.size * 1.5, -p.size, p.size * 2, 0)
        ctx.quadraticCurveTo(p.size, p.size * 1.5, 0, p.size * 2)
        ctx.quadraticCurveTo(-p.size, p.size * 1.5, -p.size * 2, 0)
        ctx.quadraticCurveTo(-p.size * 1.5, -p.size, 0, -p.size * 2)
        ctx.closePath(); ctx.fill()
        ctx.restore()
      })

    } else if (bId === 'frosty') {
      // GLISTENING 6-POINT SNOWFLAKES
      weatherParticles.forEach((p) => {
        p.y += 1.2
        p.x += Math.sin(now / 500 + p.phase) * 1.2
        p.rot += p.rotSpeed * 0.015
        if (p.y > WORLD.height + 20) { p.y = -20; p.x = Math.random() * WORLD.width }
        if (p.x > WORLD.width + 20) p.x = -20

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)'
        ctx.lineWidth = 1.4
        for (let a = 0; a < 3; a++) {
          ctx.beginPath()
          ctx.moveTo(-p.size * 1.6, 0); ctx.lineTo(p.size * 1.6, 0)
          ctx.stroke()
          ctx.rotate(Math.PI / 3)
        }
        ctx.restore()
      })

    } else if (bId === 'candy') {
      // RISING SWEET SODA BUBBLES & FALLING POWDERED SUGAR CRYSTALS
      weatherParticles.forEach((p, idx) => {
        if (idx % 2 === 0) {
          // Rising bubble
          p.y -= 1.0
          p.x += Math.sin(now / 450 + p.phase) * 0.9
          if (p.y < -20) { p.y = WORLD.height + 20; p.x = Math.random() * WORLD.width }
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
          ctx.fillStyle = 'rgba(244, 114, 182, 0.25)'
          ctx.lineWidth = 1.2
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
        } else {
          // Drifting sugar crystal
          p.y += 0.8
          p.x += Math.cos(now / 500 + p.phase) * 0.6
          if (p.y > WORLD.height + 20) { p.y = -20; p.x = Math.random() * WORLD.width }
          const pulse = 0.5 + Math.sin(now / 300 + p.phase) * 0.5
          ctx.fillStyle = `rgba(254, 240, 138, ${pulse * 0.8})`
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2); ctx.fill()
        }
      })

    } else if (bId === 'galaxy') {
      // TWINKLING STARFIELD & SHOOTING STAR METEOR STREAKS
      weatherParticles.forEach((p) => {
        const twinkle = 0.35 + Math.sin(now / 250 + p.phase) * 0.65
        ctx.fillStyle = ['#ffffff', '#67e8f9', '#c084fc', '#fde047'][Math.floor(p.phase) % 4]
        ctx.globalAlpha = Math.max(0.1, twinkle)
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2); ctx.fill()
        // Diamond diffraction spikes on larger stars
        if (p.size > 3.2) {
          ctx.strokeStyle = ctx.fillStyle
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(p.x - p.size * 2, p.y); ctx.lineTo(p.x + p.size * 2, p.y)
          ctx.moveTo(p.x, p.y - p.size * 2); ctx.lineTo(p.x, p.y + p.size * 2)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      })

      // Periodic Shooting Star
      const meteorCycle = (now / 4200) % 1
      if (meteorCycle < 0.22) {
        const mt = meteorCycle / 0.22
        const startMx = 200 + ((Math.floor(now / 4200) * 431) % (WORLD.width - 400))
        const mx = startMx + mt * 280
        const my = 40 + mt * 160
        const grad = ctx.createLinearGradient(mx - 80, my - 45, mx, my)
        grad.addColorStop(0, 'rgba(34, 211, 238, 0)')
        grad.addColorStop(0.7, 'rgba(99, 102, 241, 0.6)')
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)')
        ctx.strokeStyle = grad
        ctx.lineWidth = 2.5
        ctx.beginPath(); ctx.moveTo(mx - 80, my - 45); ctx.lineTo(mx, my); ctx.stroke()
      }

    } else if (bId === 'tropical') {
      // TROPICAL DIAGONAL SUNBEAMS & SEA FOAM PARTICLES
      ctx.save()
      const beamGrad = ctx.createLinearGradient(0, 0, WORLD.width, WORLD.height)
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.12)')
      beamGrad.addColorStop(0.5, 'rgba(45, 212, 191, 0.06)')
      beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = beamGrad
      ctx.beginPath()
      ctx.moveTo(100, 0); ctx.lineTo(WORLD.width * 0.4, 0); ctx.lineTo(WORLD.width * 0.7, WORLD.height); ctx.lineTo(WORLD.width * 0.2, WORLD.height)
      ctx.closePath(); ctx.fill()
      ctx.restore()

    } else {
      // CLOVERFIELD: GOLDEN POLLEN & DANDELION SEEDS
      weatherParticles.forEach((p) => {
        p.x += 0.8 + Math.sin(now / 600 + p.phase) * 0.5
        p.y -= 0.5 + Math.cos(now / 700 + p.phase) * 0.4
        if (p.x > WORLD.width + 20) p.x = -20
        if (p.y < -20) p.y = WORLD.height + 20
        const pulse = 0.4 + Math.sin(now / 350 + p.phase) * 0.6
        ctx.fillStyle = `rgba(254, 240, 138, ${pulse * 0.75})`
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2); ctx.fill()
      })
    }
  }

  // Master Map Renderer with Theme Architecture, Trails, Water Basins & Atmosphere
  function drawMap(now) {
    const biome = BIOMES[currentBiomeIndex % BIOMES.length]
    const bId = biome.id

    // 1. Terrain Ground
    ctx.fillStyle = biome.bg
    ctx.fillRect(0, 0, WORLD.width, WORLD.height)

    // Hill contours
    ctx.fillStyle = biome.hillTop
    ctx.beginPath()
    ctx.moveTo(0, 220)
    ctx.bezierCurveTo(450, 160, 900, 260, 1800, 180)
    ctx.lineTo(1800, 0); ctx.lineTo(0, 0); ctx.closePath()
    ctx.fill()

    ctx.fillStyle = biome.hillBottom
    ctx.beginPath()
    ctx.moveTo(0, 980)
    ctx.bezierCurveTo(550, 920, 1100, 1020, 1800, 940)
    ctx.lineTo(1800, WORLD.height); ctx.lineTo(0, WORLD.height); ctx.closePath()
    ctx.fill()

    // Rainbow in Cloverfield & Sugarplum
    if (bId === 'emerald' || bId === 'candy') {
      drawRainbow(now)
    }

    // Dynamic Weather Atmosphere per Biome
    drawWeatherEffects(now, biome)

    // Floating Clouds (Puffy white in daytime, neon/starlight tinted in cosmic/night)
    clouds.forEach(c => {
      c.x += c.speed * 0.016
      if (c.x - c.w > WORLD.width) c.x = -c.w

      ctx.fillStyle = bId === 'galaxy' ? 'rgba(5, 2, 25, 0.25)' : 'rgba(15, 51, 40, 0.09)'
      ctx.beginPath()
      ctx.ellipse(c.x + 35, c.y + 160, c.w * 0.65, c.h * 0.45, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = bId === 'galaxy' ? 'rgba(99, 102, 241, 0.45)' : bId === 'candy' ? 'rgba(253, 242, 248, 0.88)' : 'rgba(255, 255, 255, 0.85)'
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.h * 0.52, 0, Math.PI * 2)
      ctx.arc(c.x + c.w * 0.3, c.y - c.h * 0.22, c.h * 0.62, 0, Math.PI * 2)
      ctx.arc(c.x + c.w * 0.62, c.y, c.h * 0.54, 0, Math.PI * 2)
      ctx.arc(c.x + c.w * 0.88, c.y + c.h * 0.1, c.h * 0.4, 0, Math.PI * 2)
      ctx.fill()
    })

    // Wildflowers dotted across meadow (Cloverfield, Autumn, Tropical)
    if (bId !== 'galaxy' && bId !== 'frosty') {
      flowers.forEach(f => drawFlower(f, now))
    }

    // Hopping bunnies in meadow
    if (bId === 'emerald' || bId === 'candy') {
      drawBunnies(now)
    }

    // 2. Distinct Themed Adventure Trail
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const pathCurve = () => {
      ctx.beginPath()
      ctx.moveTo(-40, 580)
      ctx.bezierCurveTo(360, 440, 470, 545, 780, 460)
      ctx.bezierCurveTo(1060, 375, 1200, 540, 1490, 395)
      ctx.bezierCurveTo(1630, 330, 1710, 390, 1850, 370)
    }

    // Trail base shadow
    pathCurve()
    ctx.strokeStyle = biome.pathShadow
    ctx.lineWidth = 108
    ctx.stroke()

    // Outer Trail Border
    pathCurve()
    ctx.strokeStyle = biome.pathBorder
    ctx.lineWidth = 92
    ctx.stroke()

    // Inner Path Surface
    pathCurve()
    ctx.strokeStyle = biome.pathInner
    ctx.lineWidth = 74
    ctx.stroke()

    // Unique Trail Patterns per Map
    if (bId === 'candy') {
      // Candy-Cane Diagonal Striped Barber-Pole Trail
      ctx.setLineDash([18, 22])
      ctx.strokeStyle = '#f472b6'
      ctx.lineWidth = 50
      pathCurve(); ctx.stroke()
      ctx.setLineDash([])
      // Sparkling Sugar Border
      ctx.setLineDash([8, 14])
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 6
      pathCurve(); ctx.stroke()
      ctx.setLineDash([])

    } else if (bId === 'galaxy') {
      // Glowing Cyan Laser Energy Trail
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 66
      pathCurve(); ctx.stroke()

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 4
      pathCurve(); ctx.stroke()

      ctx.setLineDash([18, 30])
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth = 8
      pathCurve(); ctx.stroke()
      ctx.setLineDash([])

    } else if (bId === 'tropical') {
      // Weathered Wooden Boardwalk Beach Trail
      ctx.setLineDash([12, 14])
      ctx.strokeStyle = '#d97706'
      ctx.lineWidth = 64
      pathCurve(); ctx.stroke()
      ctx.setLineDash([])

    } else if (bId === 'frosty') {
      // Translucent Cracked Glacial Ice Path
      ctx.setLineDash([20, 24])
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 4
      pathCurve(); ctx.stroke()
      ctx.setLineDash([])

    } else {
      // Classic Cobblestone Pavers & Center Guide
      ctx.setLineDash([14, 18])
      ctx.strokeStyle = biome.pathBorder
      ctx.lineWidth = 6
      pathCurve(); ctx.stroke()
      ctx.setLineDash([])

      ctx.setLineDash([16, 24])
      ctx.strokeStyle = '#ffffffa0'
      ctx.lineWidth = 3.5
      pathCurve(); ctx.stroke()
      ctx.setLineDash([])
    }

    // 3. Themed Water / Center Basin Feature
    ctx.fillStyle = bId === 'galaxy' ? '#1e1b4b' : '#d9c79e'
    ctx.beginPath(); ctx.ellipse(water.x, water.y, water.rx + 22, water.ry + 20, -0.16, 0, Math.PI * 2); ctx.fill()

    ctx.fillStyle = biome.waterBorder
    ctx.beginPath(); ctx.ellipse(water.x, water.y, water.rx + 8, water.ry + 8, -0.16, 0, Math.PI * 2); ctx.fill()

    // Water Gradient with Biome Depth
    const waterGrad = ctx.createRadialGradient(water.x - 40, water.y - 30, 30, water.x, water.y, water.rx)
    waterGrad.addColorStop(0, biome.waterGrad[0])
    waterGrad.addColorStop(0.45, biome.waterGrad[1])
    waterGrad.addColorStop(1, biome.waterGrad[2])
    ctx.fillStyle = waterGrad
    ctx.beginPath(); ctx.ellipse(water.x, water.y, water.rx, water.ry, -0.16, 0, Math.PI * 2); ctx.fill()

    if (bId === 'frosty') {
      // FROZEN ICE SKATING RINK WITH SLIDING PENGUINS
      // Glossy ice reflections & scratch marks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(water.x - 40, water.y - 20, 45, 0.2, 1.8)
      ctx.arc(water.x + 35, water.y + 15, 60, 2.5, 4.2)
      ctx.stroke()
      drawIceSkatingPenguins(now)

    } else if (bId === 'galaxy') {
      // QUANTUM STARDUST VORTEX & ORBITING CELESTIAL BODIES
      for (let ring = 0; ring < 3; ring++) {
        const ringPhase = (now / 2000 + ring * 0.33) % 1
        const rx = water.rx * 0.3 + ringPhase * water.rx * 0.65
        const ry = water.ry * 0.3 + ringPhase * water.ry * 0.65
        ctx.strokeStyle = `rgba(34, 211, 238, ${(1 - ringPhase) * 0.65})`
        ctx.lineWidth = 3
        ctx.beginPath(); ctx.ellipse(water.x, water.y, rx, ry, now / 3000 + ring, 0, Math.PI * 2); ctx.stroke()
      }
      // Orbiting planetary satellite
      const satAng = now / 1400
      const satX = water.x + Math.cos(satAng) * (water.rx * 0.7)
      const satY = water.y + Math.sin(satAng) * (water.ry * 0.7)
      ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.arc(satX, satY, 7, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke()

    } else if (bId === 'candy') {
      // STRAWBERRY CREAM SODA WITH FLOATING MARSHMALLOW RAFTS
      const marsh = [
        { x: water.x - 70, y: water.y - 25, r: 16 },
        { x: water.x + 60, y: water.y + 35, r: 20 },
        { x: water.x + 10, y: water.y - 45, r: 14 }
      ]
      marsh.forEach((m, idx) => {
        const bob = Math.sin(now / 400 + idx) * 2
        ctx.fillStyle = '#fff1f2'
        roundedRect(m.x - m.r, m.y - m.r * 0.6 + bob, m.r * 2, m.r * 1.2, 6); ctx.fill()
        ctx.fillStyle = '#f472b6'
        ctx.beginPath(); ctx.arc(m.x, m.y + bob, 3, 0, Math.PI * 2); ctx.fill()
      })

    } else {
      // NATURAL LILY POND WITH DUCKS & WATER LILIES
      const lilyPads = [
        { x: water.x - 110, y: water.y - 45, r: 18, flower: true },
        { x: water.x + 85, y: water.y + 60, r: 22, flower: true },
        { x: water.x + 120, y: water.y - 70, r: 16, flower: false },
        { x: water.x - 40, y: water.y + 90, r: 20, flower: false }
      ]
      lilyPads.forEach((pad, idx) => {
        const padSway = Math.sin(now / 800 + idx) * 2
        ctx.fillStyle = '#227447'
        ctx.beginPath(); ctx.arc(pad.x, pad.y + padSway, pad.r, 0.25, Math.PI * 1.9); ctx.lineTo(pad.x, pad.y + padSway); ctx.closePath(); ctx.fill()
        if (pad.flower) {
          ctx.fillStyle = '#f472b6'
          for (let p = 0; p < 6; p++) {
            const pang = p * Math.PI / 3
            ctx.beginPath(); ctx.ellipse(pad.x + Math.cos(pang) * 7, pad.y + padSway + Math.sin(pang) * 7, 5, 2.5, pang, 0, Math.PI * 2); ctx.fill()
          }
          ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(pad.x, pad.y + padSway, 3, 0, Math.PI * 2); ctx.fill()
        }
      })
      drawDuckFamily(now)
    }

    // 4. Cottages & Foliage per Biome
    houses.forEach(h => drawHouse(h, now, biome))
    trees.forEach(t => drawTree(t, now, biome))

    // Songbirds perched on structures
    if (bId !== 'galaxy') {
      drawSongbirds(now)
    }

    // 5. Stylized 3D Mossy / Crystal Boulders
    rocks.forEach((rock) => {
      ctx.fillStyle = bId === 'galaxy' ? 'rgba(5, 2, 25, 0.35)' : 'rgba(15, 51, 40, 0.22)'
      ctx.beginPath(); ctx.ellipse(rock.x + 4, rock.y + rock.r * 0.65, rock.r * 1.1, rock.r * 0.4, 0, 0, Math.PI * 2); ctx.fill()

      if (bId === 'galaxy') {
        ctx.fillStyle = '#312e81'
        ctx.beginPath(); ctx.ellipse(rock.x, rock.y, rock.r, rock.r * 0.75, -0.15, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#22d3ee'
        ctx.beginPath(); ctx.arc(rock.x + rock.r * 0.2, rock.y - rock.r * 0.1, rock.r * 0.28, 0, Math.PI * 2); ctx.fill()
      } else if (bId === 'candy') {
        ctx.fillStyle = '#f472b6'
        ctx.beginPath(); ctx.ellipse(rock.x, rock.y, rock.r, rock.r * 0.75, -0.15, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.beginPath(); ctx.arc(rock.x - rock.r * 0.25, rock.y - rock.r * 0.25, rock.r * 0.32, 0, Math.PI * 2); ctx.fill()
      } else {
        ctx.fillStyle = '#64748b'
        ctx.beginPath(); ctx.ellipse(rock.x, rock.y, rock.r, rock.r * 0.75, -0.15, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#94a3b8'
        ctx.beginPath(); ctx.ellipse(rock.x - rock.r * 0.25, rock.y - rock.r * 0.25, rock.r * 0.55, rock.r * 0.32, -0.15, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = bId === 'autumn' ? '#d97706' : '#4ade80'
        ctx.beginPath(); ctx.arc(rock.x + rock.r * 0.3, rock.y - rock.r * 0.1, rock.r * 0.28, 0, Math.PI * 2); ctx.fill()
      }
    })

    // 6. Floating Sunlight Motes / Fireflies
    ambientMotes.forEach(m => {
      m.x += m.vx * 0.016
      m.y += m.vy * 0.016
      if (m.x > WORLD.width) m.x = 0
      if (m.y < 0) m.y = WORLD.height
      const pulse = 0.5 + Math.sin(now / 400 + m.x) * 0.5
      ctx.fillStyle = biome.moteColor ? biome.moteColor(m.alpha, pulse) : `rgba(254, 240, 138, ${m.alpha * pulse})`
      ctx.beginPath(); ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2); ctx.fill()
    })

    // 7. Quest Word Targets (Golden Celestial Stars with Radiant Glow)
    const objects = levels[currentLevel].objects
    objects.forEach((object, index) => {
      if (collected.has(index)) return

      const bob = Math.sin(now / 320 + index * 1.4) * 6
      const pulse = 1 + Math.sin(now / 260 + index) * 0.1
      const objY = object.y + bob

      // Continuous golden sparkle emitter from active star
      if (Math.random() < 0.18) {
        particles.push({
          x: object.x + (Math.random() - 0.5) * 35,
          y: objY + (Math.random() - 0.5) * 35,
          vx: (Math.random() - 0.5) * 25,
          vy: -20 - Math.random() * 30,
          life: 0.7 + Math.random() * 0.5,
          age: 0,
          size: 3 + Math.random() * 4
        })
      }

      // Soft ground beacon shadow
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)'
      ctx.beginPath()
      ctx.ellipse(object.x, object.y + 44, 28 * pulse, 10 * pulse, 0, 0, Math.PI * 2)
      ctx.fill()

      // Radiant Celestial Aura (Multilayered Golden Rays)
      const auraGrad = ctx.createRadialGradient(object.x, objY, 5, object.x, objY, 55 * pulse)
      auraGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)')
      auraGrad.addColorStop(0.35, 'rgba(251, 191, 36, 0.55)')
      auraGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.2)')
      auraGrad.addColorStop(1, 'rgba(245, 158, 11, 0)')
      ctx.fillStyle = auraGrad
      ctx.beginPath(); ctx.arc(object.x, objY, 55 * pulse, 0, Math.PI * 2); ctx.fill()

      // Rotating diamond sparkle rays
      const rotAngle = now / 1500 + index
      ctx.save()
      ctx.translate(object.x, objY)
      ctx.rotate(rotAngle)
      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)'
      for (let r = 0; r < 4; r++) {
        ctx.rotate(Math.PI / 2)
        ctx.beginPath()
        ctx.moveTo(0, -38 * pulse)
        ctx.lineTo(8 * pulse, 0)
        ctx.lineTo(0, 38 * pulse)
        ctx.lineTo(-8 * pulse, 0)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()

      // High-Contrast Golden Orb Base
      const orbGrad = ctx.createRadialGradient(object.x - 8, objY - 8, 4, object.x, objY, 32)
      orbGrad.addColorStop(0, '#ffffff')
      orbGrad.addColorStop(0.4, '#fef08a')
      orbGrad.addColorStop(0.85, '#f59e0b')
      orbGrad.addColorStop(1, '#d97706')
      ctx.fillStyle = orbGrad
      ctx.beginPath(); ctx.arc(object.x, objY, 30, 0, Math.PI * 2); ctx.fill()

      // Crisp White Rim
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3.5
      ctx.stroke()

      // Icon Display (3D Emoji)
      ctx.font = '34px "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(object.icon, object.x, objY + 1)

      // High-Contrast Floating Word Pill Badge
      const wordText = object.word
      ctx.font = '700 13px "Fredoka", "Trebuchet MS", sans-serif'
      const textWidth = ctx.measureText(wordText).width
      const badgeWidth = Math.max(56, textWidth + 24)
      const badgeHeight = 24
      const badgeX = object.x - badgeWidth / 2
      const badgeY = objY + 36

      // Pill Shadow
      ctx.fillStyle = 'rgba(15, 51, 40, 0.35)'
      roundedRect(badgeX + 1, badgeY + 2, badgeWidth, badgeHeight, 12); ctx.fill()

      // Pill Body (Deep forest teal with golden border)
      ctx.fillStyle = '#0f3328'
      roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 12); ctx.fill()
      ctx.strokeStyle = '#fde68a'
      ctx.lineWidth = 2
      roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 12); ctx.stroke()

      // Text
      ctx.fillStyle = '#ffffff'
      ctx.fillText(wordText, object.x, badgeY + badgeHeight / 2 + 1)
    })
  }

  function drawPlayer(now) {
    const walking = Math.hypot(movement.x, movement.y) > 0.08
    if (walking) {
      player.walkCycle += 0.22
      // Dust puff footsteps behind player
      if (Math.random() < 0.25) {
        dustPuffs.push({
          x: player.x - player.face * 12 + (Math.random() - 0.5) * 8,
          y: player.y + 24,
          vx: -player.face * (10 + Math.random() * 15),
          vy: -8 - Math.random() * 10,
          r: 3 + Math.random() * 3,
          age: 0,
          life: 0.4
        })
      }
    } else {
      player.walkCycle = 0
    }

    // Blinking animation
    if (now > player.nextBlink) {
      player.blinkUntil = now + 160
      player.nextBlink = now + 2500 + Math.random() * 2500
    }
    const isBlinking = now < player.blinkUntil
    const isCelebratingWord = now < player.happyUntil

    const bob = isCelebratingWord 
      ? Math.sin(now / 70) * 8 
      : walking 
        ? Math.abs(Math.sin(player.walkCycle)) * 4.5 
        : Math.sin(now / 400) * 2

    const legSwing = walking ? Math.sin(player.walkCycle) * 7 : 0

    ctx.save()
    ctx.translate(player.x, player.y - bob)
    ctx.scale(player.face, 1)

    const isGirl = playerGender === 'female'
    const walkAnim = walking ? player.walkCycle : 0
    const armSwing = isCelebratingWord ? -Math.PI * 0.75 : walking ? Math.sin(walkAnim) * 0.55 : Math.sin(now / 500) * 0.08
    const backArmSwing = isCelebratingWord ? -Math.PI * 0.75 : -armSwing
    const pigtailSway = walking ? Math.sin(walkAnim) * 6 : Math.sin(now / 450) * 2

    // 1. Soft Ambient Ground Shadow
    ctx.fillStyle = 'rgba(15, 51, 40, 0.28)'
    ctx.beginPath()
    ctx.ellipse(0, 27 + bob * 0.75, 17 - (isCelebratingWord ? 3 : 0), 6.5, 0, 0, Math.PI * 2)
    ctx.fill()

    // 2. Adventurer Leather Backpack (peeking behind left shoulder)
    ctx.fillStyle = '#92400e'
    roundedRect(-17, -8, 11, 20, 5); ctx.fill()
    ctx.fillStyle = '#78350f'
    roundedRect(-18, -10, 13, 7, 3); ctx.fill() // Flap
    // Rolled explorer bedroll strapped to top of backpack
    ctx.fillStyle = '#15803d'
    roundedRect(-19, -15, 14, 6, 3); ctx.fill()
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(-15, -15); ctx.lineTo(-15, -9)
    ctx.moveTo(-9, -15); ctx.lineTo(-9, -9)
    ctx.stroke()

    // 3. Back Arm & Hand
    ctx.save()
    ctx.translate(-7, -4)
    ctx.rotate(backArmSwing)
    ctx.fillStyle = '#0284c7' // Sleeve
    roundedRect(-3, 0, 7, 13, 3.5); ctx.fill()
    ctx.fillStyle = '#ffe0c2' // Hand
    ctx.beginPath(); ctx.arc(0.5, 13, 3.2, 0, Math.PI * 2); ctx.fill()
    ctx.restore()

    // 4. Back Leg & Boot
    ctx.fillStyle = '#fef3c7' // Sock
    roundedRect(-8 + legSwing * 0.8, 14, 6, 8, 3); ctx.fill()
    ctx.fillStyle = '#78350f' // Leather Boot
    roundedRect(-9 + legSwing * 0.8, 19, 8, 8, 3.5); ctx.fill()
    ctx.fillStyle = '#451a03' // Boot Sole
    roundedRect(-10 + legSwing * 0.8, 24, 10, 4, 2); ctx.fill()

    // 5. Front Leg & Boot
    ctx.fillStyle = '#fef3c7' // Sock
    roundedRect(2 - legSwing * 0.8, 14, 6, 8, 3); ctx.fill()
    ctx.fillStyle = '#92400e' // Leather Boot (Highlight tone)
    roundedRect(1 - legSwing * 0.8, 19, 8, 8, 3.5); ctx.fill()
    ctx.fillStyle = '#451a03' // Boot Sole
    roundedRect(0 - legSwing * 0.8, 24, 10, 4, 2); ctx.fill()

    // 6. Character Body & Explorer Outfit
    // Torso / Jacket (Rounded cute adventure tunic)
    ctx.fillStyle = '#0284c7'
    roundedRect(-11, -12, 22, 23, 7); ctx.fill()

    // Explorer utility pocket with gold snap
    ctx.fillStyle = '#0369a1'
    roundedRect(-9, -2, 7, 8, 2.5); ctx.fill()
    ctx.fillStyle = '#fde68a'
    ctx.beginPath(); ctx.arc(-5.5, 0, 1.2, 0, Math.PI * 2); ctx.fill()

    // Golden jacket buttons down front placket
    ctx.fillStyle = '#fde047'
    ctx.beginPath(); ctx.arc(4, -6, 2, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(4, 1, 2, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(3.5, -6.5, 0.8, 0, Math.PI * 2); ctx.fill()

    // Adventure Leather Belt with Gold Buckle
    ctx.fillStyle = '#78350f'
    roundedRect(-11, 7, 22, 4.5, 2); ctx.fill()
    ctx.fillStyle = '#fbbf24'
    roundedRect(-3, 6.5, 6, 5.5, 1.5); ctx.fill()
    ctx.fillStyle = '#451a03'
    roundedRect(-1.5, 7.5, 3, 3.5, 1); ctx.fill()

    // Neckerchief / Bandana
    ctx.fillStyle = isGirl ? '#f43f5e' : '#ea580c'
    ctx.beginPath()
    ctx.moveTo(-8, -11)
    ctx.lineTo(8, -11)
    ctx.lineTo(1, -4)
    ctx.lineTo(-2, -4)
    ctx.closePath()
    ctx.fill()
    // Knot
    ctx.beginPath(); ctx.arc(0, -5, 2.2, 0, Math.PI * 2); ctx.fill()

    // 7. Front Arm & Hand
    ctx.save()
    ctx.translate(6, -4)
    ctx.rotate(armSwing)
    ctx.fillStyle = '#0369a1' // Sleeve with depth
    roundedRect(-3.5, 0, 7, 13, 3.5); ctx.fill()
    ctx.fillStyle = '#ffe0c2' // Hand
    ctx.beginPath(); ctx.arc(0, 13, 3.2, 0, Math.PI * 2); ctx.fill()
    // Little thumb
    ctx.beginPath(); ctx.arc(2.2, 11.5, 1.4, 0, Math.PI * 2); ctx.fill()
    ctx.restore()

    // 8. Back Hair Layer (Behind head)
    if (isGirl) {
      // Warm chestnut back bob
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.arc(0, -22, 19, 0, Math.PI * 2)
      ctx.fill()

      // Cute bouncing left pigtail
      ctx.save()
      ctx.translate(-16, -18 + pigtailSway)
      ctx.rotate(-0.25 + (walking ? Math.sin(walkAnim) * 0.15 : 0))
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.ellipse(0, 7, 6.5, 11, -0.15, 0, Math.PI * 2)
      ctx.fill()
      // Hair highlight strand
      ctx.fillStyle = '#92400e'
      ctx.beginPath()
      ctx.ellipse(-1.5, 6, 2, 7, -0.15, 0, Math.PI * 2)
      ctx.fill()
      // Cute coral ribbon bow
      ctx.fillStyle = '#f43f5e'
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill() // Center knot
      ctx.beginPath(); ctx.ellipse(-4, -1, 3.5, 2, -0.4, 0, Math.PI * 2); ctx.fill() // Wing 1
      ctx.beginPath(); ctx.ellipse(4, -1, 3.5, 2, 0.4, 0, Math.PI * 2); ctx.fill()  // Wing 2
      ctx.restore()

      // Cute bouncing right pigtail
      ctx.save()
      ctx.translate(16, -18 - pigtailSway)
      ctx.rotate(0.25 - (walking ? Math.sin(walkAnim) * 0.15 : 0))
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.ellipse(0, 7, 6.5, 11, 0.15, 0, Math.PI * 2)
      ctx.fill()
      // Hair highlight strand
      ctx.fillStyle = '#92400e'
      ctx.beginPath()
      ctx.ellipse(1.5, 6, 2, 7, 0.15, 0, Math.PI * 2)
      ctx.fill()
      // Cute coral ribbon bow
      ctx.fillStyle = '#f43f5e'
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill() // Center knot
      ctx.beginPath(); ctx.ellipse(-4, -1, 3.5, 2, -0.4, 0, Math.PI * 2); ctx.fill() // Wing 1
      ctx.beginPath(); ctx.ellipse(4, -1, 3.5, 2, 0.4, 0, Math.PI * 2); ctx.fill()  // Wing 2
      ctx.restore()
    } else {
      // Boy Explorer tousled hair back
      ctx.fillStyle = '#5c2d16'
      ctx.beginPath()
      ctx.arc(0, -22, 18, 0, Math.PI * 2)
      ctx.fill()
      // Little ear tufts
      ctx.beginPath(); ctx.arc(-16, -21, 5, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(16, -21, 5, 0, Math.PI * 2); ctx.fill()
    }

    // 9. Head & Adorable Chibi Face
    // Head Base (Warm, soft peach skin with gentle shading)
    ctx.fillStyle = '#ffe0c2'
    ctx.beginPath()
    ctx.arc(0, -21, 16.5, 0, Math.PI * 2)
    ctx.fill()

    // Cute Ears
    ctx.fillStyle = '#fed7aa'
    ctx.beginPath(); ctx.arc(-15, -20, 3.8, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(15, -20, 3.8, 0, Math.PI * 2); ctx.fill()

    // Rosy Airbrushed Cheeks
    ctx.fillStyle = 'rgba(251, 113, 133, 0.48)'
    ctx.beginPath(); ctx.ellipse(-8, -17, 4.2, 2.8, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(8, -17, 4.2, 2.8, 0, 0, Math.PI * 2); ctx.fill()

    // Cute Expressive Eyes
    if (isBlinking) {
      // Sweet curved closed sleeping/blinking arcs
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 2.2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(-6, -22, 3.5, Math.PI * 0.15, Math.PI * 0.85)
      ctx.moveTo(3, -22)
      ctx.arc(6, -22, 3.5, Math.PI * 0.15, Math.PI * 0.85)
      ctx.stroke()
    } else if (isCelebratingWord) {
      // Joyful anime happy crescent eyes (^‿^)
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 2.4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(-6, -21, 4, Math.PI * 1.15, Math.PI * 1.85)
      ctx.moveTo(3, -21)
      ctx.arc(6, -21, 4, Math.PI * 1.15, Math.PI * 1.85)
      ctx.stroke()
    } else {
      // Big, friendly, expressive shining eyes
      ctx.fillStyle = '#1e293b'
      ctx.beginPath(); ctx.ellipse(-5.5, -22, 3.2, 4.5, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(5.5, -22, 3.2, 4.5, 0, 0, Math.PI * 2); ctx.fill()

      // Soft iris gradient depth (dark blue-violet)
      ctx.fillStyle = isGirl ? '#3b82f6' : '#0284c7'
      ctx.beginPath(); ctx.arc(-5.5, -20.5, 2, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(5.5, -20.5, 2, 0, Math.PI * 2); ctx.fill()

      // Big primary sparkling white catchlight (Top-left)
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(-4.5, -23.5, 1.4, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(6.5, -23.5, 1.4, 0, Math.PI * 2); ctx.fill()

      // Small secondary shimmer catchlight (Bottom-right)
      ctx.beginPath(); ctx.arc(-6.5, -21, 0.8, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(4.5, -21, 0.8, 0, Math.PI * 2); ctx.fill()

      // Sweet fluttery eyelashes for girl explorer
      if (isGirl) {
        ctx.strokeStyle = '#0f172a'
        ctx.lineWidth = 1.6
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(8, -24.5); ctx.lineTo(10.5, -26.5)
        ctx.moveTo(-8, -24.5); ctx.lineTo(-10.5, -26.5)
        ctx.stroke()
      }
    }

    // Cute Little Button Nose
    ctx.fillStyle = '#ea580c'
    ctx.beginPath(); ctx.arc(0, -18.5, 1.1, 0, Math.PI * 2); ctx.fill()

    // Cheerful Smiling Mouth
    if (isCelebratingWord) {
      // Big open happy laugh :D
      ctx.fillStyle = '#be123c'
      ctx.beginPath()
      ctx.arc(0, -15.5, 4.2, 0, Math.PI)
      ctx.fill()
      ctx.fillStyle = '#f43f5e' // Cute pink tongue
      ctx.beginPath()
      ctx.arc(0, -14, 2.6, 0, Math.PI)
      ctx.fill()
    } else {
      // Sweet friendly smile
      ctx.strokeStyle = '#991b1b'
      ctx.lineWidth = 1.8
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(0, -16.5, 3.2, 0.18, Math.PI - 0.18)
      ctx.stroke()
    }

    // 10. Front Hair & Stylish Explorer Hat
    if (isGirl) {
      // Soft, natural curved bangs framing the forehead
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.arc(0, -25, 16.5, Math.PI * 1.05, Math.PI * 1.95)
      ctx.bezierCurveTo(9, -23, 5, -26, 0, -24)
      ctx.bezierCurveTo(-5, -26, -9, -23, -15, -24)
      ctx.closePath()
      ctx.fill()

      // Cute Straw Adventurer Sun Hat (Natural curved boater profile)
      // Soft hat drop shadow on forehead
      ctx.fillStyle = 'rgba(69, 26, 3, 0.22)'
      ctx.beginPath()
      ctx.ellipse(0, -29, 18, 5, 0, 0, Math.PI * 2)
      ctx.fill()

      // Hat Rounded Crown
      ctx.fillStyle = '#fef08a'
      ctx.beginPath()
      ctx.arc(0, -33, 14, Math.PI, Math.PI * 2)
      ctx.fill()

      // Coral Silk Ribbon Band
      ctx.fillStyle = '#f43f5e'
      roundedRect(-14, -34.5, 28, 4, 1.5); ctx.fill()

      // Sweet White Daisy Flower Pin on Hat
      ctx.fillStyle = '#ffffff'
      for (let p = 0; p < 5; p++) {
        const ang = p * Math.PI * 2 / 5
        ctx.beginPath()
        ctx.arc(8 + Math.cos(ang) * 2.8, -33 + Math.sin(ang) * 2.8, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath(); ctx.arc(8, -33, 1.8, 0, Math.PI * 2); ctx.fill()

      // Naturally Curved Hat Brim
      ctx.fillStyle = '#fde047'
      ctx.beginPath()
      ctx.ellipse(0, -30.5, 20, 5.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ca8a04'
      ctx.lineWidth = 1.2
      ctx.stroke()
    } else {
      // Boy Explorer Front Tousled Bangs
      ctx.fillStyle = '#5c2d16'
      ctx.beginPath()
      ctx.moveTo(-14, -26)
      ctx.lineTo(-8, -21)
      ctx.lineTo(-4, -25)
      ctx.lineTo(2, -20)
      ctx.lineTo(8, -25)
      ctx.lineTo(14, -22)
      ctx.lineTo(15, -30)
      ctx.lineTo(-15, -30)
      ctx.closePath()
      ctx.fill()

      // Boy Explorer Safari Cap
      // Cap Crown
      ctx.fillStyle = '#d97706'
      ctx.beginPath()
      ctx.arc(0, -33, 15, Math.PI, Math.PI * 2)
      ctx.fill()

      // Dark Leather Band
      ctx.fillStyle = '#451a03'
      roundedRect(-14, -34, 28, 3.5, 1.5); ctx.fill()

      // Golden Compass Scout Badge
      ctx.fillStyle = '#fef08a'
      ctx.beginPath(); ctx.arc(0, -32.5, 3.2, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#b45309'
      ctx.beginPath(); ctx.arc(0, -32.5, 1.2, 0, Math.PI * 2); ctx.fill()

      // Curved Front Cap Visor
      ctx.fillStyle = '#b45309'
      ctx.beginPath()
      ctx.ellipse(0, -30.5, 18, 5, 0, 0, Math.PI)
      ctx.fill()
      ctx.strokeStyle = '#78350f'
      ctx.lineWidth = 1.2
      ctx.stroke()
    }

    // 11. Celebration Floating Magic Star Sparkles
    if (isCelebratingWord) {
      const starGlow = 0.5 + Math.sin(now / 100) * 0.5
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath(); ctx.arc(17, -42 + Math.sin(now / 150) * 3, 3.5 * starGlow + 2, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(-18, -40 + Math.cos(now / 160) * 3, 3 * starGlow + 1.8, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(0, -50 + Math.sin(now / 120) * 4, 4 * starGlow + 2.5, 0, Math.PI * 2); ctx.fill()
    }

    ctx.restore()
  }

  function addStarBurst(x, y) {
    for (let i = 0; i < 36; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 70 + Math.random() * 200
      particles.push({ 
        x, 
        y, 
        vx: Math.cos(angle) * speed, 
        vy: Math.sin(angle) * speed - 45, 
        life: 0.9 + Math.random() * 0.8, 
        age: 0, 
        size: 5 + Math.random() * 8,
        color: ['#fde047', '#f59e0b', '#38bdf8', '#4ade80', '#ffffff'][i % 5]
      })
    }
  }

  function updateParticles(dt) {
    // Star & Celebration particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.age += dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 105 * dt
      if (p.age >= p.life) particles.splice(i, 1)
    }

    // Walking dust puffs
    for (let i = dustPuffs.length - 1; i >= 0; i--) {
      const d = dustPuffs[i]
      d.age += dt
      d.x += d.vx * dt
      d.y += d.vy * dt
      d.r += 8 * dt
      if (d.age >= d.life) dustPuffs.splice(i, 1)
    }
  }

  function drawParticles() {
    // Dust puffs
    dustPuffs.forEach(d => {
      const alpha = Math.max(0, 1 - d.age / d.life) * 0.45
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill()
    })

    // Sparkles & Star bursts
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life)
      ctx.fillStyle = p.color || '#fff3ae'
      ctx.font = `bold ${p.size}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('✦', p.x, p.y)
    })
    ctx.globalAlpha = 1
  }

  function isBlocked(x, y) {
    if (x < 50 || y < 50 || x > WORLD.width - 50 || y > WORLD.height - 50) return true
    if (isWater(x, y, 28)) return true
    for (const house of houses) {
      if (x > house.x - 18 && x < house.x + house.w + 18 && y > house.y + 10 && y < house.y + house.h + 20) return true
    }
    for (const rock of rocks) {
      if (Math.hypot(x - rock.x, y - rock.y) < rock.r + 22) return true
    }
    return false
  }

  function update(dt, now) {
    const paused = !challenge.hidden || !celebration.hidden || isCelebrating
    const previousX = player.x
    const previousY = player.y
    const deltaX = paused ? 0 : player.targetX - player.x
    const deltaY = paused ? 0 : player.targetY - player.y
    const distance = Math.hypot(deltaX, deltaY)
    if (distance > 1.5) {
      // Balanced, snappy movement: ~0.45s per square, zero lag, instant responsiveness
      const cruise = waypoints.length ? 600 : 490
      const speed = distance < 14 ? Math.max(260, distance * 18) : cruise
      const step = Math.min(speed * dt, distance)
      const nx = player.x + (deltaX / distance) * step
      const ny = player.y + (deltaY / distance) * step

      // Strict pond collision: if the next step enters water, stop at the shoreline immediately
      if (isWater(nx, ny, 12)) {
        player.targetX = player.x
        player.targetY = player.y
        waypoints.length = 0
      } else {
        player.x = nx
        player.y = ny
      }

      movement.x = Math.sign(player.x - previousX)
      movement.y = Math.sign(player.y - previousY)
      if (Math.abs(deltaX) > Math.abs(deltaY) * 0.65) player.face = deltaX < 0 ? -1 : 1
    } else {
      movement.x = 0
      movement.y = 0
      player.x = player.targetX
      player.y = player.targetY
      // Arrived at this square: walk to the next queued joystick step, if any
      if (!paused && waypoints.length) {
        const next = waypoints.shift()
        if (!isWater(next.x, next.y, 10)) {
          player.targetX = next.x
          player.targetY = next.y
        }
      }
    }
    // Absolute guarantee: character can never be inside the pond
    if (isWater(player.x, player.y, 8)) {
      const dx = player.x - water.x
      const dy = player.y - water.y
      const ang = Math.atan2(dy, dx)
      player.x = water.x + Math.cos(ang) * (water.rx + 25)
      player.y = water.y + Math.sin(ang) * (water.ry + 20)
      player.targetX = player.x
      player.targetY = player.y
      waypoints.length = 0
    }
    player.dx = movement.x; player.dy = movement.y
    updateParticles(dt)

    if (challenge.hidden && celebration.hidden && !isCelebrating) {
      const objects = levels[currentLevel].objects
      for (let i = 0; i < objects.length; i++) {
        if (!collected.has(i) && Math.hypot(player.x - objects[i].x, player.y - objects[i].y) < 68) {
          openChallenge(i)
          break
        }
      }
    }
  }

  function draw(now) {
    ctx.clearRect(0, 0, viewWidth, viewHeight)
    let cameraX = Math.max(0, Math.min(WORLD.width - viewWidth, player.x - viewWidth / 2))
    let cameraY = Math.max(0, Math.min(WORLD.height - viewHeight, player.y - viewHeight / 2))
    ctx.save()
    ctx.translate(-cameraX, -cameraY)
    drawMap(now)
    drawParticles()
    drawPlayer(now)
    ctx.restore()
  }

  function frame(now) {
    const dt = Math.min((now - lastFrame) / 1000 || 0, .04)
    lastFrame = now
    update(dt, now)
    draw(now)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  function updateHud() {
    const total = levels[currentLevel].objects.length
    scoreOutput.textContent = String(score)
    foundOutput.textContent = `Objects found: ${collected.size} / ${total}`
    progressFill.style.width = `${collected.size / total * 100}%`
    progressBar.setAttribute('aria-valuemax', String(total))
    progressBar.setAttribute('aria-valuenow', String(collected.size))
  }

  function sendQuestStatus(state) {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'SPEECH_QUEST_STATUS',
        status: {
          state,
          word: currentTarget?.word ?? '',
          found: collected.size,
          total: levels[currentLevel].objects.length,
        },
      }, window.location.origin)
    } else if (window._directSocket && window._directSocket.readyState === WebSocket.OPEN) {
      window._directSocket.send(JSON.stringify({
        type: 'CMD_SPEECH_QUEST_STATUS',
        state,
        word: currentTarget?.word ?? '',
        found: collected.size,
        total: levels[currentLevel].objects.length,
      }))
    }
  }

  function openChallenge(index) {
    currentTarget = { ...levels[currentLevel].objects[index], index }
    movement.x = 0
    movement.y = 0
    document.querySelector('#challenge-art').textContent = currentTarget.icon
    document.querySelector('#challenge-level').textContent = `SAY-IT QUEST • ${currentTarget.word}`
    document.querySelector('#challenge-word').textContent = currentTarget.word
    document.querySelector('#say-word').textContent = currentTarget.word
    feedback.textContent = 'Listen, then say it!'
    feedback.className = 'feedback'
    speechReady = true
    evaluationPending = false
    challenge.hidden = false
    micIndicator.dataset.state = 'listening'
    micLabel.textContent = 'LISTENING... SPEAK NOW!'
    sendQuestStatus('CHALLENGE')
    playEncounterSound()
    duckBgm(true)
    speakTarget()
    requestDeviceRecording()
  }

  function speakTarget() {
    duckBgm(true)
    if (currentTarget?.word) {
      window.parent.postMessage({ type: 'SPEECH_QUEST_PLAY_AUDIO', word: currentTarget.word }, window.location.origin)
    }
    // Note: Do NOT play local SpeechSynthesis simultaneously to prevent dual conflicting voices!
    // Parent window and IoT headset manage the clean single pronunciation voice.
  }

  // ----------------------------------------------------
  // Audio Engine: Web Audio API Synthesizer
  // Self-contained, zero asset latency, whimsical cozy BGM + crystal SFX
  // ----------------------------------------------------
  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return
      audioCtx = new AudioContextClass()

      masterGain = audioCtx.createGain()
      masterGain.gain.setValueAtTime(0.85, audioCtx.currentTime)
      masterGain.connect(audioCtx.destination)

      bgmGain = audioCtx.createGain()
      bgmGain.gain.setValueAtTime(0.28, audioCtx.currentTime) // Crisp, cheerful audible volume
      bgmGain.connect(masterGain)

      sfxGain = audioCtx.createGain()
      sfxGain.gain.setValueAtTime(0.55, audioCtx.currentTime)
      sfxGain.connect(masterGain)
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        if (soundEnabled && !bgmPlaying) {
          startBgm()
        }
        hideAudioBanner()
      }).catch(() => {})
    } else {
      if (soundEnabled && !bgmPlaying) {
        startBgm()
      }
      hideAudioBanner()
    }
  }

  const NOTE = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
    C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760.00, B6: 1975.53,
    C7: 2093.00
  }

  function playSynthNote(freq, startTime, duration, velocity = 0.5, type = 'triangle') {
    if (!audioCtx || !soundEnabled) return
    try {
      const osc = audioCtx.createOscillator()
      const oscOvertone = audioCtx.createOscillator()
      const noteGain = audioCtx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, startTime)

      // Sparkling warm chime overtone for child-friendly charm
      oscOvertone.type = 'sine'
      oscOvertone.frequency.setValueAtTime(freq * 2, startTime)

      noteGain.gain.setValueAtTime(0.0001, startTime)
      noteGain.gain.exponentialRampToValueAtTime(velocity * 0.42, startTime + 0.02)
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

      osc.connect(noteGain)
      oscOvertone.connect(noteGain)
      noteGain.connect(bgmGain)

      osc.start(startTime)
      oscOvertone.start(startTime)
      osc.stop(startTime + duration + 0.05)
      oscOvertone.stop(startTime + duration + 0.05)
    } catch (_) {}
  }

  // Cozy meadow adventure progression (32 steps, cheerful ~110 BPM)
  const BGM_MELODY = [
    // Measure 1: C Major (Sunny morning walk)
    { bass: NOTE.C3, chord: [NOTE.E4, NOTE.G4], lead: NOTE.C5, dur: 0.3 },
    { bass: null,    chord: null,               lead: NOTE.E5, dur: 0.25 },
    { bass: NOTE.G3, chord: [NOTE.C4, NOTE.E4], lead: NOTE.G5, dur: 0.3 },
    { bass: null,    chord: null,               lead: NOTE.E5, dur: 0.25 },
    { bass: NOTE.C3, chord: [NOTE.E4, NOTE.G4], lead: NOTE.D5, dur: 0.3 },
    { bass: null,    chord: null,               lead: NOTE.C5, dur: 0.25 },
    { bass: NOTE.G3, chord: [NOTE.C4, NOTE.E4], lead: NOTE.A4, dur: 0.35 },
    { bass: null,    chord: null,               lead: NOTE.G4, dur: 0.3 },

    // Measure 2: A Minor (Gentle breeze through the trees)
    { bass: NOTE.A3, chord: [NOTE.C4, NOTE.E4], lead: NOTE.C5, dur: 0.3 },
    { bass: null,    chord: null,               lead: NOTE.E5, dur: 0.25 },
    { bass: NOTE.E3, chord: [NOTE.A3, NOTE.C4], lead: NOTE.A5, dur: 0.35 },
    { bass: null,    chord: null,               lead: NOTE.G5, dur: 0.25 },
    { bass: NOTE.A3, chord: [NOTE.C4, NOTE.E4], lead: NOTE.E5, dur: 0.3 },
    { bass: null,    chord: null,               lead: NOTE.D5, dur: 0.25 },
    { bass: NOTE.E3, chord: [NOTE.A3, NOTE.C4], lead: NOTE.C5, dur: 0.35 },
    { bass: null,    chord: null,               lead: NOTE.D5, dur: 0.3 },

    // Measure 3: F Major (Playful discovery)
    { bass: NOTE.F3, chord: [NOTE.A3, NOTE.C4], lead: NOTE.F5, dur: 0.3 },
    { bass: null,    chord: null,               lead: NOTE.A5, dur: 0.25 },
    { bass: NOTE.C4, chord: [NOTE.F4, NOTE.A4], lead: NOTE.G5, dur: 0.3 },
    { bass: null,    chord: null,               lead: NOTE.F5, dur: 0.25 },
    { bass: NOTE.F3, chord: [NOTE.A3, NOTE.C4], lead: NOTE.E5, dur: 0.3 },
    { bass: null,    chord: null,               lead: NOTE.D5, dur: 0.25 },
    { bass: NOTE.C4, chord: [NOTE.F4, NOTE.A4], lead: NOTE.C5, dur: 0.35 },
    { bass: null,    chord: null,               lead: NOTE.A4, dur: 0.3 },

    // Measure 4: G Major (Sparkling anticipation)
    { bass: NOTE.G3, chord: [NOTE.B3, NOTE.D4], lead: NOTE.D5, dur: 0.3 },
    { bass: null,    chord: null,               lead: NOTE.G5, dur: 0.25 },
    { bass: NOTE.D4, chord: [NOTE.G4, NOTE.B4], lead: NOTE.F5, dur: 0.25 },
    { bass: null,    chord: null,               lead: NOTE.E5, dur: 0.25 },
    { bass: NOTE.G3, chord: [NOTE.B3, NOTE.D4], lead: NOTE.D5, dur: 0.3 },
    { bass: null,    chord: null,               lead: NOTE.C5, dur: 0.25 },
    { bass: NOTE.D4, chord: [NOTE.G4, NOTE.B4], lead: NOTE.D5, dur: 0.35 },
    { bass: null,    chord: null,               lead: NOTE.B4, dur: 0.35 }
  ]

  const BGM_STEP_TIME = 0.285
  let nextBgmTime = 0

  function scheduleBgm() {
    if (!audioCtx || !soundEnabled || !bgmPlaying) return
    const now = audioCtx.currentTime
    if (nextBgmTime < now) nextBgmTime = now + 0.05
    while (nextBgmTime < now + 0.45) {
      const step = BGM_MELODY[bgmStep]
      if (step) {
        if (step.bass) playSynthNote(step.bass, nextBgmTime, step.dur * 1.5, 0.42, 'triangle')
        if (step.chord) step.chord.forEach((f) => playSynthNote(f, nextBgmTime, step.dur * 1.2, 0.22, 'sine'))
        if (step.lead) playSynthNote(step.lead, nextBgmTime, step.dur * 1.05, 0.48, 'triangle')
      }
      nextBgmTime += BGM_STEP_TIME
      bgmStep = (bgmStep + 1) % BGM_MELODY.length
    }
  }

  function startBgm() {
    if (!audioCtx || !soundEnabled) return
    bgmPlaying = true
    nextBgmTime = audioCtx.currentTime + 0.1
    if (!bgmInterval) {
      bgmInterval = window.setInterval(scheduleBgm, 90)
    }
  }

  function stopBgm() {
    bgmPlaying = false
    if (bgmInterval) {
      window.clearInterval(bgmInterval)
      bgmInterval = null
    }
  }

  function duckBgm(duck) {
    if (!audioCtx || !bgmGain) return
    try {
      const now = audioCtx.currentTime
      bgmGain.gain.cancelScheduledValues(now)
      bgmGain.gain.setValueAtTime(bgmGain.gain.value, now)
      const targetVolume = duck ? 0.05 : 0.28
      bgmGain.gain.linearRampToValueAtTime(targetVolume, now + 0.3)
    } catch (_) {}
  }

  // Sparkling star collection sound effect with celestial crystal chimes
  function playStarCollectSound() {
    if (!soundEnabled) return
    initAudio()
    if (!audioCtx) return

    try {
      const now = audioCtx.currentTime

      // 6-step sparkling arpeggio into radiant shimmer chords
      const notes = [
        { f: NOTE.G4, t: 0.00, dur: 0.25, v: 0.55 },
        { f: NOTE.C5, t: 0.065, dur: 0.28, v: 0.65 },
        { f: NOTE.E5, t: 0.13, dur: 0.32, v: 0.72 },
        { f: NOTE.G5, t: 0.195, dur: 0.38, v: 0.80 },
        { f: NOTE.C6, t: 0.26, dur: 0.55, v: 0.90 },
        { f: NOTE.E6, t: 0.325, dur: 0.85, v: 0.98 },
        { f: NOTE.G6, t: 0.33, dur: 0.95, v: 0.85 },
        { f: NOTE.C7, t: 0.35, dur: 1.15, v: 0.70 }
      ]

      notes.forEach(({ f, t, dur, v }) => {
        const osc = audioCtx.createOscillator()
        const oscHarmonic = audioCtx.createOscillator()
        const g = audioCtx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(f, now + t)

        // Shimmering octave harmonic
        oscHarmonic.type = 'triangle'
        oscHarmonic.frequency.setValueAtTime(f * 2, now + t)

        g.gain.setValueAtTime(0.0001, now + t)
        g.gain.exponentialRampToValueAtTime(v * 0.22, now + t + 0.015)
        g.gain.exponentialRampToValueAtTime(0.0001, now + t + dur)

        osc.connect(g)
        oscHarmonic.connect(g)
        g.connect(sfxGain)

        osc.start(now + t)
        oscHarmonic.start(now + t)
        osc.stop(now + t + dur + 0.05)
        oscHarmonic.stop(now + t + dur + 0.05)
      })

      // Magical glittering fairy dust glissando
      const shimmerOsc = audioCtx.createOscillator()
      const shimmerGain = audioCtx.createGain()
      shimmerOsc.type = 'sine'
      shimmerOsc.frequency.setValueAtTime(2400, now + 0.32)
      shimmerOsc.frequency.exponentialRampToValueAtTime(4400, now + 0.85)

      shimmerGain.gain.setValueAtTime(0.0001, now + 0.32)
      shimmerGain.gain.exponentialRampToValueAtTime(0.05, now + 0.38)
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)

      shimmerOsc.connect(shimmerGain)
      shimmerGain.connect(sfxGain)

      shimmerOsc.start(now + 0.32)
      shimmerOsc.stop(now + 0.95)
    } catch (_) {}
  }

  // Friendly star encounter / discovery chime
  function playEncounterSound() {
    if (!soundEnabled) return
    initAudio()
    if (!audioCtx) return

    try {
      const now = audioCtx.currentTime
      const notes = [
        { f: NOTE.F5, t: 0.0, dur: 0.16, v: 0.5 },
        { f: NOTE.A5, t: 0.08, dur: 0.28, v: 0.65 }
      ]
      notes.forEach(({ f, t, dur, v }) => {
        const osc = audioCtx.createOscillator()
        const g = audioCtx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(f, now + t)
        g.gain.setValueAtTime(0.0001, now + t)
        g.gain.exponentialRampToValueAtTime(v * 0.16, now + t + 0.01)
        g.gain.exponentialRampToValueAtTime(0.0001, now + t + dur)
        osc.connect(g)
        g.connect(sfxGain)
        osc.start(now + t)
        osc.stop(now + t + dur + 0.02)
      })
    } catch (_) {}
  }

  // Gentle, encouraging try-again tone
  function playTryAgainSound() {
    if (!soundEnabled) return
    initAudio()
    if (!audioCtx) return

    try {
      const now = audioCtx.currentTime
      const notes = [
        { f: NOTE.F4, t: 0.0, dur: 0.2, v: 0.4 },
        { f: NOTE.D4, t: 0.12, dur: 0.32, v: 0.35 }
      ]
      notes.forEach(({ f, t, dur, v }) => {
        const osc = audioCtx.createOscillator()
        const g = audioCtx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(f, now + t)
        g.gain.setValueAtTime(0.0001, now + t)
        g.gain.exponentialRampToValueAtTime(v * 0.15, now + t + 0.015)
        g.gain.exponentialRampToValueAtTime(0.0001, now + t + dur)
        osc.connect(g)
        g.connect(sfxGain)
        osc.start(now + t)
        osc.stop(now + t + dur + 0.02)
      })
    } catch (_) {}
  }

  // Distinct Web Audio Musical Fanfare per Biome/Map
  function playBiomeFanfare(biomeId) {
    if (!soundEnabled || !audioCtx || audioCtx.state !== 'running') return

    try {
      const now = audioCtx.currentTime
      let notes = []

      if (biomeId === 'emerald') {
        // Cloverfield: Folk Celtic harp arpeggio (C major pentatonic)
        notes = [
          { f: NOTE.C5, t: 0.00, dur: 0.18, v: 0.55, type: 'triangle' },
          { f: NOTE.E5, t: 0.08, dur: 0.18, v: 0.60, type: 'triangle' },
          { f: NOTE.G5, t: 0.16, dur: 0.22, v: 0.68, type: 'triangle' },
          { f: NOTE.A5, t: 0.24, dur: 0.25, v: 0.75, type: 'triangle' },
          { f: NOTE.C6, t: 0.34, dur: 0.70, v: 0.85, type: 'sine' }
        ]
      } else if (biomeId === 'candy') {
        // Sugarplum: Sweet music box glockenspiel waltz
        notes = [
          { f: NOTE.G5, t: 0.00, dur: 0.14, v: 0.50, type: 'sine' },
          { f: NOTE.C6, t: 0.07, dur: 0.14, v: 0.60, type: 'sine' },
          { f: NOTE.E6, t: 0.14, dur: 0.16, v: 0.70, type: 'sine' },
          { f: NOTE.G6, t: 0.21, dur: 0.20, v: 0.80, type: 'sine' },
          { f: NOTE.C7, t: 0.30, dur: 0.65, v: 0.75, type: 'sine' }
        ]
      } else if (biomeId === 'autumn') {
        // Pinecone: Warm acoustic woodwind cadence
        notes = [
          { f: NOTE.F4, t: 0.00, dur: 0.22, v: 0.52, type: 'triangle' },
          { f: NOTE.A4, t: 0.10, dur: 0.22, v: 0.60, type: 'triangle' },
          { f: NOTE.C5, t: 0.20, dur: 0.26, v: 0.70, type: 'triangle' },
          { f: NOTE.E5, t: 0.30, dur: 0.30, v: 0.78, type: 'triangle' },
          { f: NOTE.D5, t: 0.42, dur: 0.75, v: 0.82, type: 'triangle' }
        ]
      } else if (biomeId === 'tropical') {
        // Sunken Pearl: Island steel-drum / marimba bounce
        notes = [
          { f: NOTE.E5, t: 0.00, dur: 0.14, v: 0.65, type: 'triangle' },
          { f: NOTE.G5, t: 0.09, dur: 0.14, v: 0.70, type: 'triangle' },
          { f: NOTE.A5, t: 0.18, dur: 0.16, v: 0.75, type: 'triangle' },
          { f: NOTE.G5, t: 0.26, dur: 0.18, v: 0.70, type: 'triangle' },
          { f: NOTE.C6, t: 0.36, dur: 0.65, v: 0.88, type: 'sine' }
        ]
      } else if (biomeId === 'frosty') {
        // Snowflake: Crystalline icy celesta chimes
        notes = [
          { f: NOTE.E6, t: 0.00, dur: 0.25, v: 0.60, type: 'sine' },
          { f: NOTE.B5, t: 0.08, dur: 0.25, v: 0.55, type: 'sine' },
          { f: NOTE.G5 * 1.05946, t: 0.16, dur: 0.30, v: 0.68, type: 'sine' },
          { f: NOTE.B6, t: 0.26, dur: 0.80, v: 0.82, type: 'sine' }
        ]
      } else if (biomeId === 'galaxy') {
        // Cosmic Bay: Sci-fi resonant space synth glide
        notes = [
          { f: NOTE.C4, t: 0.00, dur: 0.40, v: 0.60, type: 'triangle' },
          { f: NOTE.G4, t: 0.10, dur: 0.40, v: 0.65, type: 'triangle' },
          { f: NOTE.D5 * 1.05946, t: 0.20, dur: 0.45, v: 0.75, type: 'sine' },
          { f: NOTE.A5 * 1.05946, t: 0.30, dur: 0.55, v: 0.80, type: 'sine' },
          { f: NOTE.C6, t: 0.42, dur: 0.95, v: 0.85, type: 'sine' }
        ]
      }

      notes.forEach(({ f, t, dur, v, type }) => {
        const osc = audioCtx.createOscillator()
        const g = audioCtx.createGain()
        osc.type = type || 'sine'
        osc.frequency.setValueAtTime(f, now + t)
        g.gain.setValueAtTime(0.0001, now + t)
        g.gain.exponentialRampToValueAtTime(v * 0.28, now + t + 0.015)
        g.gain.exponentialRampToValueAtTime(0.0001, now + t + dur)
        osc.connect(g)
        g.connect(sfxGain)
        osc.start(now + t)
        osc.stop(now + t + dur + 0.04)
      })
    } catch (_) {}
  }

  // Triumphant victory fanfare when quest is complete
  function playCelebrationFanfare() {
    if (!soundEnabled) return
    initAudio()
    if (!audioCtx) return

    try {
      const now = audioCtx.currentTime
      const notes = [
        { f: NOTE.C5, t: 0.00, dur: 0.18, v: 0.6 },
        { f: NOTE.E5, t: 0.14, dur: 0.18, v: 0.65 },
        { f: NOTE.G5, t: 0.28, dur: 0.20, v: 0.7 },
        { f: NOTE.C6, t: 0.42, dur: 0.65, v: 0.9 },
        // Grand victory chord sustained
        { f: NOTE.C5, t: 0.85, dur: 1.5, v: 0.7 },
        { f: NOTE.G5, t: 0.85, dur: 1.5, v: 0.75 },
        { f: NOTE.C6, t: 0.85, dur: 1.6, v: 0.85 },
        { f: NOTE.E6, t: 0.85, dur: 1.8, v: 0.9 }
      ]
      notes.forEach(({ f, t, dur, v }) => {
        const osc = audioCtx.createOscillator()
        const g = audioCtx.createGain()
        osc.type = t >= 0.85 ? 'triangle' : 'sine'
        osc.frequency.setValueAtTime(f, now + t)
        g.gain.setValueAtTime(0.0001, now + t)
        g.gain.exponentialRampToValueAtTime(v * 0.18, now + t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, now + t + dur)
        osc.connect(g)
        g.connect(sfxGain)
        osc.start(now + t)
        osc.stop(now + t + dur + 0.05)
      })
    } catch (_) {}
  }

  function beep(success) {
    if (success) playStarCollectSound()
    else playTryAgainSound()
  }

  function requestDeviceRecording() {
    if (!currentTarget || evaluationPending) return
    if (window.parent === window) {
      if (window._directSocket && window._directSocket.readyState === WebSocket.OPEN) {
        speechReady = true
        evaluationPending = true
        micIndicator.dataset.state = 'listening'
        micLabel.textContent = 'LISTENING... SPEAK NOW!'
        feedback.className = 'feedback'
        feedback.textContent = 'Speak clearly into the microphone...'
        window._directSocket.send(JSON.stringify({
          type: 'CMD_PROMPT_WORD',
          word: currentTarget.word,
          mode: 'GARDEN',
          countdown_done: true,
        }))
        return
      }
      feedback.textContent = 'Open Speech Quest through the app with the ESP32 connected.'
      return
    }
    speechReady = true
    evaluationPending = true
    micIndicator.dataset.state = 'listening'
    micLabel.textContent = 'LISTENING... SPEAK NOW!'
    feedback.className = 'feedback'
    feedback.textContent = 'Speak clearly into the microphone...'
    window.parent.postMessage({ type: 'SPEECH_QUEST_SPEAK_REQUEST', word: currentTarget.word }, window.location.origin)
  }

  function finishEvaluation(said, correct) {
    if (!currentTarget) return
    evaluationPending = false
    if (!correct) {
      feedback.className = 'feedback'
      feedback.textContent = said.trim()
        ? `I heard "${said}" — try again!`
        : `Didn't catch that. Say "${currentTarget.word}" again!`
      speechReady = true
      micIndicator.dataset.state = 'waiting'
      micLabel.textContent = 'SAY IT AGAIN 🎙'
      playTryAgainSound()
      sendQuestStatus('TRY_AGAIN')
      return
    }
    collected.add(currentTarget.index)
    score += 10
    player.happyUntil = performance.now() + 1500
    addStarBurst(currentTarget.x, currentTarget.y)
    updateHud()
    feedback.className = 'feedback success'
    feedback.textContent = `AWESOME — YOU GOT IT! "${currentTarget.word}"`
    micLabel.textContent = 'COLLECTED! ⭐'
    micIndicator.dataset.state = 'evaluating'
    playStarCollectSound()
    sendQuestStatus('CORRECT')
    isCelebrating = true
    window.setTimeout(() => {
      challenge.hidden = true
      currentTarget = null
      isCelebrating = false
      duckBgm(false)
      if (collected.size === levels[currentLevel].objects.length) showCelebration()
      else sendQuestStatus('MOVE')
    }, 1300)
  }

  function showCelebration() {
    isCelebrating = true
    sendQuestStatus('COMPLETE')
    duckBgm(false)
    playCelebrationFanfare()
    document.querySelector('#final-found').textContent = `You found ${collected.size} / ${levels[currentLevel].objects.length} objects!`
    document.querySelector('#final-score').textContent = String(score)
    celebration.hidden = false
    for (let i = 0; i < 75; i++) {
      const x = player.x + (Math.random() - .5) * 500
      const y = player.y + (Math.random() - .5) * 320
      particles.push({ 
        x, 
        y, 
        vx: (Math.random() - .5) * 140, 
        vy: -50 - Math.random() * 150, 
        life: 1.5 + Math.random(), 
        age: 0, 
        size: 6 + Math.random() * 10,
        color: ['#fde047', '#f59e0b', '#38bdf8', '#4ade80', '#ffffff'][i % 5]
      })
    }
  }

  function startLevel(key) {
    if (!levels[key]) return
    currentLevel = key
    score = 0
    collected.clear()
    currentTarget = null
    evaluationPending = false
    speechReady = false
    isCelebrating = false
    challenge.hidden = true
    celebration.hidden = true
    player.targetX = player.x; player.targetY = player.y; player.happyUntil = 0
    currentGridX = Math.max(0, Math.min(7, Math.round((player.x - gridOrigin.x) / gridStep.x)))
    currentGridY = Math.max(0, Math.min(3, Math.round((player.y - gridOrigin.y) / gridStep.y)))
    waypoints.length = 0
    movement.x = 0; movement.y = 0
    const level = levels[key]
    randomizeBiome()
    levelLabel.textContent = `LEVEL ${level.number}`
    document.querySelectorAll('.level-button').forEach((button) => {
      const selected = button.dataset.level === key
      button.classList.toggle('active', selected)
      button.setAttribute('aria-pressed', String(selected))
    })
    updateHud()
    sendQuestStatus('MOVE')
  }

  document.querySelector('#speak-word')?.addEventListener('click', speakTarget)
  micIndicator.style.cursor = 'pointer'
  micIndicator.addEventListener('click', () => { if (!currentTarget || evaluationPending) return; speechReady = true; requestDeviceRecording(); })

  document.querySelectorAll('.level-button').forEach((button) => button.addEventListener('click', () => startLevel(button.dataset.level)))
  document.querySelector('#play-again')?.addEventListener('click', () => {
    randomizeBiome()
    startLevel(currentLevel)
  })

  // Unlock Web Audio context and start cheerful BGM on any user interaction
  const unlockAudioOnGesture = () => {
    activateAudio()
  }
  ['pointerdown', 'mousedown', 'keydown', 'touchstart', 'click', 'mousemove'].forEach((evt) => {
    window.addEventListener(evt, unlockAudioOnGesture, { passive: true })
    document.addEventListener(evt, unlockAudioOnGesture, { passive: true })
    if (canvas) canvas.addEventListener(evt, unlockAudioOnGesture, { passive: true })
  })

  updateHud()
})()
