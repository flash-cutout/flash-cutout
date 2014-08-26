
/**
 * Timeline Compiler
 * @overview  Compile timeline into json data.
 *
 * @author    Xpol Wan<xpolife@gmail.com>, 2014
 */
var VERSION = "0.5.1";

// JSON
(function() {

  // ----------------------------------------------------------------------------------------------------
  // local variables

  var hasOwn = Object.prototype.hasOwnProperty;
  var escapeable = /["\\\x00-\x1f\x7f-\x9f]/g;
  var meta = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"': '\\"',
    '\\': '\\\\'
  };

  /**
   * Helper function to correctly quote nested strings
   * @ignore
   */
  function quoteString(string) {
    if (string.match(escapeable)) {
      return '"' + string.replace(escapeable, function(a) {
        var c = meta[a];
        if (typeof c === 'string') {
          return c;
        }
        c = a.charCodeAt();
        return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
      }) + '"';
    }
    return '"' + string + '"';
  }

  // ----------------------------------------------------------------------------------------------------
  // class

  /* global JSON: true */
  JSON = {
    /**
     * Encodes an Object as a JSON String
     * Non-integer/string keys are skipped in the object, as are keys that point to a function.
     *
     * @name  JSON.encode
     * @param {Object}  obj   The json-serializble *thing* to be converted
     * @returns {String}      A JSON String
     */
    encode: function(obj) {
      if (obj === null) {
        return 'null';
      }

      var type = typeof obj;

      if (type === 'undefined') {
        return undefined;
      }
      if (type === 'number' || type === 'boolean') {
        return '' + obj;
      }
      if (type === 'string') {
        return quoteString(obj);
      }
      if (type === 'object') {
        if (obj.constructor === Date) {
          var month = obj.getUTCMonth() + 1,
            day = obj.getUTCDate(),
            year = obj.getUTCFullYear(),
            hours = obj.getUTCHours(),
            minutes = obj.getUTCMinutes(),
            seconds = obj.getUTCSeconds(),
            milli = obj.getUTCMilliseconds();

          if (month < 10) {
            month = '0' + month;
          }
          if (day < 10) {
            day = '0' + day;
          }
          if (hours < 10) {
            hours = '0' + hours;
          }
          if (minutes < 10) {
            minutes = '0' + minutes;
          }
          if (seconds < 10) {
            seconds = '0' + seconds;
          }
          if (milli < 100) {
            milli = '0' + milli;
          }
          if (milli < 10) {
            milli = '0' + milli;
          }
          return '"' + year + '-' + month + '-' + day + 'T' +
            hours + ':' + minutes + ':' + seconds +
            '.' + milli + 'Z"';
        }
        if (obj.constructor === Array) {
          var ret = [];
          for (var i = 0; i < obj.length; i++) {
            ret.push(JSON.encode(obj[i]) || 'null');
          }
          return '[' + ret.join(',') + ']';
        }
        var name,
          val,
          pairs = [];

        for (var k in obj) {
          // Only include own properties,
          // Filter out inherited prototypes
          if (!hasOwn.call(obj, k)) {
            continue;
          }

          // Keys must be numerical or string. Skip others
          type = typeof k;
          if (type === 'number') {
            name = '"' + k + '"';
          } else if (type === 'string') {
            name = quoteString(k);
          } else {
            continue;
          }
          type = typeof obj[k];

          // Invalid values like these return undefined
          // from toJSON, however those object members
          // shouldn't be included in the JSON string at all.
          if (type === 'function' || type === 'undefined') {
            continue;
          }
          val = JSON.encode(obj[k]);
          pairs.push(name + ':' + val);
        }
        return '{' + pairs.join(',') + '}';
      }

    },

    /**
     * Evaluates a given piece of json source.
     * @param {String}  src
     * @name  JSON.decode
     */
    decode: function(src) {
      if (src !== null && src !== '' && src !== undefined) {
        return eval('(' + src + ')'); // jshint ignore:line
      }
      return null;
    },

    toString: function() {
      return '[class JSON]';
    }

  };

})();


