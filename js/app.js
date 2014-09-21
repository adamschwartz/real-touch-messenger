(function() {
  var $allColors, $colors, COLORS, CURRENT_COLOR, CURRENT_COLORWHEEL_ROTATION, FORCE, GENERATIONS, INITIAL_RADIUS, IS_TOUCH, LAST_TOUCHES, LINES, MAX_PARTICLES, MOUSEDOWN, PARTICLES, POOL, Particle, canvas, generationTimeout, init, log, setActiveColor, setupColorClick;

  COLORS = {
    red: {
      rgb: [189, 0, 3],
      wheelPositionDegrees: 0,
      collapsedOffsetYPercent: -35
    },
    purple: {
      rgb: [197, 0, 209],
      wheelPositionDegrees: 60,
      collapsedOffsetYPercent: -35
    },
    orange: {
      rgb: [210, 60, 6],
      wheelPositionDegrees: 300,
      collapsedOffsetYPercent: -35
    },
    white: {
      rgb: [203, 177, 194],
      wheelPositionDegrees: 0,
      collapsedOffsetYPercent: -42
    },
    green: {
      rgb: [15, 221, 7],
      wheelPositionDegrees: 120,
      collapsedOffsetYPercent: -35
    },
    yellow: {
      rgb: [207, 187, 8],
      wheelPositionDegrees: 240,
      collapsedOffsetYPercent: -35
    },
    blue: {
      rgb: [105, 210, 231],
      wheelPositionDegrees: 180,
      collapsedOffsetYPercent: -35
    }
  };

  IS_TOUCH = 'ontouchstart' in document.documentElement;

  CURRENT_COLOR = void 0;

  CURRENT_COLORWHEEL_ROTATION = void 0;

  FORCE = -.15;

  MAX_PARTICLES = 4000;

  PARTICLES = [];

  POOL = [];

  GENERATIONS = [];

  LINES = [];

  INITIAL_RADIUS = 2;

  MOUSEDOWN = false;

  LAST_TOUCHES = [];

  $colors = document.querySelector('.colors');

  $allColors = document.querySelectorAll('.colors [data-color]');

  log = function(message) {
    return document.querySelector('.console').insertAdjacentHTML('afterbegin', "" + message + "\n");
  };

  init = function() {
    setActiveColor('red');
    setupColorClick();
    return document.addEventListener('DOMContentLoaded', function() {
      return document.body.classList.add('loaded');
    });
  };

  setActiveColor = function(color) {
    var offsetYPercent, scale, transform, wheelDelta, wheelPositionDegrees;
    CURRENT_COLOR = color;
    Array.prototype.forEach.call($allColors, function($color) {
      return $color.classList.remove('current');
    });
    document.querySelector(".colors [data-color='" + color + "']").classList.add('current');
    $colors.setAttribute('data-current-color', color);
    scale = 1.0;
    offsetYPercent = 0;
    if ($colors.classList.contains('collapsed')) {
      scale = .2;
      offsetYPercent = COLORS[color].collapsedOffsetYPercent;
    }
    if (!CURRENT_COLORWHEEL_ROTATION) {
      CURRENT_COLORWHEEL_ROTATION = 0;
    }
    wheelPositionDegrees = CURRENT_COLORWHEEL_ROTATION;
    if (color !== 'white') {
      wheelDelta = ((COLORS[color].wheelPositionDegrees - CURRENT_COLORWHEEL_ROTATION) + 720) % 360;
      if (wheelDelta > 180) {
        wheelDelta -= 360;
      }
      wheelPositionDegrees = CURRENT_COLORWHEEL_ROTATION + wheelDelta;
    }
    transform = "translate3d(0, " + offsetYPercent + "%, 0) scale(" + scale + ") rotateZ(" + wheelPositionDegrees + "deg)";
    $colors.style.webkitTransform = transform;
    $colors.style.transform = transform;
    return CURRENT_COLORWHEEL_ROTATION = wheelPositionDegrees;
  };

  setupColorClick = function() {
    return Array.prototype.forEach.call($allColors, function($color) {
      var eventType;
      eventType = IS_TOUCH ? 'touchstart' : 'click';
      return $color.addEventListener(eventType, function(event) {
        event.preventDefault();
        MOUSEDOWN = false;
        if ($colors.classList.contains('collapsed')) {
          $colors.classList.remove('collapsed');
        } else {
          $colors.classList.add('collapsed');
        }
        return setActiveColor($color.getAttribute('data-color'));
      });
    });
  };

  Particle = function(x, y, radius) {
    return this.init(x, y, radius);
  };

  Particle.prototype = {
    init: function(x, y, radius) {
      this.created = +(new Date);
      this.alive = true;
      this.radius = radius || INITIAL_RADIUS;
      this.rgb = [255, 255, 255];
      this.alpha = 1;
      this.x = x || 0.0;
      this.y = y || 0.0;
      this.vx = 0.0;
      this.vy = 0.0;
      this.exploded = false;
      this.explosiondx = 0;
      this.explosiondy = 0;
      return this.radiusdx = null;
    },
    move: function() {
      var i, timeSinceCreated;
      timeSinceCreated = +(new Date) - this.created;
      if (GENERATIONS[this.generation].length < 2) {
        this.radius *= 0.999999;
        this.y -= .0001;
        i = 0;
        this.y += this.vy * .125;
        this.vy *= 0.95;
        if (!this.radiusdx) {
          this.radiusdx = (Math.random() - .5) * .01;
        }
        this.radius += this.radiusdx;
        while (i < 3) {
          if (Math.abs(this.targetRgb[i] - this.rgb[i]) > 3) {
            this.rgb[i] += (this.targetRgb[i] - this.rgb[i]) * .1;
            this.rgb[i] = Math.floor(this.rgb[i]);
          }
          i++;
        }
      }
      if (GENERATIONS[this.generation][1] && (GENERATIONS[this.generation][1] - LINES[this.line] < timeSinceCreated)) {
        if (!this.exploded) {
          this.radius = 2 * Math.random() * Math.random();
          this.y += (Math.random() - .5) * 2;
          this.x += (Math.random() - .5) * 1.5;
          this.explosiondx = (Math.random() - .5) * 2.2;
          this.explosiondy = (Math.random() - .5) * 2.2;
        }
        this.x += this.explosiondx;
        this.y += this.explosiondy;
        this.explosiondx *= .97;
        this.explosiondy *= .97;
        this.exploded = true;
        this.y += (Math.random() - .5) * 1.2;
        this.x += (Math.random() - .5) * 1.2;
        this.radius *= 1.001;
        this.alpha *= 0.95;
        return this.alive = this.alpha > .05;
      }
    },
    draw: function(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, TWO_PI);
      ctx.fillStyle = "rgba(" + this.rgb[0] + ", " + this.rgb[1] + ", " + this.rgb[2] + ", " + this.alpha + ")";
      return ctx.fill();
    }
  };

  canvas = Sketch.create({
    container: document.querySelector('.drawing-surface')
  });

  canvas.setup = function() {};

  canvas.spawn = function(x, y, line, generation) {
    var particle;
    if (PARTICLES.length >= MAX_PARTICLES) {
      POOL.push(PARTICLES.shift());
    }
    particle = (POOL.length ? POOL.pop() : new Particle());
    particle.init(x, y, INITIAL_RADIUS);
    particle.targetRgb = COLORS[CURRENT_COLOR].rgb;
    particle.line = line;
    particle.generation = generation;
    FORCE += (Math.random() - .5) * .04;
    if (FORCE > .4) {
      FORCE = .4;
    }
    if (FORCE < -.4) {
      FORCE = -.4;
    }
    particle.vy = FORCE;
    return PARTICLES.push(particle);
  };

  canvas.update = function() {
    var i, particle, _results;
    i = PARTICLES.length - 1;
    _results = [];
    while (i >= 0) {
      particle = PARTICLES[i];
      if (particle.alive) {
        particle.move();
      } else {
        POOL.push(PARTICLES.splice(i, 1)[0]);
      }
      _results.push(i--);
    }
    return _results;
  };

  canvas.draw = function() {
    var i, _results;
    i = PARTICLES.length - 1;
    _results = [];
    while (i >= 0) {
      PARTICLES[i].draw(canvas);
      _results.push(i--);
    }
    return _results;
  };

  generationTimeout = void 0;

  canvas.touchstart = function() {
    var i, l, n, touch, _i, _len, _ref, _results;
    MOUSEDOWN = true;
    clearTimeout(generationTimeout);
    LINES.push(+(new Date));
    if (!GENERATIONS.length || GENERATIONS[GENERATIONS.length - 1].length === 2) {
      console.log('drawing start');
      GENERATIONS.push([+(new Date)]);
    } else {
      GENERATIONS;
    }
    _ref = canvas.touches;
    _results = [];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      touch = _ref[i];
      l = 0;
      n = Math.random() * 10;
      while (l < n) {
        canvas.spawn(touch.x, touch.y, LINES.length - 1, GENERATIONS.length - 1);
        l++;
      }
      if (LAST_TOUCHES.length < i + 1) {
        _results.push(LAST_TOUCHES.push({
          x: touch.x,
          y: touch.y
        }));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  canvas.touchend = function() {
    clearTimeout(generationTimeout);
    generationTimeout = setTimeout(function() {
      return GENERATIONS[GENERATIONS.length - 1].push(+(new Date));
    }, 2 * 1000);
    MOUSEDOWN = false;
    return LAST_TOUCHES = [];
  };

  canvas.touchmove = function() {
    var density, h, i, j, l, lastTouchX, lastTouchY, n, touch, _ref, _results;
    if (!(MOUSEDOWN || IS_TOUCH)) {
      return;
    }
    i = 0;
    n = canvas.touches.length;
    if (LAST_TOUCHES.length < n - 1) {
      h = 0;
      while (h < n) {
        LAST_TOUCHES.push({
          x: canvas.touches[i].x,
          y: canvas.touches[i].y
        });
        h++;
      }
    }
    _results = [];
    while (i < n) {
      touch = canvas.touches[i];
      if (((_ref = LAST_TOUCHES[i]) != null ? _ref.x : void 0) != null) {
        lastTouchX = LAST_TOUCHES[i].x;
        lastTouchY = LAST_TOUCHES[i].y;
      } else {
        l = 0;
        n = Math.random() * 10;
        while (l < n) {
          canvas.spawn(touch.x, touch.y, LINES.length - 1, GENERATIONS.length - 1);
          l++;
        }
      }
      density = (Math.sqrt(Math.pow(touch.x - lastTouchX, 2) + Math.pow(touch.y - lastTouchY, 2)) + 1) / 2;
      j = 0;
      while (j < density) {
        l = 0;
        n = Math.random() * 10;
        while (l < n) {
          canvas.spawn(touch.x - ((touch.x - lastTouchX) * (j / density)), touch.y - ((touch.y - lastTouchY) * (j / density)), LINES.length - 1, GENERATIONS.length - 1);
          l++;
        }
        j++;
      }
      LAST_TOUCHES[i] = {
        x: touch.x,
        y: touch.y
      };
      _results.push(i++);
    }
    return _results;
  };

  init();

}).call(this);
