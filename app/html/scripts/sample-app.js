/*
    Copyright (c) 2013 Rafael Vega González <rvega@elsoftwarehamuerto.org>

    Dancing Bone Machine is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Dancing Bone Machine is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * Entry point
 */
function main(){
   // You can require additional scripts using requirejs like follows,
   // or you can load scripts by including script tags in the html.
   // The function in the second parameter runs when the scripts are 
   // finished loading.
   requirejs.config({ 
      shim:{ 'scripts/jquery.knob':{ deps: ['scripts/jquery'] } },
   });

   require(['scripts/jquery.knob'], function(){
      // Init PureData engine and load synth.pd patch.
      PD.configurePlayback(44100, 2, false, false, function(){
         PD.openFile('pd/patches', 'synth.pd', function(){
            PD.setActive(true);
            PD.sendFloat(0.5, 'waveform');
            PD.sendFloat(0.5, 'volume');
         });
      });

      var piano = new PianoKeyboard();
      piano.init();

      var knobs = new Knobs();
      knobs.init();

      oscilloscope = new Oscilloscope();
      oscilloscope.init();
   });
}

/**
 * Oscilloscope
 */
Oscilloscope = function(){
   this.w = 0;
   this.h = 0;
   this.jump = 0;
   this.scale = 0;
   this.canvas = null;
   this.context = null;

   this.init = function(){
      setInterval(this._timer, 100);

      // Set dimensions of the canvas. If we do it with css, it'll look scaled and weird
      this.w = $('#oscilloscope').innerWidth()*0.8;
      this.h = $('#oscilloscope').innerHeight()*0.7;
      $('#oscilloscope canvas').attr('width', this.w);
      $('#oscilloscope canvas').attr('height', this.h);

      this.canvas = $('#oscilloscope canvas')[0];
      this.context = this.canvas.getContext('2d');

      // Drawing to the canvas is expensive so we'll draw only every 10 points.
      this.jumpPoints = 10;
      this.jumpPixels = this.w * this.jumpPoints / 512;
      this.scale = this.h/2;
   };

   this._timer = function(){
      PD.readArray('graph1', 512, 0, function(points){
         // Clear canvas
         oscilloscope.canvas.width = oscilloscope.w;

         oscilloscope.context.strokeStyle="#FFEC03";
         var y = 0;
         var i = 0;
         var j = 0;
         for(i=0; i<oscilloscope.w; i=i+oscilloscope.jumpPixels){
            y = oscilloscope.scale + oscilloscope.scale*points[j*oscilloscope.jumpPoints];
            oscilloscope.context.lineTo(i,y);
            oscilloscope.context.stroke();
            j++;
         }
      });
   };
};

/**
 * Knobs
 */
Knobs = function(){
   this.init = function(){
      var w = $('#controls').innerWidth();
      var h = $('#controls').innerHeight();
      var options = {
         'fgColor': '#ffec03',
         'inputColor': '#ffec03',
         'bgColor': '#444444',
         'angleOffset': '-125',
         'angleArc': '250',
         'width': Math.ceil(w * 0.25),
         'height': Math.ceil(w * '0.22')
      };

      var opts2;

      // Wave shape
      opts2 = $.extend({'change': function(v){
         PD.sendFloat(v/100, 'waveform');
      }}, options);
      $("#waveform").knob( opts2 );

      // Volume
      opts2 = $.extend({'change': function(v){
         PD.sendFloat(v/100, 'volume');
      }}, options);
      $("#volume").knob( opts2 );
   };
};

/**
 * Piano Keyboard
 */
PianoKeyboard = function(){
   this.lastKey = -1;
   this.playingNote = -1;

   this.init = function(){
      // Use jQuery to bind click and touch events
      $('.key').bind('mousedown touchstart', $.proxy(this.pressedKey, this)); 
      $('.key').bind('mouseup touchend', $.proxy(this.releasedKey, this));
   };

   this.pressedKey = function(event){
      event.preventDefault();
      
      // Calculate midi note number and send midi note on event
      var key = $(event.currentTarget);
      var octaveNumber = key.closest('.octave').attr('data-octave');
      var noteNumber = octaveNumber*12 + Number(key.attr('data-note-number'));
      $(key).addClass("pressed");
      lastKey=key;
      playingNote=noteNumber;
      PD.sendNoteOn(0, noteNumber, 65);
   };

   this.releasedKey = function(event){ 
      event.preventDefault();

      $(lastKey).removeClass("pressed");
      PD.sendNoteOn(0, playingNote, 0);
      playingNote = -1;
   };
};