(function() {

  // ----------------------------------------------------------------------------------------------------
  // local variables
  var supported_instance_type = {
    "symbol": true,
    "bitmap": true
  };

  var supported_symbol_type = {
    "graphic": true,
    "bitmap": true,
    "movie clip": true
  };

  var supported_layer_type = {
    "normal": true,
    "mask": true,
    "masked": true
  };

  var tween_rotate_shortern = {
    "none": "none",
    "auto": "auto",
    "clockwise": "cw",
    "counter-clockwise": "ccw"
  };
  var EPSILON;
  function fpeq(a, b)
  {

    if (!EPSILON) {
      var eps = 1.0;
      do {
        eps /= 2.0;
      }
      while (1.0 + (eps / 2.0) != 1.0);
      EPSILON = eps;
    }


    return Math.abs(a - b) < EPSILON;
  }

  function matrix(mat) {
    var transonly = fpeq(mat.a, 1) && fpeq(mat.d, 1) && fpeq(mat.b, 0) && fpeq(mat.c, 0);


    return transonly ? [mat.tx, mat.ty] :
          [mat.tx, mat.ty,
            mat.a, mat.b,
            mat.c, mat.d];
  }

  function rotation(frame) {
    // [none|auto|ccw|cw],<times>
    return tween_rotate_shortern[frame.motionTweenRotate] + "," + frame.motionTweenRotateTimes;
  }

  function baseCommand(ctx, index, name, o) {
    o = o || {};
    o.cmd = name;
    o.index = index;

    if (ctx.frame.tweenType === "motion") {
      o.tween = ctx.frame.tweenType;
      o.rotate = rotation(ctx.frame);
    }

    return o;
  }

  function nameOrUndefined(instance) {
    return (0 === instance.name.length) ? undefined : instance.name;
  }

  function libraryName(inst)
  {
    return inst.libraryItem.name.replace(/^parts\//, '');
  }

  Command = {
    place: function(ctx, index, instance) {
      if (!supported_instance_type[instance.instanceType])
        return;

      if (!supported_symbol_type[instance.symbolType])
        return;

      return baseCommand(ctx, index, "Place", {
        "duration": ctx.frame.duration,
        "matrix": matrix(instance.matrix),
        "name": nameOrUndefined(instance),
        "character": libraryName(instance)
      });
    },
    remove: function(ctx, index, oldinstance) {
      return baseCommand(ctx, index, "Remove");
    },
    move: function(ctx, index, instance) // for motion tween...
    {
      return baseCommand(ctx, index, "Move", {
        "duration": ctx.frame.duration,
        "matrix": matrix(instance.matrix),
        "name": nameOrUndefined(instance)
      });
    },
    replace: function(ctx, index, instance) {
      return baseCommand(ctx, index, "Replace", {
        "duration": ctx.frame.duration,
        "matrix": matrix(instance.matrix),
        "name": nameOrUndefined(instance),
        "character": libraryName(instance)
      });
    }
  };

  function sameItem(a, b) {
    return a.libraryItem == b.libraryItem;
  }

  function depthMap(elements) {
    var rv = {};
    for (var i = 0; i < elements.length; i++) {
      var e = elements[i];
      rv[e.depth.toString()] = e;
    }
    return rv;
  }


  // return intersect, unique_in_a, unique_in_b
  Set = {
    union: function(a, b) {
      var rv = {};
      var i;
      for (i in a) {
        rv[i] = true;
      }
      for (i in b) {
        rv[i] = true;
      }
      return rv;
    },
    diff: function(a, b) {
      var rv = {};
      var u = Set.union(a, b);
      for (var i in u) {
        if (a[i] === undefined || b[i] === undefined) {
          rv[i] = true;
        }
      }
      return rv;
    },
    intersect: function(a, b) {
      var rv = {};
      for (var i in a) {
        if (b[i] !== undefined) {
          rv[i] = true;
        }
      }
      return rv;
    }
  };

  function addCommand(cmd, depth, objects) {
    if (!objects[depth]) {
      objects[depth] = [];
    }
    objects[depth].push(cmd);
  }

  function traceKeys(o, name) {
    var s = [];
    for (var i in o) {
      s.push(i);
    }
    fl.trace(name + ": [" + s.join(",") + "]");
  }

  function compileFrame(index, frame, ctx, objects) {
    if (frame.elements.length === 0 && index === 0)
      return;

    var i, depth, cmd,
      lastKF = (index === 0 ? {
        elements: []
      } : ctx.layer.frames[index - 1]),
      lastmap = depthMap(lastKF.elements),
      currmap = depthMap(frame.elements),
      modify = Set.intersect(lastmap, currmap),
      diff = Set.diff(lastmap, currmap),
      remove = Set.intersect(diff, lastmap),
      add = Set.intersect(diff, currmap);

    ctx.frame = frame;

    // remove old elements
    for (i in remove) {
      cmd = Command.remove(ctx, index, lastmap[i]);
      depth = ctx.depth + i;
      addCommand(cmd, depth, objects);
    }

    // replace/move elements
    for (i in modify) {
      if (currmap[i].libraryItem == lastmap[i].libraryItem) {
        cmd = Command.move(ctx, index, currmap[i]);
      } else {
        cmd = Command.replace(ctx, index, currmap[i]);
      }
      depth = ctx.depth + i;
      addCommand(cmd, depth, objects);
    }

    // add new elements
    for (i in add) {
      cmd = Command.place(ctx, index, currmap[i]);
      depth = ctx.depth + i;
      addCommand(cmd, depth, objects);
    }
  }

  function compileLayer(index, layer, ctx, objects) {
    var frame, frames = layer.frames;
    ctx.layer = layer;

    for (var i = 0; i < frames.length; i += frame.duration) {
      frame = frames[i];

      if (frame.elements.length === 0)
        continue;

      if (frame.startFrame != i) // its not a keyframe
        continue;

      if (frame.tweenType == "shape")
        alert("图层：" + layer.name + "使用了不支持的补间形状（Shape Tween）。");

      if (frame.tweenType == "motion object")
        alert("图层：" + layer.name + "使用了不支持的补间动画（Motion Tween）。");


      compileFrame(i, frame, ctx, objects);
    }
  }

  function getLabels(tl) {
    var labels = {},
      frames = tl.layers[0].frames,
      frame, found = false;
    for (var i = 0; i < frames.length; i += frame.duration) {
      frame = frames[i];
      if (frame.labelType !== "none") {
        labels[frame.name] = i;
        found = true;
      }
    }
    return found ? labels : undefined;
  }

  function compileTimeline(tl, ctx) {
    var
      i,
      objects = {},
      layers = tl.layers;

    ctx.timeline = tl;

    for (i in layers) {
      var layer = layers[i];
      if (supported_layer_type[layer.layerType]) {
        ctx.depth = i * 10000;
        compileLayer(i, layer, ctx, objects);
      }
    }
    var depths = [];
    for (i in objects) {
      depths.push(i);
    }
    if (depths.length === 0)
      return undefined;

    depths.sort();

    var vector = [];
    for (i in depths) {
      vector.push(objects[depths[i]]);
    }

    return {
      "duration": tl.frameCount,
      "objects": vector,
      "labels": getLabels(tl),
      "fps": ctx.doc.frameRate
    };
  }

  function isRootMovieclip(item) {
    return (item.name.indexOf('/') === -1 &&
      item.itemType === "movie clip");
  }

  function isPart(item) {
    return item.name.match(/^parts\//) !== null;
  }

  function compileScenes(doc, filename) {
    var timelines = doc.timelines,
      i,
      scenes = {},
      context = {
        doc: doc
      },
      haveScene = false;
    for (i = 0; i < timelines.length; i++) {
      var tl = timelines[i];
      var o = compileTimeline(tl, context);
      if (o) {
        scenes[tl.name] = o;
        haveScene = true;
      }
    }

    if (!haveScene)
      return undefined;

    if (filename)
      FLfile.write(filename + ".scenes.json", JSON.encode(scenes));

    return scenes;
  }

  function compileAnimations(doc, filename) {
    var animations = {},
      items = doc.library.items,
      context = {
        doc: doc
      },
      haveAnimations = false;

    for (i = 0; i < items.length; i++) {
      if (isRootMovieclip(items[i])) {
        var o = compileTimeline(items[i].timeline, context);
        if (o) {
          animations[items[i].name] = o;
          haveAnimations = true;
        }

      }
    }

    if (!haveAnimations)
      return undefined;

    if (filename)
      FLfile.write(filename + ".animations.json", JSON.encode(animations));

    return animations;
  }

  function compileParts(doc, filename, packed) {
    var sse = new SpriteSheetExporter();
    sse.algorithm = "maxRects";
    sse.layoutFormat = "JSON";
    sse.allowTrimming = true;
    sse.borderPadding = 1;
    sse.shapePadding = 1;


    var items = doc.library.items;
    var haveParts = false;
    for (i = 0; i < items.length; i++) {
      var item = items[i];
      if (isPart(item)) {
        if (item.itemType === "bitmap") {
          sse.addBitmap(items[i]);
          haveParts = true;
        } else if (item.symbolType) {
          sse.addSymbol(items[i]);
          haveParts = true;
        }
      }
    }
    if (!haveParts)
      return undefined;

    var format = {
        format: "png",
        bitDepth: 32,
        backgroundColor: "#00000000"
      },
      json = sse.exportSpriteSheet(filename, format, false),
      images = JSON.decode(json.replace(/[\n\t]/g, '').replace(/\"/g, '"')),
      parts = {},
      name;

    for (var frame in images.frames) {
      var data = images.frames[frame],
          m = frame.match(/^(.+)(\d{4})$/),
          index = parseInt(m[2], 10);
      name = m[1];
      if (parts[name] === undefined)
        parts[name] = [];

      data.index = index;
      var f = [data.frame.x, data.frame.y, data.frame.w, data.frame.h];

      if (data.trimmed || data.rotated)
      {
        f.push(data.spriteSourceSize.x);
        f.push(data.spriteSourceSize.y);

        if (data.rotated)
        {
          f.push(data.spriteSourceSize.h);
          f.push(data.spriteSourceSize.w);
        }
        else
        {
          f.push(data.spriteSourceSize.w);
          f.push(data.spriteSourceSize.h);
        }
      }
      parts[name][index] = f;
    }

    if (!packed)
      FLfile.write(filename + ".parts.json", JSON.encode(parts));

    return parts;
  }

  function objectKeysCount(object) {
    var i = 0;
    for (var name in object) {
      ++i;
    }
    return i;
  }

  function quantity(n, unit, pl) {
    if (!pl)
      pl = unit + "s";
    return (n <= 1) ? (n + " " + unit) : (n + " " + pl);
  }

  function now() {
    return new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
  }

  Cutout = {
    export: function(doc, filename, packed) {
      var result = {
        "scenes": compileScenes(doc, packed ? undefined : filename),
        "animations": compileAnimations(doc, packed ? undefined : filename),
        "parts": compileParts(doc, filename, packed)
      };

      if (packed)
        FLfile.write(filename + ".json", JSON.encode(result));

      fl.trace("[" + now() + "] Cutout (" + VERSION + ") exported: " +
        quantity(objectKeysCount(result.parts), "part") + ", " +
        quantity(objectKeysCount(result.animations), "animation") + ", " +
        quantity(objectKeysCount(result.scenes), "scene") + ".");
    }
  };

  var doc = fl.getDocumentDOM();
  if (!doc) {
    alert("请先打开要处理的FLA文档。");
    return;
  }
  var filename = doc.pathURI.replace(/\.fla$/i, '');
  Cutout.export(doc, filename, true);
})();
