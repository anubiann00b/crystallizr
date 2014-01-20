// Vector class

var Vector = function(x, y) {
  this.x = x;
  this.y = y;
};

Vector.prototype.add = function(other) {
  return new Vector(this.x + other.x, this.y + other.y);
};

Vector.prototype.subtract = function(other) {
  return new Vector(this.x - other.x, this.y - other.y);
};

Vector.prototype.magnitude = function() {
  return Math.sqrt(Math.pow(this.x, 2.0) + Math.pow(this.y, 2.0));
};


Vector.prototype.scale = function(scalar) {
  return new Vector(this.x * scalar, this.y * scalar);
};

Vector.prototype.normalize = function() {
  var magnitude = this.magnitude();
  return new Vector(this.x / magnitude, this.y / magnitude);
}; 

// Point class

var Point = function(position_vector, velocity_vector, color, radius, balance_distance) {
  this.position = position_vector;
  this.velocity = velocity_vector;
  this.color = color;
  this.radius = radius;
  this.balance_distance = balance_distance;
};

Point.prototype.update_position = function(delta) {
  this.position = this.position.add(this.velocity.scale(delta));
};

Point.prototype.accelerate = function(acceleration_vector) {
  this.velocity = this.velocity.add(acceleration_vector);
};

// World class

var World = function(x_size, y_size) {
  this.x_size = x_size;
  this.y_size = y_size;
  this.points = [];
};

World.prototype.add_point = function(point) {
  this.points.push(point);
};

World.prototype.update_velocities = function(delta) {
  for (var i=0; i < this.points.length; i++) {
    var point = this.points[i];
    //var twiceBalDistSquared = Math.pow(point.balance_distance * 2.0, 2.0); // Can optimize a LOT here. Skip some square roots, skip cals if outside, etc.
    for (var j=0; j < this.points.length; j++) {
      if (i == j) continue; // Skip if we're on the same point
      var target = this.points[j];
      var point_to_target = point.position.subtract(target.position);
      var distance = point_to_target.magnitude();
      var from_balance = Math.abs(distance - point.balance_distance);
      if (distance > (point.balance_distance * sim_config.interaction_cutoff_in_equilibriums)) {

      } else if (distance > point.balance_distance) { // Point is outside balance, attract
        target.accelerate(point_to_target.scale(from_balance).scale(sim_config.attraction_scalar));
        if (sim_config.draw_force_lines) {
          context.moveTo(point.position.x, point.position.y);
          context.lineTo(target.position.x, target.position.y);
          context.strokeStyle = "green";
          context.stroke();
        }
      } else { // Point is inside balance, repel
        target.accelerate(point_to_target.scale(from_balance).scale(sim_config.repulsion_scalar));
        if (sim_config.draw_force_lines) {
          context.moveTo(point.position.x, point.position.y);
          context.lineTo(target.position.x, target.position.y);
          context.strokeStyle = "red";
          context.stroke();
        }
      }
    }
  }
};

World.prototype.bound_points_deprecated = function(delta) {
  for (var i=0; i < this.points.length; i++) {
    var point = this.points[i];
    if (point.position.x > this.x_size) {
      point.velocity.x *= -0.1;
      point.position.x = this.x_size - point.radius;
    }
    if (point.position.x < 0) {
      point.velocity.x *= -0.1;
      point.position.x = point.radius;
    }
    if (point.position.y > this.y_size) {
      point.velocity.y *= -0.1;
      point.position.y = this.y_size - point.radius;
    }
    if (point.position.y < 0) {
      point.velocity.y *= -0.1;
      point.position.y = point.radius;
    }
  }
};

World.prototype.bound_points = function(delta) {
  for (var i=0; i < this.points.length; i++) {
    var point = this.points[i];
    var friction = 0; // This is dumb. Might just swap out with a =[0, 0] at some point
    if (point.position.x > this.x_size - point.radius) {
      point.velocity = point.velocity.scale(friction);
      point.position.x = this.x_size - point.radius;
    }
    if (point.position.x < point.radius) {
      point.velocity = point.velocity.scale(friction);
      point.position.x = point.radius;
    }
    if (point.position.y > this.y_size - point.radius) {
      point.velocity = point.velocity.scale(friction);
      point.position.y = this.y_size - point.radius;
    }
    if (point.position.y < point.radius) {
      point.velocity = point.velocity.scale(friction);
      point.position.y = point.radius;
    }
  }
};

World.prototype.apply_drag_to_points = function(delta) {
  for (var i=0; i < this.points.length; i++) {
    var point = this.points[i];
    point.velocity = point.velocity.scale(sim_config.drag_multiplier * delta);
  }
};

World.prototype.update_positions = function(delta) {
  for (var i=0; i < this.points.length; i++) {
    var point = this.points[i];
    point.update_position(delta);
  }
};

