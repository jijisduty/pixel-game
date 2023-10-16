(function (cjs, an) {
  var p; // shortcut to reference prototypes
  var lib = {};
  var ss = {};
  var img = {};
  lib.ssMetadata = [
    {
      name: "tinyTrip_atlas_1",
      frames: [
        [935, 0, 62, 318],
        [340, 252, 62, 318],
        [0, 0, 700, 250],
        [404, 252, 62, 318],
        [702, 0, 230, 158],
        [702, 160, 231, 94],
        [0, 252, 338, 187],
        [596, 348, 81, 46],
        [468, 344, 62, 62],
        [679, 348, 41, 39],
        [532, 344, 62, 62],
        [468, 252, 90, 90],
        [560, 252, 90, 90],
        [652, 256, 90, 90],
        [744, 256, 90, 90],
        [836, 256, 90, 90],
        [928, 320, 90, 90],
      ],
    },
  ];

  (lib.AnMovieClip = function () {
    this.actionFrames = [];
    this.ignorePause = false;
    this.currentSoundStreamInMovieclip;
    this.soundStreamDuration = new Map();
    this.streamSoundSymbolsList = [];

    this.gotoAndPlayForStreamSoundSync = function (positionOrLabel) {
      cjs.MovieClip.prototype.gotoAndPlay.call(this, positionOrLabel);
    };
    this.gotoAndPlay = function (positionOrLabel) {
      this.clearAllSoundStreams();
      var pos = this.timeline.resolve(positionOrLabel);
      if (pos != null) {
        this.startStreamSoundsForTargetedFrame(pos);
      }
      cjs.MovieClip.prototype.gotoAndPlay.call(this, positionOrLabel);
    };
    this.play = function () {
      this.clearAllSoundStreams();
      this.startStreamSoundsForTargetedFrame(this.currentFrame);
      cjs.MovieClip.prototype.play.call(this);
    };
    this.gotoAndStop = function (positionOrLabel) {
      cjs.MovieClip.prototype.gotoAndStop.call(this, positionOrLabel);
      this.clearAllSoundStreams();
    };
    this.stop = function () {
      cjs.MovieClip.prototype.stop.call(this);
      this.clearAllSoundStreams();
    };
    this.startStreamSoundsForTargetedFrame = function (targetFrame) {
      for (var index = 0; index < this.streamSoundSymbolsList.length; index++) {
        if (
          index <= targetFrame &&
          this.streamSoundSymbolsList[index] != undefined
        ) {
          for (var i = 0; i < this.streamSoundSymbolsList[index].length; i++) {
            var sound = this.streamSoundSymbolsList[index][i];
            if (sound.endFrame > targetFrame) {
              var targetPosition = Math.abs(
                ((targetFrame - sound.startFrame) / lib.properties.fps) * 1000
              );
              var instance = playSound(sound.id);
              var remainingLoop = 0;
              if (sound.offset) {
                targetPosition = targetPosition + sound.offset;
              } else if (sound.loop > 1) {
                var loop = targetPosition / instance.duration;
                remainingLoop = Math.floor(sound.loop - loop);
                if (targetPosition == 0) {
                  remainingLoop -= 1;
                }
                targetPosition = targetPosition % instance.duration;
              }
              instance.loop = remainingLoop;
              instance.position = Math.round(targetPosition);
              this.InsertIntoSoundStreamData(
                instance,
                sound.startFrame,
                sound.endFrame,
                sound.loop,
                sound.offset
              );
            }
          }
        }
      }
    };
    this.InsertIntoSoundStreamData = function (
      soundInstance,
      startIndex,
      endIndex,
      loopValue,
      offsetValue
    ) {
      this.soundStreamDuration.set(
        { instance: soundInstance },
        {
          start: startIndex,
          end: endIndex,
          loop: loopValue,
          offset: offsetValue,
        }
      );
    };
    this.clearAllSoundStreams = function () {
      this.soundStreamDuration.forEach(function (value, key) {
        key.instance.stop();
      });
      this.soundStreamDuration.clear();
      this.currentSoundStreamInMovieclip = undefined;
    };
    this.stopSoundStreams = function (currentFrame) {
      if (this.soundStreamDuration.size > 0) {
        var _this = this;
        this.soundStreamDuration.forEach(function (value, key, arr) {
          if (value.end == currentFrame) {
            key.instance.stop();
            if (_this.currentSoundStreamInMovieclip == key) {
              _this.currentSoundStreamInMovieclip = undefined;
            }
            arr.delete(key);
          }
        });
      }
    };

    this.computeCurrentSoundStreamInstance = function (currentFrame) {
      if (this.currentSoundStreamInMovieclip == undefined) {
        var _this = this;
        if (this.soundStreamDuration.size > 0) {
          var maxDuration = 0;
          this.soundStreamDuration.forEach(function (value, key) {
            if (value.end > maxDuration) {
              maxDuration = value.end;
              _this.currentSoundStreamInMovieclip = key;
            }
          });
        }
      }
    };
    this.getDesiredFrame = function (currentFrame, calculatedDesiredFrame) {
      for (var frameIndex in this.actionFrames) {
        if (frameIndex > currentFrame && frameIndex < calculatedDesiredFrame) {
          return frameIndex;
        }
      }
      return calculatedDesiredFrame;
    };

    this.syncStreamSounds = function () {
      this.stopSoundStreams(this.currentFrame);
      this.computeCurrentSoundStreamInstance(this.currentFrame);
      if (this.currentSoundStreamInMovieclip != undefined) {
        var soundInstance = this.currentSoundStreamInMovieclip.instance;
        if (soundInstance.position != 0) {
          var soundValue = this.soundStreamDuration.get(
            this.currentSoundStreamInMovieclip
          );
          var soundPosition = soundValue.offset
            ? soundInstance.position - soundValue.offset
            : soundInstance.position;
          var calculatedDesiredFrame =
            soundValue.start + (soundPosition / 1000) * lib.properties.fps;
          if (soundValue.loop > 1) {
            calculatedDesiredFrame +=
              (((soundValue.loop - soundInstance.loop - 1) *
                soundInstance.duration) /
                1000) *
              lib.properties.fps;
          }
          calculatedDesiredFrame = Math.floor(calculatedDesiredFrame);
          var deltaFrame = calculatedDesiredFrame - this.currentFrame;
          if (deltaFrame >= 0 && this.ignorePause) {
            cjs.MovieClip.prototype.play.call(this);
            this.ignorePause = false;
          } else if (deltaFrame >= 2) {
            this.gotoAndPlayForStreamSoundSync(
              this.getDesiredFrame(this.currentFrame, calculatedDesiredFrame)
            );
          } else if (deltaFrame <= -2) {
            cjs.MovieClip.prototype.stop.call(this);
            this.ignorePause = true;
          }
        }
      }
    };
  }).prototype = p = new cjs.MovieClip();
  // symbols:

  (lib.copy20 = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(0);
  }).prototype = p = new cjs.Sprite();

  (lib.copy4 = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(1);
  }).prototype = p = new cjs.Sprite();

  (lib._22color = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(2);
  }).prototype = p = new cjs.Sprite();

  (lib.bg = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(3);
  }).prototype = p = new cjs.Sprite();

  (lib.Cloud1 = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(4);
  }).prototype = p = new cjs.Sprite();

  (lib.Cloud2 = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(5);
  }).prototype = p = new cjs.Sprite();

  (lib.Cloud3 = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(6);
  }).prototype = p = new cjs.Sprite();

  (lib.Cloudtiny = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(7);
  }).prototype = p = new cjs.Sprite();

  (lib.Grasscubeflip = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(8);
  }).prototype = p = new cjs.Sprite();

  (lib.Grasscube = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(9);
  }).prototype = p = new cjs.Sprite();

  (lib.groundcube = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(10);
  }).prototype = p = new cjs.Sprite();

  (lib.highush1 = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(11);
  }).prototype = p = new cjs.Sprite();

  (lib.highush2 = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(12);
  }).prototype = p = new cjs.Sprite();

  (lib.highush3 = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(13);
  }).prototype = p = new cjs.Sprite();

  (lib.highush4 = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(14);
  }).prototype = p = new cjs.Sprite();

  (lib.highush5 = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(15);
  }).prototype = p = new cjs.Sprite();

  (lib.highush6 = function () {
    this.initialize(ss["tinyTrip_atlas_1"]);
    this.gotoAndStop(16);
  }).prototype = p = new cjs.Sprite();
  // helper functions:

  function mc_symbol_clone() {
    var clone = this._cloneProps(
      new this.constructor(
        this.mode,
        this.startPosition,
        this.loop,
        this.reversed
      )
    );
    clone.gotoAndStop(this.currentFrame);
    clone.paused = this.paused;
    clone.framerate = this.framerate;
    return clone;
  }

  function getMCSymbolPrototype(symbol, nominalBounds, frameBounds) {
    var prototype = cjs.extend(symbol, cjs.MovieClip);
    prototype.clone = mc_symbol_clone;
    prototype.nominalBounds = nominalBounds;
    prototype.frameBounds = frameBounds;
    return prototype;
  }

  (lib.touchy = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_1
    this.shape = new cjs.Shape();
    this.shape.graphics.f().s("#000000").ss(1, 1, 1).p("AArhaIAAC1IhVAAIAAi1g");
    this.shape.setTransform(4.275, -9.05);

    this.shape_1 = new cjs.Shape();
    var sprImg_shape_1 = cjs.SpriteSheetUtils.extractFrame(
      ss["tinyTrip_atlas_1"],
      2
    );
    sprImg_shape_1.onload = function () {
      this.shape_1.graphics
        .bf(sprImg_shape_1, null, new cjs.Matrix2D(1, 0, 0, 1, -350, -125))
        .s()
        .p("AgqBbIAAi0IBVAAIAAC0g");
    }.bind(this);
    this.shape_1.setTransform(4.275, -9.05);

    this.timeline.addTween(
      cjs.Tween.get({})
        .to({ state: [{ t: this.shape_1 }, { t: this.shape }] })
        .wait(1)
    );

    this._renderFirstFrame();
  }).prototype = getMCSymbolPrototype(
    lib.touchy,
    new cjs.Rectangle(-1, -19.1, 10.6, 20.1),
    null
  );

  (lib.Groundcube = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_1
    this.instance = new lib.groundcube();
    this.instance.setTransform(0, -103.55, 1.67, 1.67);

    this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

    this._renderFirstFrame();
  }).prototype = getMCSymbolPrototype(
    lib.Groundcube,
    new cjs.Rectangle(0, -103.5, 103.6, 103.5),
    null
  );

  (lib.grasscubeflip = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_1
    this.instance = new lib.Grasscubeflip();
    this.instance.setTransform(0, -114.3, 1.8436, 1.8436);

    this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

    this._renderFirstFrame();
  }).prototype = getMCSymbolPrototype(
    lib.grasscubeflip,
    new cjs.Rectangle(0, -114.3, 114.3, 114.3),
    null
  );

  (lib.Grass = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_1
    this.instance = new lib.Grasscube();
    this.instance.setTransform(0, -39);

    this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

    this._renderFirstFrame();
  }).prototype = getMCSymbolPrototype(
    lib.Grass,
    new cjs.Rectangle(0, -39, 41, 39),
    null
  );

  (lib.girl = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = { jump: 12 };
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // timeline functions:
    this.frame_11 = function () {
      this.gotoAndPlay(1);
    };
    this.frame_18 = function () {
      this.gotoAndPlay(1);
    };

    // actions tween:
    this.timeline.addTween(
      cjs.Tween.get(this)
        .wait(11)
        .call(this.frame_11)
        .wait(7)
        .call(this.frame_18)
        .wait(1)
    );

    // Layer_1
    this.instance = new lib.highush1();
    this.instance.setTransform(90.35, 14.9);

    this.instance_1 = new lib.highush2();
    this.instance_1.setTransform(90.35, 14.9);

    this.instance_2 = new lib.highush3();
    this.instance_2.setTransform(90.35, 14.9);

    this.instance_3 = new lib.highush4();
    this.instance_3.setTransform(90.35, 14.9);

    this.instance_4 = new lib.highush5();
    this.instance_4.setTransform(90.35, 14.9);

    this.instance_5 = new lib.highush6();
    this.instance_5.setTransform(90.35, 14.9);

    this.timeline.addTween(
      cjs.Tween.get({})
        .to({ state: [{ t: this.instance }] })
        .to({ state: [{ t: this.instance_1, p: { y: 14.9 } }] }, 2)
        .to({ state: [{ t: this.instance_2, p: { y: 14.9 } }] }, 2)
        .to({ state: [{ t: this.instance_3, p: { y: 14.9 } }] }, 2)
        .to({ state: [{ t: this.instance_4, p: { y: 14.9 } }] }, 2)
        .to({ state: [{ t: this.instance_5 }] }, 2)
        .to({ state: [{ t: this.instance_1, p: { y: -6.9 } }] }, 2)
        .to({ state: [{ t: this.instance_2, p: { y: -16.5 } }] }, 2)
        .to({ state: [{ t: this.instance_3, p: { y: -4.1 } }] }, 2)
        .to({ state: [{ t: this.instance_4, p: { y: 6.1 } }] }, 2)
        .wait(1)
    );

    this._renderFirstFrame();
  }).prototype = p = new cjs.MovieClip();
  p.nominalBounds = new cjs.Rectangle(90.4, -16.5, 90, 121.4);

  (lib.coinanim = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_1
    this.shape = new cjs.Shape();
    var sprImg_shape = cjs.SpriteSheetUtils.extractFrame(
      ss["tinyTrip_atlas_1"],
      2
    );
    sprImg_shape.onload = function () {
      this.shape.graphics
        .bf(sprImg_shape, null, new cjs.Matrix2D(1, 0, 0, 1, -144, -125))
        .s()
        .p("AriTiMAAAgnDIXFAAMAAAAnDg");
    }.bind(this);
    this.shape.setTransform(144.05, -125);

    this.timeline.addTween(cjs.Tween.get(this.shape).wait(1));

    this._renderFirstFrame();
  }).prototype = getMCSymbolPrototype(
    lib.coinanim,
    new cjs.Rectangle(70.1, -250, 147.9, 250),
    null
  );

  (lib.cloudsbulk = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_1
    this.instance = new lib.Cloudtiny();
    this.instance.setTransform(28.55, -133.1, 0.67, 0.67);

    this.instance_1 = new lib.Cloudtiny();
    this.instance_1.setTransform(615.4, -133.3, 0.67, 0.67);

    this.instance_2 = new lib.Cloudtiny();
    this.instance_2.setTransform(287, -58.95);

    this.instance_3 = new lib.Cloud3();
    this.instance_3.setTransform(0, -187);

    this.instance_4 = new lib.Cloud2();
    this.instance_4.setTransform(401.55, -102.5);

    this.instance_5 = new lib.Cloud1();
    this.instance_5.setTransform(329, -166.5);

    this.timeline.addTween(
      cjs.Tween.get({})
        .to({
          state: [
            { t: this.instance_5 },
            { t: this.instance_4 },
            { t: this.instance_3 },
            { t: this.instance_2 },
            { t: this.instance_1 },
            { t: this.instance },
          ],
        })
        .wait(1)
    );

    this._renderFirstFrame();
  }).prototype = getMCSymbolPrototype(
    lib.cloudsbulk,
    new cjs.Rectangle(0, -187, 669.7, 187),
    null
  );

  (lib.bgbg = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_1
    this.instance = new lib.copy20();
    this.instance.setTransform(903.85, -318);

    this.instance_1 = new lib.copy20();
    this.instance_1.setTransform(847.85, -318);

    this.instance_2 = new lib.copy20();
    this.instance_2.setTransform(791.05, -318);

    this.instance_3 = new lib.copy20();
    this.instance_3.setTransform(734.6, -318);

    this.instance_4 = new lib.copy20();
    this.instance_4.setTransform(677.8, -318);

    this.instance_5 = new lib.copy20();
    this.instance_5.setTransform(622.45, -318);

    this.instance_6 = new lib.copy20();
    this.instance_6.setTransform(565.65, -318);

    this.instance_7 = new lib.copy20();
    this.instance_7.setTransform(509.2, -318);

    this.instance_8 = new lib.copy20();
    this.instance_8.setTransform(452.4, -318);

    this.instance_9 = new lib.copy20();
    this.instance_9.setTransform(395.45, -318);

    this.instance_10 = new lib.copy20();
    this.instance_10.setTransform(338.65, -318);

    this.instance_11 = new lib.copy20();
    this.instance_11.setTransform(282.2, -318);

    this.instance_12 = new lib.copy20();
    this.instance_12.setTransform(225.4, -318);

    this.instance_13 = new lib.copy20();
    this.instance_13.setTransform(170.05, -318);

    this.instance_14 = new lib.copy20();
    this.instance_14.setTransform(113.25, -318);

    this.instance_15 = new lib.copy20();
    this.instance_15.setTransform(56.8, -318);

    this.instance_16 = new lib.copy20();
    this.instance_16.setTransform(0, -318);

    this.instance_17 = new lib.copy4();
    this.instance_17.setTransform(903.85, -318);

    this.instance_18 = new lib.copy4();
    this.instance_18.setTransform(847.85, -318);

    this.instance_19 = new lib.copy4();
    this.instance_19.setTransform(791.05, -318);

    this.instance_20 = new lib.copy4();
    this.instance_20.setTransform(734.6, -318);

    this.instance_21 = new lib.copy4();
    this.instance_21.setTransform(677.8, -318);

    this.instance_22 = new lib.copy4();
    this.instance_22.setTransform(622.45, -318);

    this.instance_23 = new lib.copy4();
    this.instance_23.setTransform(565.65, -318);

    this.instance_24 = new lib.copy4();
    this.instance_24.setTransform(509.2, -318);

    this.instance_25 = new lib.copy4();
    this.instance_25.setTransform(452.4, -318);

    this.instance_26 = new lib.copy4();
    this.instance_26.setTransform(395.45, -318);

    this.instance_27 = new lib.copy4();
    this.instance_27.setTransform(338.65, -318);

    this.instance_28 = new lib.copy4();
    this.instance_28.setTransform(282.2, -318);

    this.instance_29 = new lib.copy4();
    this.instance_29.setTransform(225.4, -318);

    this.instance_30 = new lib.copy4();
    this.instance_30.setTransform(170.05, -318);

    this.instance_31 = new lib.copy4();
    this.instance_31.setTransform(113.25, -318);

    this.instance_32 = new lib.copy4();
    this.instance_32.setTransform(56.8, -318);

    this.instance_33 = new lib.copy4();
    this.instance_33.setTransform(0, -318);

    this.instance_34 = new lib.bg();
    this.instance_34.setTransform(903.85, -318);

    this.instance_35 = new lib.bg();
    this.instance_35.setTransform(847.85, -318);

    this.instance_36 = new lib.bg();
    this.instance_36.setTransform(791.05, -318);

    this.instance_37 = new lib.bg();
    this.instance_37.setTransform(734.6, -318);

    this.instance_38 = new lib.bg();
    this.instance_38.setTransform(677.8, -318);

    this.instance_39 = new lib.bg();
    this.instance_39.setTransform(622.45, -318);

    this.instance_40 = new lib.bg();
    this.instance_40.setTransform(565.65, -318);

    this.instance_41 = new lib.bg();
    this.instance_41.setTransform(509.2, -318);

    this.instance_42 = new lib.bg();
    this.instance_42.setTransform(452.4, -318);

    this.instance_43 = new lib.bg();
    this.instance_43.setTransform(395.45, -318);

    this.instance_44 = new lib.bg();
    this.instance_44.setTransform(338.65, -318);

    this.instance_45 = new lib.bg();
    this.instance_45.setTransform(282.2, -318);

    this.instance_46 = new lib.bg();
    this.instance_46.setTransform(225.4, -318);

    this.instance_47 = new lib.bg();
    this.instance_47.setTransform(170.05, -318);

    this.instance_48 = new lib.bg();
    this.instance_48.setTransform(113.25, -318);

    this.instance_49 = new lib.bg();
    this.instance_49.setTransform(56.8, -318);

    this.instance_50 = new lib.bg();
    this.instance_50.setTransform(0, -318);

    this.timeline.addTween(
      cjs.Tween.get({})
        .to({
          state: [
            { t: this.instance_50 },
            { t: this.instance_49 },
            { t: this.instance_48 },
            { t: this.instance_47 },
            { t: this.instance_46 },
            { t: this.instance_45 },
            { t: this.instance_44 },
            { t: this.instance_43 },
            { t: this.instance_42 },
            { t: this.instance_41 },
            { t: this.instance_40 },
            { t: this.instance_39 },
            { t: this.instance_38 },
            { t: this.instance_37 },
            { t: this.instance_36 },
            { t: this.instance_35 },
            { t: this.instance_34 },
            { t: this.instance_33 },
            { t: this.instance_32 },
            { t: this.instance_31 },
            { t: this.instance_30 },
            { t: this.instance_29 },
            { t: this.instance_28 },
            { t: this.instance_27 },
            { t: this.instance_26 },
            { t: this.instance_25 },
            { t: this.instance_24 },
            { t: this.instance_23 },
            { t: this.instance_22 },
            { t: this.instance_21 },
            { t: this.instance_20 },
            { t: this.instance_19 },
            { t: this.instance_18 },
            { t: this.instance_17 },
            { t: this.instance_16 },
            { t: this.instance_15 },
            { t: this.instance_14 },
            { t: this.instance_13 },
            { t: this.instance_12 },
            { t: this.instance_11 },
            { t: this.instance_10 },
            { t: this.instance_9 },
            { t: this.instance_8 },
            { t: this.instance_7 },
            { t: this.instance_6 },
            { t: this.instance_5 },
            { t: this.instance_4 },
            { t: this.instance_3 },
            { t: this.instance_2 },
            { t: this.instance_1 },
            { t: this.instance },
          ],
        })
        .wait(1)
    );

    this._renderFirstFrame();
  }).prototype = getMCSymbolPrototype(
    lib.bgbg,
    new cjs.Rectangle(0, -318, 965.9, 318),
    null
  );

  (lib.Uppergrassline = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_1
    this.instance = new lib.Grass();
    this.instance.setTransform(
      1988.55,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_1 = new lib.Grass();
    this.instance_1.setTransform(
      1874.95,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_2 = new lib.Grass();
    this.instance_2.setTransform(
      1761.35,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_3 = new lib.Grass();
    this.instance_3.setTransform(
      -56.25,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_4 = new lib.Grass();
    this.instance_4.setTransform(
      -169.85,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_5 = new lib.Grass();
    this.instance_5.setTransform(
      1647.75,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_6 = new lib.Grass();
    this.instance_6.setTransform(
      1534.15,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_7 = new lib.Grass();
    this.instance_7.setTransform(
      1420.55,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_8 = new lib.Grass();
    this.instance_8.setTransform(
      1306.95,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_9 = new lib.Grass();
    this.instance_9.setTransform(
      1193.35,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_10 = new lib.Grass();
    this.instance_10.setTransform(
      1079.75,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_11 = new lib.Grass();
    this.instance_11.setTransform(
      966.15,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.grassTest_mc = new lib.Grass();
    this.grassTest_mc.name = "grassTest_mc";
    this.grassTest_mc.setTransform(
      852.55,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_12 = new lib.Grass();
    this.instance_12.setTransform(
      738.95,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_13 = new lib.Grass();
    this.instance_13.setTransform(
      625.35,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_14 = new lib.Grass();
    this.instance_14.setTransform(
      511.75,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_15 = new lib.Grass();
    this.instance_15.setTransform(
      398.15,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_16 = new lib.Grass();
    this.instance_16.setTransform(
      284.55,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_17 = new lib.Grass();
    this.instance_17.setTransform(
      170.95,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.instance_18 = new lib.Grass();
    this.instance_18.setTransform(
      57.4,
      -54.35,
      2.789,
      2.7885,
      0,
      0,
      0,
      20.5,
      -19.5
    );

    this.timeline.addTween(
      cjs.Tween.get({})
        .to({
          state: [
            { t: this.instance_18 },
            { t: this.instance_17 },
            { t: this.instance_16 },
            { t: this.instance_15 },
            { t: this.instance_14 },
            { t: this.instance_13 },
            { t: this.instance_12 },
            { t: this.grassTest_mc },
            { t: this.instance_11 },
            { t: this.instance_10 },
            { t: this.instance_9 },
            { t: this.instance_8 },
            { t: this.instance_7 },
            { t: this.instance_6 },
            { t: this.instance_5 },
            { t: this.instance_4 },
            { t: this.instance_3 },
            { t: this.instance_2 },
            { t: this.instance_1 },
            { t: this.instance },
          ],
        })
        .wait(1)
    );

    this._renderFirstFrame();
  }).prototype = getMCSymbolPrototype(
    lib.Uppergrassline,
    new cjs.Rectangle(-227, -108.7, 2272.8, 108.7),
    null
  );

  (lib.Tween3 = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_1
    this.instance = new lib.cloudsbulk();
    this.instance.setTransform(1466.25, 0, 1, 1, 0, 0, 0, 316.2, -93.5);

    this.instance_1 = new lib.cloudsbulk();
    this.instance_1.setTransform(879.85, 0, 1, 1, 0, 0, 0, 316.2, -93.5);

    this.instance_2 = new lib.cloudsbulk();
    this.instance_2.setTransform(879.85, 0, 1, 1, 0, 0, 0, 316.2, -93.5);

    this.instance_3 = new lib.cloudsbulk();
    this.instance_3.setTransform(293.45, 0, 1, 1, 0, 0, 0, 316.2, -93.5);

    this.instance_4 = new lib.cloudsbulk();
    this.instance_4.setTransform(-293.55, 0, 1, 1, 0, 0, 0, 316.2, -93.5);

    this.timeline.addTween(
      cjs.Tween.get({})
        .to({
          state: [
            { t: this.instance_4 },
            { t: this.instance_3 },
            { t: this.instance_2 },
            { t: this.instance_1 },
            { t: this.instance },
          ],
        })
        .wait(1)
    );

    this._renderFirstFrame();
  }).prototype = p = new cjs.MovieClip();
  p.nominalBounds = new cjs.Rectangle(-609.7, -93.5, 2429.4, 187);

  (lib.Grassanimation = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_1
    this.instance = new lib.Groundcube();
    this.instance.setTransform(
      2096.2,
      -57.2,
      1.1043,
      1.1043,
      0,
      0,
      0,
      51.8,
      -51.8
    );

    this.instance_1 = new lib.grasscubeflip();
    this.instance_1.setTransform(
      1982.75,
      -57.1,
      1.0004,
      1.0004,
      0,
      0,
      0,
      57.1,
      -57.1
    );

    this.instance_2 = new lib.Groundcube();
    this.instance_2.setTransform(
      1869.5,
      -57.2,
      1.1043,
      1.1043,
      0,
      0,
      0,
      51.8,
      -51.8
    );

    this.instance_3 = new lib.grasscubeflip();
    this.instance_3.setTransform(
      1756.05,
      -57.1,
      1.0004,
      1.0004,
      0,
      0,
      0,
      57.1,
      -57.1
    );

    this.instance_4 = new lib.grasscubeflip();
    this.instance_4.setTransform(
      -57.55,
      -57.1,
      1.0004,
      1.0004,
      0,
      0,
      0,
      57.1,
      -57.1
    );

    this.instance_5 = new lib.Groundcube();
    this.instance_5.setTransform(
      -170.8,
      -57.2,
      1.1043,
      1.1043,
      0,
      0,
      0,
      51.8,
      -51.8
    );

    this.instance_6 = new lib.Groundcube();
    this.instance_6.setTransform(
      1642.8,
      -57.2,
      1.1043,
      1.1043,
      0,
      0,
      0,
      51.8,
      -51.8
    );

    this.instance_7 = new lib.grasscubeflip();
    this.instance_7.setTransform(
      1529.35,
      -57.1,
      1.0004,
      1.0004,
      0,
      0,
      0,
      57.1,
      -57.1
    );

    this.instance_8 = new lib.Groundcube();
    this.instance_8.setTransform(
      1416.1,
      -57.2,
      1.1043,
      1.1043,
      0,
      0,
      0,
      51.8,
      -51.8
    );

    this.instance_9 = new lib.grasscubeflip();
    this.instance_9.setTransform(
      1302.65,
      -57.1,
      1.0004,
      1.0004,
      0,
      0,
      0,
      57.1,
      -57.1
    );

    this.instance_10 = new lib.Groundcube();
    this.instance_10.setTransform(
      1189.4,
      -57.2,
      1.1043,
      1.1043,
      0,
      0,
      0,
      51.8,
      -51.8
    );

    this.instance_11 = new lib.grasscubeflip();
    this.instance_11.setTransform(
      1075.95,
      -57.1,
      1.0004,
      1.0004,
      0,
      0,
      0,
      57.1,
      -57.1
    );

    this.instance_12 = new lib.Groundcube();
    this.instance_12.setTransform(
      962.7,
      -57.2,
      1.1043,
      1.1043,
      0,
      0,
      0,
      51.8,
      -51.8
    );

    this.instance_13 = new lib.grasscubeflip();
    this.instance_13.setTransform(
      849.25,
      -57.1,
      1.0004,
      1.0004,
      0,
      0,
      0,
      57.1,
      -57.1
    );

    this.instance_14 = new lib.Groundcube();
    this.instance_14.setTransform(
      736,
      -57.2,
      1.1043,
      1.1043,
      0,
      0,
      0,
      51.8,
      -51.8
    );

    this.instance_15 = new lib.grasscubeflip();
    this.instance_15.setTransform(
      622.55,
      -57.1,
      1.0004,
      1.0004,
      0,
      0,
      0,
      57.1,
      -57.1
    );

    this.instance_16 = new lib.Groundcube();
    this.instance_16.setTransform(
      509.3,
      -57.2,
      1.1043,
      1.1043,
      0,
      0,
      0,
      51.8,
      -51.8
    );

    this.instance_17 = new lib.grasscubeflip();
    this.instance_17.setTransform(
      395.95,
      -57.1,
      1.0004,
      1.0004,
      0,
      0,
      0,
      57.2,
      -57.1
    );

    this.instance_18 = new lib.Groundcube();
    this.instance_18.setTransform(
      282.6,
      -57.2,
      1.1043,
      1.1043,
      0,
      0,
      0,
      51.8,
      -51.8
    );

    this.instance_19 = new lib.grasscubeflip();
    this.instance_19.setTransform(
      169.15,
      -57.1,
      1.0004,
      1.0004,
      0,
      0,
      0,
      57.1,
      -57.1
    );

    this.instance_20 = new lib.Groundcube();
    this.instance_20.setTransform(
      55.9,
      -57.2,
      1.1043,
      1.1043,
      0,
      0,
      0,
      51.8,
      -51.8
    );

    this.timeline.addTween(
      cjs.Tween.get({})
        .to({
          state: [
            { t: this.instance_20 },
            { t: this.instance_19 },
            { t: this.instance_18 },
            { t: this.instance_17 },
            { t: this.instance_16 },
            { t: this.instance_15 },
            { t: this.instance_14 },
            { t: this.instance_13 },
            { t: this.instance_12 },
            { t: this.instance_11 },
            { t: this.instance_10 },
            { t: this.instance_9 },
            { t: this.instance_8 },
            { t: this.instance_7 },
            { t: this.instance_6 },
            { t: this.instance_5 },
            { t: this.instance_4 },
            { t: this.instance_3 },
            { t: this.instance_2 },
            { t: this.instance_1 },
            { t: this.instance },
          ],
        })
        .wait(1)
    );

    this._renderFirstFrame();
  }).prototype = getMCSymbolPrototype(
    lib.Grassanimation,
    new cjs.Rectangle(-228, -114.3, 2381.4, 114.3),
    null
  );

  (lib.Grassanim = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_3
    this.touchMc = new lib.touchy();
    this.touchMc.name = "touchMc";
    this.touchMc.setTransform(768.8, -123.6, 1, 1, 0, 0, 0, 4.2, -9.1);
    this.touchMc.alpha = 0;

    this.timeline.addTween(
      cjs.Tween.get(this.touchMc).to({ x: -438.15, y: -125.7 }, 140).wait(1)
    );

    // Layer_1
    this.grass_mc = new lib.Uppergrassline();
    this.grass_mc.name = "grass_mc";
    this.grass_mc.setTransform(627.2, -54.4, 1, 1, 0, 0, 0, 627.2, -54.4);

    this.timeline.addTween(
      cjs.Tween.get(this.grass_mc).to({ x: -508.85 }, 140).wait(1)
    );

    this._renderFirstFrame();
  }).prototype = p = new cjs.MovieClip();
  p.nominalBounds = new cjs.Rectangle(
    -1363,
    -135.7,
    3408.8,
    135.79999999999998
  );

  (lib.coin = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_1
    this.instance = new lib.coinanim();
    this.instance.setTransform(109, -125, 1, 1, 0, 0, 0, 109, -125);

    this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

    this._renderFirstFrame();
  }).prototype = getMCSymbolPrototype(
    lib.coin,
    new cjs.Rectangle(70.1, -250, 147.9, 250),
    null
  );

  (lib.cloundsanimation = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_1
    this.instance = new lib.Tween3("synched", 0);
    this.instance.setTransform(609.75, -93.5);

    this.timeline.addTween(
      cjs.Tween.get(this.instance).to({ x: 22.9 }, 87).wait(1)
    );

    this._renderFirstFrame();
  }).prototype = p = new cjs.MovieClip();
  p.nominalBounds = new cjs.Rectangle(-586.8, -187, 3016.3, 187);

  (lib.Grassline = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_1
    this.instance = new lib.Grassanimation();
    this.instance.setTransform(619.35, -57.2, 1, 1, 0, 0, 0, 628.6, -57.2);

    this.timeline.addTween(
      cjs.Tween.get(this.instance).to({ x: -286.55 }, 114).wait(1)
    );

    // Layer_3
    this.ground_mc = new lib.Grassanim();
    this.ground_mc.name = "ground_mc";
    this.ground_mc.setTransform(616.95, -126.25, 1, 1, 0, 0, 0, 627.2, -54.4);

    this.timeline.addTween(cjs.Tween.get(this.ground_mc).wait(115));

    this._renderFirstFrame();
  }).prototype = p = new cjs.MovieClip();
  p.nominalBounds = new cjs.Rectangle(-1143.1, -204.9, 3287.2, 205);

  (lib.coinorig = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // timeline functions:
    this.frame_6 = function () {
      this.gotoAndPlay(1);
    };
    this.frame_7 = function () {
      this.stop();
    };

    // actions tween:
    this.timeline.addTween(
      cjs.Tween.get(this)
        .wait(6)
        .call(this.frame_6)
        .wait(1)
        .call(this.frame_7)
        .wait(1)
    );

    // Layer_4
    this.shape = new cjs.Shape();
    var sprImg_shape = cjs.SpriteSheetUtils.extractFrame(
      ss["tinyTrip_atlas_1"],
      2
    );
    sprImg_shape.onload = function () {
      this.shape.graphics
        .bf(sprImg_shape, null, new cjs.Matrix2D(1, 0, 0, 1, -648.4, -125))
        .s()
        .p("AoDTiMAAAgnDIQHAAMAAAAnDg");
    }.bind(this);
    this.shape.setTransform(27.775, 0);
    this.shape._off = true;

    this.timeline.addTween(
      cjs.Tween.get(this.shape)
        .wait(3)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(4)
    );

    // Layer_3
    this.shape_1 = new cjs.Shape();
    var sprImg_shape_1 = cjs.SpriteSheetUtils.extractFrame(
      ss["tinyTrip_atlas_1"],
      2
    );
    sprImg_shape_1.onload = function () {
      this.shape_1.graphics
        .bf(sprImg_shape_1, null, new cjs.Matrix2D(1, 0, 0, 1, -477.3, -125))
        .s()
        .p("AoyTiMAAAgnDIRlAAMAAAAnDg");
    }.bind(this);
    this.shape_1.setTransform(20.575, 0);
    this.shape_1._off = true;

    this.timeline.addTween(
      cjs.Tween.get(this.shape_1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(3)
    );

    // Layer_2
    this.shape_2 = new cjs.Shape();
    var sprImg_shape_2 = cjs.SpriteSheetUtils.extractFrame(
      ss["tinyTrip_atlas_1"],
      2
    );
    sprImg_shape_2.onload = function () {
      this.shape_2.graphics
        .bf(sprImg_shape_2, null, new cjs.Matrix2D(1, 0, 0, 1, -309.5, -125))
        .s()
        .p("ArGTiMAAAgnDIWNAAMAAAAnDg");
    }.bind(this);
    this.shape_2.setTransform(12.675, 0);
    this.shape_2._off = true;

    this.timeline.addTween(
      cjs.Tween.get(this.shape_2)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(3)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
    );

    // Layer_1
    this.instance = new lib.coin();
    this.instance.setTransform(-35.05, 0, 1, 1, 0, 0, 0, 109, -125);

    this.timeline.addTween(
      cjs.Tween.get(this.instance)
        .to({ _off: true }, 1)
        .wait(5)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
    );

    this._renderFirstFrame();
  }).prototype = p = new cjs.MovieClip();
  p.nominalBounds = new cjs.Rectangle(-73.9, -125, 157.7, 250);

  (lib.coin_box_mc = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // timeline functions:
    this.frame_0 = function () {
      this.stop();
    };

    // actions tween:
    this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(63));

    // Layer_1
    this.coin_mc = new lib.coinorig();
    this.coin_mc.name = "coin_mc";
    this.coin_mc.setTransform(250.15, 71.7, 0.52, 0.52, 0, 0, 0, 407.1, 12.9);

    this.timeline.addTween(
      cjs.Tween.get(this.coin_mc)
        .to({ y: -157.15 }, 5)
        .to({ y: 2775.6 }, 57)
        .wait(1)
    );

    this._renderFirstFrame();
  }).prototype = p = new cjs.MovieClip();
  p.nominalBounds = new cjs.Rectangle(0, -228.8, 76.9, 3062.7000000000003);

  (lib.coin_animbox_mc = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer_1
    this.coinBox = new lib.coin_box_mc();
    this.coinBox.name = "coinBox";
    this.coinBox.setTransform(-173.85, 65, 1, 1, 0, 0, 0, 125, 65);

    this.timeline.addTween(
      cjs.Tween.get(this.coinBox).to({ x: -1498.8 }, 179).wait(1)
    );

    this._renderFirstFrame();
  }).prototype = p = new cjs.MovieClip();
  p.nominalBounds = new cjs.Rectangle(-1623.8, 0, 1401.8999999999999, 130);

  (lib.MyCoin = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // Layer 1
    this.instance = new lib.coinorig();
    this.instance.setTransform(109, -125, 1, 1, 0, 0, 0, 407, 13);

    this.timeline.addTween(
      cjs.Tween.get(this.instance).to({ x: -1029.9 }, 206).wait(1)
    );

    this._renderFirstFrame();
  }).prototype = p = new cjs.MovieClip();
  p.nominalBounds = new cjs.Rectangle(-1510.8, -263, 1286.8, 250);

  // stage content:
  (lib.tinyTrip = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = true;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    this.actionFrames = [0];
    this.streamSoundSymbolsList[0] = [
      //{ id: "JumpSound", startFrame: 0, endFrame: 1, loop: 1, offset: 0 },
    ];
    this.isSingleFrame = false;
    // timeline functions:
    this.frame_0 = function () {
      if (this.isSingleFrame) {
        return;
      }
      if (this.totalFrames == 1) {
        this.isSingleFrame = true;
      }
      this.clearAllSoundStreams();

      var soundInstance = playSound("JumpSound", 0);
      this.InsertIntoSoundStreamData(soundInstance, 0, 1, 1);
      document.addEventListener("click", onClick.bind(this));

      //var mySound = new Audio("assets/JumpSound.mp3"); // Replace 'JumpSound.mp3' with the actual audio file path.

      function onClick() {
        //mySound.play();

        this.mj_mc.gotoAndPlay(13);
        if (
          this.coinBox2_mc.coinBox.x >= -950 &&
          this.coinBox2_mc.coinBox.x <= -800
        ) {
          this.coinBox2_mc.coinBox.gotoAndPlay(2);
        }

        if (
          this.coinBox3_mc.coinBox.x >= -1100 &&
          this.coinBox3_mc.coinBox.x <= -950
        ) {
          this.coinBox3_mc.coinBox.gotoAndPlay(2);
        }

        if (
          this.coinBox4_mc.coinBox.x >= -1390 &&
          this.coinBox4_mc.coinBox.x <= -1190
        ) {
          this.coinBox4_mc.coinBox.gotoAndPlay(2);
        }

        isPlaying = true;
      }
    };

    // actions tween:
    this.timeline.addTween(cjs.Tween.get(this).call(this.frame_0).wait(1));

    // coin
    this.coinBox4_mc = new lib.coin_animbox_mc();
    this.coinBox4_mc.name = "coinBox4_mc";
    this.coinBox4_mc.setTransform(1714, 125.3, 1, 1, 0, 0, 0, 125, 65);

    this.coinBox3_mc = new lib.coin_animbox_mc();
    this.coinBox3_mc.name = "coinBox3_mc";
    this.coinBox3_mc.setTransform(1448.9, 125.3, 1, 1, 0, 0, 0, 125, 65);

    this.coinBox2_mc = new lib.coin_animbox_mc();
    this.coinBox2_mc.name = "coinBox2_mc";
    this.coinBox2_mc.setTransform(1301, 125.3, 1, 1, 0, 0, 0, 125, 65);

    this.timeline.addTween(
      cjs.Tween.get({})
        .to({
          state: [
            { t: this.coinBox2_mc },
            { t: this.coinBox3_mc },
            { t: this.coinBox4_mc },
          ],
        })
        .wait(1)
    );

    // mj
    this.mj_mc = new lib.girl();
    this.mj_mc.name = "mj_mc";
    this.mj_mc.setTransform(-59.75, 232.8, 2.25, 2.25, 0, 0, 0, 45, 45);

    this.timeline.addTween(cjs.Tween.get(this.mj_mc).wait(1));

    // grass_down
    this.move_mc = new lib.Grassline();
    this.move_mc.name = "move_mc";
    this.move_mc.setTransform(400, 422.8, 1, 1, 0, 0, 0, 400, -57.2);
    var move_mcFilter_1 = new cjs.ColorFilter(
      0.81,
      0.81,
      0.81,
      1,
      48.45,
      43.7,
      39.52,
      0
    );
    this.move_mc.filters = [move_mcFilter_1];
    this.move_mc.cache(-1145, -207, 3291, 209);

    this.timeline.addTween(cjs.Tween.get(this.move_mc).wait(1));
    this.timeline.addTween(cjs.Tween.get(move_mcFilter_1).wait(1));

    // Layer_8
    this.instance = new lib.cloundsanimation();
    this.instance.setTransform(569.8, 126.05, 1, 1, 0, 0, 0, 609.8, -93.5);

    this.timeline.addTween(cjs.Tween.get(this.instance).wait(1));

    // Layer_6
    this.instance_1 = new lib.bgbg();
    this.instance_1.setTransform(
      370.05,
      160.55,
      1.05,
      1.05,
      0,
      0,
      0,
      482.9,
      -159
    );

    this.timeline.addTween(cjs.Tween.get(this.instance_1).wait(1));

    this.filterCacheList = [];
    this.filterCacheList.push({
      instance: this.move_mc,
      startFrame: 0,
      endFrame: 1,
      x: -1145,
      y: -207,
      w: 3291,
      h: 209,
    });
    this._renderFirstFrame();
  }).prototype = p = new lib.AnMovieClip();
  p.nominalBounds = new cjs.Rectangle(162.8, 233.6, 2226.7, 246.4);

  //CORS
  // library properties:

  (function () {
    var cors_api_host = "cors-anywhere.herokuapp.com";
    var origin = window.location.protocol + "//" + window.location.host;

    var open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function () {
      var args = [].slice.call(arguments);
      var targetOrigin = /^https?:\/\/([^\/]+)/i.exec(args[1]);
      if (
        targetOrigin &&
        targetOrigin[0].toLowerCase() !== origin &&
        targetOrigin[1] !== cors_api_host
      ) {
        args[1] = "https://" + cors_api_host + "/" + args[1];
      }
      return open.apply(this, args);
    };

    var cors_api_url =
      "https://" + cors_api_host + "/" + "https://i.imgur.com/SlKLhrk.png";

    lib.properties = {
      id: "034E8AF2EA56B948B9B3E8749A173574",
      width: 800,
      height: 480,
      fps: 24,
      color: "#7DE6EE",
      opacity: 1.0,
      manifest: [
        {
          src: cors_api_url,
          id: "tinyTrip_atlas_1",
          type: createjs.LoadQueue.IMAGE,
          crossOrigin: "Anonymous",
        },
      ],
      preloads: [],
    };
  })();

  // bootstrap callback support:

  (lib.Stage = function (canvas) {
    createjs.Stage.call(this, canvas);
  }).prototype = p = new createjs.Stage();

  p.setAutoPlay = function (autoPlay) {
    this.tickEnabled = autoPlay;
  };
  p.play = function () {
    this.tickEnabled = true;
    this.getChildAt(0).gotoAndPlay(this.getTimelinePosition());
  };
  p.stop = function (ms) {
    if (ms) this.seek(ms);
    this.tickEnabled = false;
  };
  p.seek = function (ms) {
    this.tickEnabled = true;
    this.getChildAt(0).gotoAndStop((lib.properties.fps * ms) / 1000);
  };
  p.getDuration = function () {
    return (this.getChildAt(0).totalFrames / lib.properties.fps) * 1000;
  };

  p.getTimelinePosition = function () {
    return (this.getChildAt(0).currentFrame / lib.properties.fps) * 1000;
  };

  an.bootcompsLoaded = an.bootcompsLoaded || [];
  if (!an.bootstrapListeners) {
    an.bootstrapListeners = [];
  }

  an.bootstrapCallback = function (fnCallback) {
    an.bootstrapListeners.push(fnCallback);
    if (an.bootcompsLoaded.length > 0) {
      for (var i = 0; i < an.bootcompsLoaded.length; ++i) {
        fnCallback(an.bootcompsLoaded[i]);
      }
    }
  };

  an.compositions = an.compositions || {};
  an.compositions["034E8AF2EA56B948B9B3E8749A173574"] = {
    getStage: function () {
      return exportRoot.stage;
    },
    getLibrary: function () {
      return lib;
    },
    getSpriteSheet: function () {
      return ss;
    },
    getImages: function () {
      return img;
    },
  };

  an.compositionLoaded = function (id) {
    an.bootcompsLoaded.push(id);
    for (var j = 0; j < an.bootstrapListeners.length; j++) {
      an.bootstrapListeners[j](id);
    }
  };

  an.getComposition = function (id) {
    return an.compositions[id];
  };

  an.makeResponsive = function (
    isResp,
    respDim,
    isScale,
    scaleType,
    domContainers
  ) {
    var lastW,
      lastH,
      lastS = 1;
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    function resizeCanvas() {
      var w = lib.properties.width,
        h = lib.properties.height;
      var iw = window.innerWidth,
        ih = window.innerHeight;
      var pRatio = window.devicePixelRatio || 1,
        xRatio = iw / w,
        yRatio = ih / h,
        sRatio = 1;
      if (isResp) {
        if (
          (respDim == "width" && lastW == iw) ||
          (respDim == "height" && lastH == ih)
        ) {
          sRatio = lastS;
        } else if (!isScale) {
          if (iw < w || ih < h) sRatio = Math.min(xRatio, yRatio);
        } else if (scaleType == 1) {
          sRatio = Math.min(xRatio, yRatio);
        } else if (scaleType == 2) {
          sRatio = Math.max(xRatio, yRatio);
        }
      }
      domContainers[0].width = w * pRatio * sRatio;
      domContainers[0].height = h * pRatio * sRatio;
      domContainers.forEach(function (container) {
        container.style.width = w * sRatio + "px";
        container.style.height = h * sRatio + "px";
      });
      stage.scaleX = pRatio * sRatio;
      stage.scaleY = pRatio * sRatio;
      lastW = iw;
      lastH = ih;
      lastS = sRatio;
      stage.tickOnUpdate = false;
      stage.update();
      stage.tickOnUpdate = true;
    }
  };
  an.handleSoundStreamOnTick = function (event) {
    if (!event.paused) {
      var stageChild = stage.getChildAt(0);
      if (!stageChild.paused || stageChild.ignorePause) {
        stageChild.syncStreamSounds();
      }
    }
  };
  an.handleFilterCache = function (event) {
    if (!event.paused) {
      var target = event.target;
      if (target) {
        if (target.filterCacheList) {
          for (var index = 0; index < target.filterCacheList.length; index++) {
            var cacheInst = target.filterCacheList[index];
            if (
              cacheInst.startFrame <= target.currentFrame &&
              target.currentFrame <= cacheInst.endFrame
            ) {
              cacheInst.instance.cache(
                cacheInst.x,
                cacheInst.y,
                cacheInst.w,
                cacheInst.h
              );
            }
          }
        }
      }
    }
  };
})((createjs = createjs || {}), (AdobeAn = AdobeAn || {}));
var createjs, AdobeAn;
