/**
 * @author Arkadiusz Buras
 */

var WaypointBrush = new Brush({
  waypoints: [],
  selectedWaypoint: null,
  selectedHandler: null,
  dx: 0,
  dy: 0,
  
  init: function(){
    var self = this;
    $('#waypoint_type').live("change",function(){
      var val = parseInt($(this).val());
      self.selectedWaypoint.type = val;
      if(val == 0) {
        $("#control_points").hide();
      } else {
        $("#control_points").show();
      }
      
    }).trigger("change");
    
    $("#waypoints li").live("click", function(){
      var id = parseInt($(this).attr("data-id"));
      $.each(self.waypoints, function(){ 
        var waypoint = this;
        if(waypoint.id == id) {
          self.selectedWaypoint = waypoint;
        }
      });
      
      self.refresh();
    });
  },
  
  refreshControlPoint: function() {
    var self = this;
    $('#waypoint_control_point1').val(self.selectedWaypoint.cpx + ":" + self.selectedWaypoint.cpy);
    
    if(self.selectedWaypoint.havePath()) {
      $('#waypoint_control_point2').val(self.selectedWaypoint.parent.cpx + ":" + self.selectedWaypoint.parent.cpy);
    }
  },
  
  refresh: function () {
    var self = this;
    $('#waypoints li').removeClass("selected");
    $("#waypoint_parent option").remove();
    $("#waypoint_parent").append("<option>None</option>");
    
    $.each(self.waypoints, function(){
      var waypoint = this;
      var way_dom = ["#", "waypoint_"+waypoint.id].join("");
      var li = $(way_dom);
      var option = $("<option value='"+waypoint.id+"'>"+waypoint.name+"</option>");
      if(li[0] == undefined) {
        $('#waypoints').append("<li id='"+"waypoint_"+waypoint.id+"' data-id='"+waypoint.id+"'>"+waypoint.name+"</li>");
        li = $(way_dom);
      }
      
      if(self.selectedWaypoint == waypoint) {
        li.addClass("selected");
      }
      
      $("#waypoint_parent").append(option);
    });
    
    $('#waypoint_name').val(self.selectedWaypoint.name);
    $('#waypoin_position').val(self.selectedWaypoint.x + ":" + self.selectedWaypoint.y);
    $('#waypoint_type').val(self.selectedWaypoint.type);
    $('#waypoint_type').change();
    
    self.refreshControlPoint();
    if(self.selectedWaypoint.parent) {
      $("#waypoint_parent").val(self.selectedWaypoint.parent.id);
    }else{
      $("#waypoint_parent").val("None");
    }
    $('#waypoint_children option').remove();
    
    if(self.selectedWaypoint.children.length > 0) {
      $.each(self.selectedWaypoint.children, function(){
        var waypoint = this;
        var option = $("<option value='"+waypoint.id+"'>"+waypoint.name+"</option>");
        $('#waypoint_children').append(option);
      });
    } else {
      $("#waypoint_children").append("<option>None</option>");
    }
  },
  
  mouseUp: function(px, py) {
    this.selectedHandler = null;
  },
  
  mouseMove: function(px, py) {
    if(this.selectedHandler) {
      this.selectedHandler.cpx += px - this.dx;
      this.selectedHandler.cpy += py - this.dy;
      this.dx = px;
      this.dy = py;
      this.refreshControlPoint();
    }
  },
  
  mouseDown: function(px,py){
    var self = this;
    var haveSelectedWaypoint = false;
    var rect = new Rect(px-self.map.tile_size/2, py-self.map.tile_size/2, self.map.tile_size,self.map.tile_size);
    var controlRect = new Rect(px-4, py-4, 8,8);
    var sorted_waypoints = self.waypoints.sort(function(a,b) { return b.type - a.type; });
    for (var i=0; i < sorted_waypoints.length; i++) {
      var w = self.waypoints[i];
      if (w.havePath() && controlRect.in(w.cpx, w.cpy)) {
        console.log("Control Point handler");
        self.selectedWaypoint = w;
        self.selectedHandler = w;
        haveSelectedWaypoint = true;
        self.dy = py;
        self.dx = px;
        break;
      } else if (rect.in(w.x, w.y)) {
        self.selectedWaypoint = w;
        haveSelectedWaypoint = true;
        break;
      }
     };
      
    if (!haveSelectedWaypoint) {
      var waypoint = new Waypoint(self.stage.snapPoint(px),self.stage.snapPoint(py));
      waypoint.cpx = px + 25;
      waypoint.cpy = py + 25;
      waypoint.id = self.waypoints.length;
      waypoint.name = "Waypoint "+waypoint.id;
      if (self.selectedWaypoint) {
        self.selectedWaypoint.addChild(waypoint);
      };
      self.waypoints.push(waypoint);
      self.selectedWaypoint = waypoint;
      window.location.hash = "waypoint_"+self.selectedWaypoint.id;
    }
    
  },
  
  rightClick: function(x,y){
    var self = this;
    var rect = new Rect(x-self.map.tile_size/2, y-self.map.tile_size/2, self.map.tile_size,self.map.tile_size);
    for (var i=0; i < self.waypoints.length; i++) {
      var w = self.waypoints[i];
      if (rect.in(w.x,w.y)) {
        self.selectedWaypoint.addChild(w);
        self.selectedWaypoint = w;
        //self.waypoints.push(w);
      break;
      }
    };
  },
  
  render: function() {
    for (var i=0; i < this.waypoints.length; i++) {
      var waypoint = this.waypoints[i];
      var wayColor = "red";
      
      if ((this.selectedWaypoint.x == waypoint.x && this.selectedWaypoint.y == waypoint.y)) {
        wayColor = "blue";
      } else {
        wayColor = "green";
      }
      /*
      if (waypoint.parent) {
        this.engine.drawLinePath(wayColor, 2, [
          { x: this.viewport.screenX(waypoint.parent.x+16), y: this.viewport.screenY(waypoint.parent.y+16) },
          { x: this.viewport.screenX(waypoint.x+16), y: this.viewport.screenY(waypoint.y+16) }
        ]);
      }*/

      this.engine.fillRect(wayColor,  this.viewport.screenX(waypoint.x-4),  this.viewport.screenY(waypoint.y-4), 8,8);
      
      for (var a=0; a < waypoint.children.length; a++) {
        var child = waypoint.children[a];
        
        if(child.type == Waypoint.Path) {
          this.engine.drawCurve(wayColor, 2, this.viewport.screenX(child.x), this.viewport.screenY(child.y), this.viewport.screenX(waypoint.x), this.viewport.screenY(waypoint.y), this.viewport.screenX(child.cpx), this.viewport.screenY(child.cpy), this.viewport.screenX(waypoint.cpx), this.viewport.screenY(waypoint.cpy));
          
          this.engine.drawLinePath("yellow", 2, [
            { x: this.viewport.screenX(child.x), y: this.viewport.screenY(child.y) },
            { x: this.viewport.screenX(child.cpx), y: this.viewport.screenY(child.cpy) }
          ]);
          this.engine.fillRect("yellow",  this.viewport.screenX(child.cpx-4),  this.viewport.screenY(child.cpy-4), 8,8);
          this.engine.drawLinePath("yellow", 2, [
            { x: this.viewport.screenX(waypoint.x), y: this.viewport.screenY(waypoint.y) },
            { x: this.viewport.screenX(waypoint.cpx), y: this.viewport.screenY(waypoint.cpy) }
          ]);
          this.engine.fillRect("yellow",  this.viewport.screenX(waypoint.cpx-4),  this.viewport.screenY(waypoint.cpy-4), 8,8);
        } else {
          this.engine.drawLinePath(wayColor, 2, [
            { x: this.viewport.screenX(child.x), y: this.viewport.screenY(child.y) },
            { x: this.viewport.screenX(waypoint.x), y: this.viewport.screenY(waypoint.y) }
          ]);
        }
        this.engine.fillRect(wayColor,  this.viewport.screenX(child.x-4),  this.viewport.screenY(child.y-4), 8,8);
      };
    };
    
  }
});