World.prototype.apply_gravity_to_points = function(delta) {
  for (var i=0; i < this.points.length; i++) {
    var point = this.points[i];
    point.accelerate(new Vector(0, sim_config.gravity_strength));
  }
}

World.prototype.tick = function(delta) {
  this.update_velocities(delta);
  if (!(mouse_pressed && shift_pressed)) this.apply_gravity_to_points(delta);
  this.bound_points(delta);
  this.apply_drag_to_points(delta);
  this.update_positions(delta);
};

// Rendering

function get_random_color() {
  var letters = "0123456789ABCDEF".split("");
  var color = "#";
  for (var i = 0; i < 6; i++ ) {
      color += letters[Math.round(Math.random() * 15)];
  }
  return color;
};

function render_world(world, context) {
  if (mouse_pressed && shift_pressed) {
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
  } else {
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
  }
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  for (var i=0; i < world.points.length; i++) {
    var point = world.points[i];
    context.fillStyle = point.color;
    context.beginPath();
    context.arc(point.position.x, point.position.y, point.radius, 0, Math.PI*2, true); 
    context.closePath();
    context.fill();
  }
};

var get_offset = function(el) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
};

// Calculate handy values based on windows size
var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;

// Height of the canvas and world
var width = x * 0.95;
var height = y * 0.9;

// Parameters of simulation
var sim_config = {
  attraction_scalar: 0.0001,
  repulsion_scalar: -0.01, 
  drag_multiplier: 0.95,
  gravity_strength: 0.1,
  interaction_cutoff_in_equilibriums: 2.0,
  equilibrium_distance: 50.0,
  point_radius: 5.0,
  point_shooting_scalar: 0.3,
  draw_force_lines: false
};

// Canvas and context
var canvas = document.getElementById("canvas-0");
var context = canvas.getContext("2d");

// Offsets based on canvas position in page
var canvas_offset = get_offset(canvas);
var x_offset = canvas_offset.left;
var y_offset = canvas_offset.top;

// Used as temporary variables to hold origin of a drag motion
var drag_x = 0;
var drag_y = 0;

// Toggles to hold state of shift and mouse
var shift_pressed = false;
var mouse_pressed = false;

// Initialize canvas object size based on above defined heights
canvas.width = width;
canvas.height = height;

// Create world with above defined heights
var world = new World(width, height);

// Define event listeners
var handleMouseUp = function(event) { 
  mouse_pressed = false;
  canvas.style.cursor = "crosshair";
  if (!shift_pressed) {
    world.add_point(new Point(new Vector(drag_x, drag_y), 
                              (new Vector(event.pageX - x_offset, event.pageY - y_offset)).subtract(new Vector(drag_x, drag_y)).scale(sim_config.point_shooting_scalar), 
                              get_random_color(), sim_config.point_radius, sim_config.equilibrium_distance));
  }
  shift_pressed = false; // This prevents a bad race condition we were experiencing
};
var handleMouseDown = function(event) {
  mouse_pressed = true;
  drag_x = event.pageX - x_offset;
  drag_y = event.pageY - y_offset;
  canvas.style.cursor = "move";
};
var handleKeyDown = function(event) {
  if (event.shiftKey) {
    shift_pressed = true;
  }
};
var handleKeyUp = function(event) {
  if (event.keyCode == 16) {
    //shift_pressed = false; // We don't use this because of a race condition.
  }
};
var handleMouseMove = function(event) {
  var real_x = event.clientX - x_offset;
  var real_y = event.clientY - y_offset;
  if (shift_pressed && mouse_pressed) {
    for (var i=0; i < world.points.length; i++) {
      var point = world.points[i];
      point.accelerate((new Vector(real_x, real_y).subtract(new Vector(drag_x, drag_y))).scale(0.1));
    }
    drag_x = real_x;
    drag_y = real_y;
  } else if (mouse_pressed) {
    // Draw lines showing point to be thrown
    context.moveTo(drag_x, drag_y);
    context.lineTo(real_x, real_y);
    context.strokeStyle = "green";
    context.stroke();
  }
}

// Assign event listeners
canvas.addEventListener("mouseup", handleMouseUp, false);
canvas.addEventListener("mousedown", handleMouseDown, false);
canvas.addEventListener("keyup", handleKeyUp, false);
canvas.addEventListener("keydown", handleKeyDown, false);
canvas.addEventListener("mousemove", handleMouseMove, false);

// Initially fill the screen with a color to prevent trails problem we were experiencing
context.fillStyle = "green";
context.fillRect(0, 0, context.canvas.width, context.canvas.height);

// Start the main game loop
window.setInterval(function() {
  world.tick(1.0);
  render_world(world, context);
}, 0);