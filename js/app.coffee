COLORS =
  red:
    rgb: [189, 0, 3]
    wheelPositionDegrees: 0
    collapsedOffsetYPercent: -35

  purple:
    rgb: [197, 0, 209]
    wheelPositionDegrees: 60
    collapsedOffsetYPercent: -35

  orange:
    rgb: [210, 60, 6]
    wheelPositionDegrees: 300
    collapsedOffsetYPercent: -35

  white:
    rgb: [203, 177, 194]
    wheelPositionDegrees: 0
    collapsedOffsetYPercent: -42

  green:
    rgb: [15, 221, 7]
    wheelPositionDegrees: 120
    collapsedOffsetYPercent: -35

  yellow:
    rgb: [207, 187, 8]
    wheelPositionDegrees: 240
    collapsedOffsetYPercent: -35

  blue:
    rgb: [105, 210, 231]
    wheelPositionDegrees: 180
    collapsedOffsetYPercent: -35

IS_TOUCH = 'ontouchstart' of document.documentElement

CURRENT_COLOR = undefined
CURRENT_COLORWHEEL_ROTATION = undefined
FORCE = -.15

MAX_PARTICLES = 4000
PARTICLES = []
POOL = []
GENERATIONS = []
LINES = []

INITIAL_RADIUS = 2

MOUSEDOWN = false
LAST_TOUCHES = []

$colors = document.querySelector '.colors'
$allColors = document.querySelectorAll '.colors [data-color]'

log = (message) ->
  document.querySelector('.console').insertAdjacentHTML 'afterbegin', "#{ message }\n"

init = ->
  setActiveColor 'red'
  setupColorClick()

  document.addEventListener 'DOMContentLoaded', ->
    document.body.classList.add 'loaded'

setActiveColor = (color) ->
  CURRENT_COLOR = color

  Array::forEach.call $allColors, ($color) ->
    $color.classList.remove 'current'

  document.querySelector(".colors [data-color='#{ color }']").classList.add 'current'
  $colors.setAttribute 'data-current-color', color

  scale = 1.0
  offsetYPercent = 0

  if $colors.classList.contains 'collapsed'
    scale = .2
    offsetYPercent = COLORS[color].collapsedOffsetYPercent

  CURRENT_COLORWHEEL_ROTATION = 0 unless CURRENT_COLORWHEEL_ROTATION
  wheelPositionDegrees = CURRENT_COLORWHEEL_ROTATION

  if color isnt 'white'
    wheelDelta = ((COLORS[color].wheelPositionDegrees - CURRENT_COLORWHEEL_ROTATION) + 720) % 360
    wheelDelta -= 360 if wheelDelta > 180
    wheelPositionDegrees = CURRENT_COLORWHEEL_ROTATION + wheelDelta

  transform = "translate3d(0, #{ offsetYPercent }%, 0) scale(#{ scale }) rotateZ(#{ wheelPositionDegrees }deg)"
  $colors.style.webkitTransform = transform
  $colors.style.transform = transform

  CURRENT_COLORWHEEL_ROTATION = wheelPositionDegrees

setupColorClick = ->
  Array::forEach.call $allColors, ($color) ->
    eventType = if IS_TOUCH then 'touchstart' else 'click'
    $color.addEventListener eventType, (event) ->
      event.preventDefault()
      MOUSEDOWN = false
      if $colors.classList.contains 'collapsed'
        $colors.classList.remove 'collapsed'
      else
        $colors.classList.add 'collapsed'
      setActiveColor $color.getAttribute 'data-color'

Particle = (x, y, radius) ->
  @init x, y, radius

