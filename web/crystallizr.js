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
  var magnitude = this.magnitude;
  return new Vector(this.x / this.magnitude, this.y / this.magnitude);
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
    for (var j=0; j < this.points.length; j++) {
      if (i == j) continue; // Skip if we're on the same point
      var target = this.points[j];
      var point_to_target = point.position.subtract(target.position);
      var distance = point_to_target.magnitude();
      var from_balance = Math.abs(distance - point.balance_distance);
      //console.log("Distance is : " + from_balance);
      if (distance > point.balance_distance) { // Point is outside balance, attract
        target.accelerate(point_to_target.scale(from_balance).scale(0.0001));
      } else { // Point is inside balance, repel
        target.accelerate(point_to_target.scale(from_balance).scale(-0.02));
      }
    }
  }
};

World.prototype.bound_points = function(delta) {
  for (var i=0; i < this.points.length; i++) {
    var point = this.points[i];
    if (point.position.x > this.x_size) point.velocity.x *= -1;
    if (point.position.x < 0) point.velocity.x *= -1;
    if (point.position.y > this.y_size) point.velocity.y *= -1;
    if (point.position.y < 0) point.velocity.y *= -1;
  }
};

World.prototype.apply_drag_to_points = function(delta) {
  for (var i=0; i < this.points.length; i++) {
    var point = this.points[i];
    point.velocity = point.velocity.scale(0.9 * delta);
  }
};

World.prototype.update_positions = function(delta) {
  for (var i=0; i < this.points.length; i++) {
    var point = this.points[i];
    point.update_position(delta);
  }
};

World.prototype.tick = function(delta) {
  this.update_velocities(delta);
  this.update_positions(delta);
  this.bound_points(delta);
  this.apply_drag_to_points(delta);
};

// Rendering

function render_world(world, context) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  for (var i=0; i < world.points.length; i++) {
    var point = world.points[i];
    context.fillStyle = point.color;
    context.beginPath();
    context.arc(point.position.x, point.position.y, point.radius, 0, Math.PI*2, true); 
    context.closePath();
    context.fill();
  }
};

var width = 1000;
var height = 400;

var canvas = document.getElementById("canvas-0");
var context = canvas.getContext("2d");

canvas.width = width;
canvas.height = height;


var world = new World(width, height);

canvas.addEventListener("mousedown", (function(event) { 
    world.add_point(new Point(new Vector(event.pageX, event.pageY), new Vector(0.0, 0.0), "#FF0000", 5, 40.0));
  }), false);

//world.add_point(new Point(new Vector(130.0, 130.0), new Vector(0.0, 0.0), "#00FF00", 5, 40.0));
//world.add_point(new Point(new Vector(200.0, 150.0), new Vector(0.0, 0.0), "#FF0000", 5, 40.0));

//for (var i=0; i < 20; i++) {
//  world.add_point(new Point(new Vector(Math.floor(Math.random() * 200), Math.floor(Math.random() * 200)), new Vector(0.0, 0.0), "#FF0000", 5, 40.0));
//}
window.setInterval(function() {
  world.tick(1);
  render_world(world, context);
}, 1);