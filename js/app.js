(function() {
  var $allColors, $colors, COLORS, CURRENT_COLOR, CURRENT_COLORWHEEL_ROTATION, FORCE, IS_TOUCH, LAST_TOUCH_X, LAST_TOUCH_Y, MAX_PARTICLES, MOUSEDOWN, PARTICLES, POOL, Particle, canvas, init, setActiveColor, setupColorClick;

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

  MAX_PARTICLES = 1400;

  PARTICLES = [];

  POOL = [];

  MOUSEDOWN = false;

  LAST_TOUCH_X = void 0;

  LAST_TOUCH_Y = void 0;

  $colors = document.querySelector('.colors');

  $allColors = document.querySelectorAll('.colors [data-color]');

  init = function() {
    setActiveColor('red');
    return setupColorClick();
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
      return $color.addEventListener('click', function() {
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
      this.radius = radius || 10;
      this.rgb = [255, 255, 255];
      this.alpha = 1;
      this.x = x || 0.0;
      this.y = y || 0.0;
      this.vx = 0.0;
      return this.vy = 0.0;
    },
    move: function() {
      var i, timeSinceCreated, _results;
      timeSinceCreated = +(new Date) - this.created;
      if (timeSinceCreated <= .5 * 1000) {
        this.radius *= 0.97;
        this.y -= .0001;
        i = 0;
        _results = [];
        while (i < 3) {
          if (Math.abs(this.targetRgb[i] - this.rgb[i]) > 3) {
            this.rgb[i] += (this.targetRgb[i] - this.rgb[i]) * .1;
            this.rgb[i] = Math.floor(this.rgb[i]);
          }
          _results.push(i++);
        }
        return _results;
      } else if (timeSinceCreated > 1.5 * 1000) {
        if (timeSinceCreated > 2 * 1000) {
          this.radius *= 1.016;
          this.y += this.vy;
          this.vy *= 0.95;
        }
        this.alpha *= 0.95;
        return this.alive = this.alpha > .01;
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

  canvas.spawn = function(x, y) {
    var particle;
    if (PARTICLES.length >= MAX_PARTICLES) {
      POOL.push(PARTICLES.shift());
    }
    particle = (POOL.length ? POOL.pop() : new Particle());
    particle.init(x, y, 8);
    particle.targetRgb = COLORS[CURRENT_COLOR].rgb;
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

  canvas.mousedown = function() {
    return MOUSEDOWN = true;
  };

  canvas.mouseup = function() {
    MOUSEDOWN = false;
    LAST_TOUCH_X = null;
    return LAST_TOUCH_Y = null;
  };

  canvas.mousemove = function() {
    var density, i, j, n, touch;
    if (!(MOUSEDOWN || IS_TOUCH)) {
      return;
    }
    i = 0;
    n = canvas.touches.length;
    while (i < n) {
      touch = canvas.touches[i];
      if (LAST_TOUCH_X == null) {
        LAST_TOUCH_X = touch.x;
        LAST_TOUCH_Y = touch.y;
        return;
      }
      density = (Math.sqrt(Math.pow(touch.x - LAST_TOUCH_X, 2) + Math.pow(touch.y - LAST_TOUCH_Y, 2)) + 1) / 3;
      j = 0;
      while (j < density) {
        canvas.spawn(touch.x - ((touch.x - LAST_TOUCH_X) * (j / density)), touch.y - ((touch.y - LAST_TOUCH_Y) * (j / density)));
        j++;
      }
      LAST_TOUCH_X = touch.x;
      LAST_TOUCH_Y = touch.y;
      i++;
    }
  };

  init();

}).call(this);