Particle:: =
  init: (x, y, radius) ->
    @created = +new Date
    @alive = true
    @radius = radius or INITIAL_RADIUS
    @rgb = [255, 255, 255]
    @alpha = 1
    @x = x or 0.0
    @y = y or 0.0
    @vx = 0.0
    @vy = 0.0
    @exploded = false
    @explosiondx = 0
    @explosiondy = 0
    @radiusdx = null

  move: ->
    timeSinceCreated = +new Date - @created

    if GENERATIONS[@generation].length < 2
      @radius *= 0.999999
      @y -= .0001
      i = 0

      @y += @vy * .125
      @vy *= 0.95

      if not @radiusdx
        @radiusdx = ((Math.random() - .5) * .01)

      @radius += @radiusdx

      while i < 3
        if Math.abs(@targetRgb[i] - @rgb[i]) > 3
          @rgb[i] += (@targetRgb[i] - @rgb[i]) * .1
          @rgb[i] = Math.floor(@rgb[i])
        i++

    if GENERATIONS[@generation][1] and (GENERATIONS[@generation][1] - LINES[@line] < timeSinceCreated)
      if not @exploded
        @radius = 2 * Math.random() * Math.random()
        @y += (Math.random() - .5) * 2
        @x += (Math.random() - .5) * 1.5
        @explosiondx = (Math.random() - .5) * 2.2
        @explosiondy = (Math.random() - .5) * 2.2

      @x += @explosiondx
      @y += @explosiondy

      @explosiondx *= .97
      @explosiondy *= .97

      @exploded = true

      @y += (Math.random() - .5) * 1.2
      @x += (Math.random() - .5) * 1.2

      @radius *= 1.001

      @alpha *= 0.95
      @alive = @alpha > .05

  draw: (ctx) ->
    ctx.beginPath()
    ctx.arc @x, @y, @radius, 0, TWO_PI
    ctx.fillStyle = "rgba(#{ @rgb[0] }, #{ @rgb[1] }, #{ @rgb[2] }, #{ @alpha })"
    ctx.fill()

canvas = Sketch.create(container: document.querySelector('.drawing-surface'))
canvas.setup = ->

canvas.spawn = (x, y, line, generation) ->
  POOL.push PARTICLES.shift() if PARTICLES.length >= MAX_PARTICLES
  particle = (if POOL.length then POOL.pop() else new Particle())
  particle.init x, y, INITIAL_RADIUS
  particle.targetRgb = COLORS[CURRENT_COLOR].rgb
  particle.line = line
  particle.generation = generation
  FORCE += (Math.random() - .5) * .04
  FORCE = .4 if FORCE > .4
  FORCE = -.4 if FORCE < -.4
  particle.vy = FORCE
  PARTICLES.push particle

canvas.update = ->
  i = PARTICLES.length - 1

  while i >= 0
    particle = PARTICLES[i]
    if particle.alive
      particle.move()
    else
      POOL.push PARTICLES.splice(i, 1)[0]
    i--

canvas.draw = ->
  i = PARTICLES.length - 1

  while i >= 0
    PARTICLES[i].draw canvas
    i--

generationTimeout = undefined

canvas.touchstart = ->
  MOUSEDOWN = true

  clearTimeout generationTimeout

  LINES.push (+ new Date)

  if not GENERATIONS.length or GENERATIONS[GENERATIONS.length - 1].length is 2
    console.log 'drawing start'
    GENERATIONS.push [(+ new Date)]
  else
    GENERATIONS

  for touch, i in canvas.touches
    l = 0
    n = Math.random() * 2
    while l < n
      canvas.spawn touch.x, touch.y, LINES.length - 1, GENERATIONS.length - 1
      l++

    if LAST_TOUCHES.length < i + 1
      LAST_TOUCHES.push
        x: touch.x
        y: touch.y

canvas.touchend = ->
  clearTimeout generationTimeout

  generationTimeout = setTimeout ->
    GENERATIONS[GENERATIONS.length - 1].push (+ new Date)
  , 2 * 1000

  MOUSEDOWN = false
  LAST_TOUCHES = []

canvas.touchmove = ->
  return unless MOUSEDOWN or IS_TOUCH

  i = 0
  n = canvas.touches.length

  if LAST_TOUCHES.length < n - 1
    h = 0
    while h < n
      LAST_TOUCHES.push
        x: canvas.touches[i].x
        y: canvas.touches[i].y

      h++

  while i < n
    touch = canvas.touches[i]

    if LAST_TOUCHES[i]?.x?
      lastTouchX = LAST_TOUCHES[i].x
      lastTouchY = LAST_TOUCHES[i].y
    else
      l = 0
      n = Math.random() * 2
      while l < n
        canvas.spawn touch.x, touch.y, LINES.length - 1, GENERATIONS.length - 1
        l++

    density = (Math.sqrt(Math.pow(touch.x - lastTouchX, 2) + Math.pow(touch.y - lastTouchY, 2)) + 1) / 2

    j = 0
    while j < density
      l = 0
      n = Math.random() * 2
      while l < n
        canvas.spawn touch.x - ((touch.x - lastTouchX) * (j / density)), touch.y - ((touch.y - lastTouchY) * (j / density)), LINES.length - 1, GENERATIONS.length - 1
        l++
      j++

    LAST_TOUCHES[i] =
      x: touch.x
      y: touch.y

    i++

init()