/* Carnet de repas — écran de cuisine. Fichier généré, ne pas modifier à la main. */
;
/* Petits compléments pour les vieux navigateurs (vieil iPad, Safari 9+). */
(function(){
  if (!String.prototype.padStart) String.prototype.padStart = function(n, s){ var t = String(this); s = s === undefined ? ' ' : String(s); while (t.length < n) t = s + t; return t.slice(-Math.max(n, String(this).length)); };
  if (!String.prototype.normalize) String.prototype.normalize = function(){ return String(this); };
  if (!Object.entries) Object.entries = function(o){ return Object.keys(o).map(function(k){ return [k, o[k]]; }); };
  if (!Object.values) Object.values = function(o){ return Object.keys(o).map(function(k){ return o[k]; }); };
  if (!Array.prototype.flatMap) Array.prototype.flatMap = function(f, t){ return Array.prototype.concat.apply([], this.map(f, t)); };
  if (!Array.prototype.includes) Array.prototype.includes = function(v){ return this.indexOf(v) >= 0; };
  if (!String.prototype.includes) String.prototype.includes = function(v){ return this.indexOf(v) >= 0; };
  if (!String.prototype.startsWith) String.prototype.startsWith = function(v){ return this.indexOf(v) === 0; };
  if (window.Element && !Element.prototype.matches) Element.prototype.matches = Element.prototype.webkitMatchesSelector || Element.prototype.msMatchesSelector;
  if (window.Element && !Element.prototype.closest) Element.prototype.closest = function(s){ var el = this; while (el && el.nodeType === 1) { if (el.matches(s)) return el; el = el.parentNode; } return null; };
  if (!window.requestAnimationFrame) window.requestAnimationFrame = function(f){ return setTimeout(f, 16); };
})();

;
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; };
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) });

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  define(IteratorPrototype, iteratorSymbol, function () {
    return this;
  });

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = GeneratorFunctionPrototype;
  defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: true });
  defineProperty(
    GeneratorFunctionPrototype,
    "constructor",
    { value: GeneratorFunction, configurable: true }
  );
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    defineProperty(this, "_invoke", { value: enqueue });
  }

  defineIteratorMethods(AsyncIterator.prototype);
  define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
    return this;
  });
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per GeneratorResume behavior specified since ES2015:
        // ES2015 spec, step 3: https://262.ecma-international.org/6.0/#sec-generatorresume
        // Latest spec, step 2: https://tc39.es/ecma262/#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var methodName = context.method;
    var method = delegate.iterator[methodName];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method, or a missing .next method, always terminate the
      // yield* loop.
      context.delegate = null;

      // Note: ["return"] must be used for ES3 parsing compatibility.
      if (methodName === "throw" && delegate.iterator["return"]) {
        // If the delegate iterator has a return method, give it a
        // chance to clean up.
        context.method = "return";
        context.arg = undefined;
        maybeInvokeDelegate(delegate, context);

        if (context.method === "throw") {
          // If maybeInvokeDelegate(context) changed context.method from
          // "return" to "throw", let that override the TypeError below.
          return ContinueSentinel;
        }
      }
      if (methodName !== "return") {
        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a '" + methodName + "' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  define(Gp, iteratorSymbol, function() {
    return this;
  });

  define(Gp, "toString", function() {
    return "[object Generator]";
  });

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(val) {
    var object = Object(val);
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable != null) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    throw new TypeError(typeof iterable + " is not iterable");
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
  typeof module === "object" ? module.exports : {}
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, in modern engines
  // we can explicitly access globalThis. In older engines we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  if (typeof globalThis === "object") {
    globalThis.regeneratorRuntime = runtime;
  } else {
    Function("r", "regeneratorRuntime = r")(runtime);
  }
}

;
(function () {
  window.__KIOSK = true;
  var cache = {
    recipes: {},
    months: {},
    courses: {},
    settings: {},
    bilans: {}
  };
  var colSubs = {},
    docSubs = {},
    stamp = '',
    started = false;
  function xhrJSON(url, cb) {
    var r = new XMLHttpRequest();
    r.open('GET', url, true);
    r.onreadystatechange = function () {
      if (r.readyState !== 4) return;
      var d = null;
      try {
        d = JSON.parse(r.responseText);
      } catch (e) {}
      cb(r.status === 200 ? d : null);
    };
    r.onerror = function () {
      cb(null);
    };
    r.send();
  }
  function docSnap(id, _data) {
    return {
      id: id,
      exists: !!_data,
      data: function data() {
        return _data ? JSON.parse(JSON.stringify(_data)) : undefined;
      }
    };
  }
  function colSnap(col) {
    var docs = Object.keys(cache[col] || {}).sort().map(function (id) {
      return docSnap(id, cache[col][id]);
    });
    return {
      docs: docs,
      size: docs.length,
      empty: !docs.length
    };
  }
  function notifyAll() {
    Object.keys(colSubs).forEach(function (c) {
      colSubs[c].forEach(function (f) {
        try {
          f(colSnap(c));
        } catch (e) {}
      });
    });
    Object.keys(docSubs).forEach(function (p) {
      var a = p.split('/');
      docSubs[p].forEach(function (f) {
        try {
          f(docSnap(a[1], (cache[a[0]] || {})[a[1]]));
        } catch (e) {}
      });
    });
  }
  function load(cb) {
    xhrJSON('donnees.json?t=' + Date.now(), function (d) {
      if (!d || !d.collections) {
        cb(false);
        return;
      }
      if (d.genere !== stamp) {
        stamp = d.genere || '';
        try {
          var p = stamp.slice(0, 10).split('-');
          document.getElementById('kstamp').textContent = '· données du ' + p[2] + '/' + p[1];
        } catch (e) {}
        Object.keys(d.collections).forEach(function (c) {
          cache[c] = d.collections[c] || {};
        });
        if (started) notifyAll();
      }
      cb(true);
    });
  }
  var refuse = function refuse() {
    return Promise.reject({
      code: 'invalid_argument'
    });
  };
  function docRef(path) {
    var a = path.split('/');
    return {
      get: function get() {
        return Promise.resolve(docSnap(a[1], (cache[a[0]] || {})[a[1]]));
      },
      set: refuse,
      update: refuse,
      'delete': refuse,
      onSnapshot: function onSnapshot(next) {
        (docSubs[path] = docSubs[path] || []).push(next);
        setTimeout(function () {
          next(docSnap(a[1], (cache[a[0]] || {})[a[1]]));
        }, 0);
        return function () {};
      }
    };
  }
  var db = {
    doc: docRef,
    collection: function collection(col) {
      return {
        doc: function doc(id) {
          return docRef(col + '/' + id);
        },
        onSnapshot: function onSnapshot(next) {
          (colSubs[col] = colSubs[col] || []).push(next);
          setTimeout(function () {
            next(colSnap(col));
          }, 0);
          return function () {};
        }
      };
    }
  };
  var readyResolve;
  var ready = new Promise(function (res) {
    readyResolve = res;
  });
  function boot() {
    load(function (ok) {
      if (!ok) {
        setTimeout(boot, 15000);
        return;
      }
      started = true;
      readyResolve(db);
    });
  }
  boot();
  setInterval(function () {
    if (started) load(function () {});
  }, 30 * 60 * 1000);
  var last = Date.now(),
    day = new Date().getDate();
  ['touchstart', 'click', 'scroll'].forEach(function (ev) {
    document.addEventListener(ev, function () {
      last = Date.now();
    }, true);
  });
  setInterval(function () {
    if (new Date().getDate() !== day) {
      location.reload();
      return;
    }
    if (Date.now() - last > 20 * 60 * 1000 && !document.querySelector('.cook')) {
      try {
        localStorage.removeItem('tab');
      } catch (e) {}
      if (location.hash !== '#today') location.hash = '#today';
      location.reload();
    }
  }, 60 * 1000);
  window.claude = {
    use: function use(name) {
      return name === 'db' ? ready : Promise.resolve(null);
    }
  };
})();
;
function _regenerator() { var r, e, o = "function" == typeof Symbol ? Symbol : {}, n = o.iterator || "@@iterator", a = o.toStringTag || "@@toStringTag"; function i(o, n, a, i) { var u = n && n.prototype instanceof Generator ? n : Generator, f = Object.create(u.prototype); return _regeneratorDefine2(f, "_invoke", function (t, o, n) { var a, i, u, f = 0, p = n || [], y = !1, G = { p: 0, n: 0, v: r, a: l, f: l.bind(r, 4), d: function d(t, e) { return a = t, i = 0, u = r, G.n = e, c; } }; function l(t, o) { for (i = t, u = o, e = 0; !y && f && !n && e < p.length; e++) { var n, a = p[e], l = G.p, F = a[2]; t > 3 ? (n = F === o) && (u = a[(i = a[4]) ? 5 : (i = 3, 3)], a[4] = a[5] = r) : a[0] <= l && ((n = t < 2 && l < a[1]) ? (i = 0, G.v = o, G.n = a[1]) : l < F && (n = t < 3 || a[0] > o || o > F) && (a[4] = t, a[5] = o, G.n = F, i = 0)); } if (n || t > 1) return c; throw y = !0, o; } return function (n, p, F) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && l(p, F), i = p, u = F; (e = i < 2 ? r : u) || !y;) { a || (i ? (i > 1 && (G.n = i < 3 ? -1 : u), l(i, u)) : G.v = u); try { if (f = 2, a) { if (i || (n = "next"), e = a[n]) { if (!(e = e.call(a, u))) throw TypeError("iterator result is not an object"); if (!e.done) return e; u = e.value, i < 2 && (i = 0); } else 1 === i && (e = a.return) && e.call(a), i < 2 && (u = TypeError("The iterator does not provide a '" + n + "' method"), i = 1); a = r; } else if ((e = (y = G.n < 0) ? u : t.call(o, G)) !== c) break; } catch (t) { a = r, i = 1, u = t; } finally { f = 1; } } return { value: e, done: y }; }; }(o, a, i), !0), f; } var c = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} e = Object.getPrototypeOf; var u = [][n] ? e(e([][n]())) : (_regeneratorDefine2(e = {}, n, function () { return this; }), e), f = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(u); function p(r) { return Object.setPrototypeOf ? Object.setPrototypeOf(r, GeneratorFunctionPrototype) : (r.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(r, a, "GeneratorFunction")), r.prototype = Object.create(f), r; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(f, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, a, "GeneratorFunction"), _regeneratorDefine2(f), _regeneratorDefine2(f, a, "Generator"), _regeneratorDefine2(f, n, function () { return this; }), _regeneratorDefine2(f, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: p }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _toConsumableArray(a) { return _arrayWithoutHoles(a) || _iterableToArray(a) || _unsupportedIterableToArray(a) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { var e = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (Array.isArray(r) && (null == e || e === ("undefined" != typeof Symbol && [][Symbol.iterator]) || e === []["@@iterator"])) return r; if (null != e) { for (var t, o = [], a = e.call(r); !(t = a.next()).done;) o.push(t.value); return o; } }
function _arrayWithoutHoles(a) { if (Array.isArray(a)) return _arrayLikeToArray(a); }
function _slicedToArray(e, i) { return _iterableToArrayLimit(e, i) || _unsupportedIterableToArray(e, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(t, e) { if (t) { if ("string" == typeof t) return _arrayLikeToArray(t, e); var o = {}.toString.call(t).slice(8, -1); return "Object" === o && t.constructor && (o = t.constructor.name), "Map" === o || "Set" === o ? Array.from(t) : "Arguments" === o || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(o) ? _arrayLikeToArray(t, e) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, t) { var e = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (Array.isArray(r) && (null == e || e === ("undefined" != typeof Symbol && [][Symbol.iterator]) || e === []["@@iterator"])) return r; if (null != e) { var l, n, i, a, u = [], o = !0, f = !1; try { if (i = (e = e.call(r)).next, 0 === t) { if (Object(e) !== e) return; o = !1; } else for (; !(o = (l = i.call(e)).done) && (u.push(l.value), u.length !== t); o = !0); } catch (r) { f = !0, n = r; } finally { try { if (!o && null != e.return && (a = e.return(), Object(a) !== a)) return; } finally { if (f) throw n; } } return u; } }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
(function () {
  var app = document.getElementById('app');
  var esc = function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c];
    });
  };
  var clone = function clone(o) {
    return JSON.parse(JSON.stringify(o));
  };
  var store = function store(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  };
  var load = function load(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  };
  var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var fmt = function fmt(iso) {
    if (!iso) return '';
    var p = iso.split('-').map(Number);
    return p[2] + ' ' + MOIS[p[1] - 1];
  };
  var OFF = {
    site: ['Sur site', 'Sur site, pas de repas à prévoir'],
    commande: ['Commande', 'Commande à emporter'],
    vacances: ['Vacances', 'En vacances, rien à préparer']
  };
  var offShort = function offShort(o) {
      return (OFF[o] || ['—'])[0];
    },
    offLong = function offLong(o) {
      return (OFF[o] || ['—', '—'])[1];
    };
  var now = new Date();
  var daysSince = function daysSince(d) {
    var p = String(d || '').split('-').map(Number);
    if (p.length < 3) return 0;
    return Math.floor((Date.now() - new Date(p[0], p[1] - 1, p[2]).getTime()) / 864e5);
  };
  var ICON_UPA = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3.5 10 8 5.5l4.5 4.5"/></svg>';
  var iso = function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  var TOMORROW_G = iso(new Date(now.getTime() + 864e5));
  var TODAY = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  var ICON_UP = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 14.2 6.9 13.2C3 9.7.5 7.4.5 4.6.5 2.4 2.2.7 4.4.7c1.2 0 2.4.6 3.1 1.5h1C9.2 1.3 10.4.7 11.6.7c2.2 0 3.9 1.7 3.9 3.9 0 2.8-2.5 5.1-6.4 8.6z"/></svg>';
  var ICON_DOWN = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M3.5 3.5l9 9m0-9-9 9"/></svg>';
  var ICON_BOOK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M2 3.2c2-.9 4-.9 6 .6 2-1.5 4-1.5 6-.6v9.6c-2-.9-4-.9-6 .6-2-1.5-4-1.5-6-.6zM8 3.8v9.6"/></svg>';
  var ICON_DEV = {
    thermomix: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M3 5h10l-1.2 8.2a1 1 0 0 1-1 .8H5.2a1 1 0 0 1-1-.8zM5.5 5V3.5h5V5M13 7h1.5v3H12.6"/></svg>',
    airfryer: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2.5" width="10" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M5.5 9h5M6 5.5h4"/></svg>'
  };
  var ICON_SWAP = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 2.5v11M1.5 11 4 13.5 6.5 11M12 13.5v-11M9.5 5 12 2.5 14.5 5"/></svg>';
  var ICON_MORE = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="3.5" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12.5" cy="8" r="1.5" fill="currentColor"/></svg>';
  var ICON_PEN = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M10.5 2.5l3 3L6 13H3v-3z"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4 2.8v10.4a.6.6 0 0 0 .9.5l8.3-5.2a.6.6 0 0 0 0-1L4.9 2.3a.6.6 0 0 0-.9.5z"/></svg>';
  var ICON_SNOW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M8 1.5v13M2.4 4.8l11.2 6.4M2.4 11.2l11.2-6.4M6 2.8 8 4.5l2-1.7M6 13.2l2-1.7 2 1.7"/></svg>';
  var ICON_X = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 4l8 8m0-8-8 8"/></svg>';
  var ICON_BACK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M10 3 5 8l5 5"/></svg>';
  var S = {
    status: 'loading',
    months: {},
    lists: {},
    prefs: null,
    recipes: {},
    recipeId: null,
    q: '',
    cuisine: '',
    snacks: [],
    snackType: '',
    snackNow: false,
    monthId: load('month'),
    listId: load('list'),
    tab: 'plan',
    editing: null,
    confirmReset: false,
    readOnly: !!window.__KIOSK,
    dirty: false
  };
  var TABS = ['today', 'plan', 'courses', 'frigo', 'recettes'];
  var h = (location.hash || '').slice(1);
  S.tab = TABS.includes(h) ? h : 'today';
  S.cook = null;
  S.timers = [];
  var db = null;
  var pending = {};
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(function () {
      t.hidden = true;
    }, 2600);
  }
  function queue(path, fields) {
    var p = pending[path] || (pending[path] = {
      data: {},
      timer: null,
      busy: false
    });
    Object.assign(p.data, fields);
    clearTimeout(p.timer);
    p.timer = setTimeout(function () {
      return flush(path);
    }, 400);
  }
  function flush(_x) {
    return _flush.apply(this, arguments);
  }
  function _flush() {
    _flush = _asyncToGenerator(_regenerator().m(function _callee(path) {
      var p, data, code, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            p = pending[path];
            if (!(!p || p.busy)) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            data = p.data;
            p.data = {};
            p.busy = true;
            _context.p = 2;
            _context.n = 3;
            return db.doc(path).update(data);
          case 3:
            _context.n = 6;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            code = _t && _t.code;
            if (!(code === 'unavailable' && !p.retried)) {
              _context.n = 5;
              break;
            }
            p.retried = true;
            p.data = Object.assign({}, data, p.data);
            p.busy = false;
            setTimeout(function () {
              return flush(path);
            }, 700 + Math.random() * 700);
            return _context.a(2);
          case 5:
            if (code === 'invalid_argument') {
              S.readOnly = true;
              toast('Cette page est en lecture seule pour toi.');
              render();
            } else toast("L'enregistrement n'a pas abouti. Réessaie dans un instant.");
          case 6:
            p.busy = false;
            p.retried = false;
            if (Object.keys(p.data).length) flush(path);else delete pending[path];
          case 7:
            return _context.a(2);
        }
      }, _callee, null, [[2, 4]]);
    }));
    return _flush.apply(this, arguments);
  }
  function requestRender() {
    var a = document.activeElement;
    if (S.editing || a && app.contains(a) && (a.tagName === 'INPUT' && a.type === 'text' || a.tagName === 'TEXTAREA')) {
      S.dirty = true;
      return;
    }
    render();
  }
  app.addEventListener('focusout', function () {
    setTimeout(function () {
      if (S.dirty && !S.editing) {
        S.dirty = false;
        render();
      }
    }, 50);
  });
  function monthsSorted() {
    return Object.entries(S.months).map(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
        id = _ref2[0],
        m = _ref2[1];
      return Object.assign({
        id: id
      }, m);
    }).sort(function (a, b) {
      return String(a.start).localeCompare(String(b.start));
    });
  }
  function activeMonths() {
    return monthsSorted().filter(function (m) {
      return !m.end || m.end >= TODAY;
    });
  }
  function pickMonth() {
    var ms = activeMonths();
    if (!ms.length) {
      S.monthId = null;
      return;
    }
    if (S.monthId && ms.find(function (m) {
      return m.id === S.monthId;
    })) return;
    var tm = new Date(now.getTime() + 864e5),
      TOMORROW = tm.getFullYear() + '-' + String(tm.getMonth() + 1).padStart(2, '0') + '-' + String(tm.getDate()).padStart(2, '0');
    var live = ms.filter(function (m) {
      return m.start <= TOMORROW && TODAY <= m.end;
    });
    var cur = live[live.length - 1] || ms.find(function (m) {
      return m.start > TODAY;
    }) || ms[ms.length - 1];
    S.monthId = cur.id;
  }
  function listsForMonth() {
    return Object.entries(S.lists).map(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2),
        id = _ref4[0],
        l = _ref4[1];
      return Object.assign({
        id: id
      }, l);
    }).filter(function (l) {
      return l.monthId === S.monthId;
    }).sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
  }
  function pickList() {
    var ls = listsForMonth();
    if (!ls.length) {
      S.listId = null;
      return null;
    }
    if (!ls.find(function (l) {
      return l.id === S.listId;
    })) {
      var open = ls.find(function (l) {
        return l.sections.some(function (s) {
          return s.items.some(function (i) {
            return !i.done;
          });
        });
      });
      S.listId = (open || ls[ls.length - 1]).id;
    }
    return S.lists[S.listId];
  }
  function hero(inner) {
    return '<header class="hero"><div class="wrap hero-in">' + inner + '</div></header>';
  }
  function todayCard(m) {
    if (!m) return '';
    var found = null;
    m.weeks.forEach(function (w) {
      return w.days.forEach(function (d) {
        if (!found && d.date >= TODAY) found = d;
      });
    });
    if (!found) return '';
    var lab = function lab(x) {
      return !x ? '—' : x.off ? offShort(x.off) : x.name;
    };
    var title = found.date === TODAY ? 'Aujourd\'hui' : 'Prochain repas · ' + found.day.toLowerCase() + ' ' + fmt(found.date);
    return '<div class="today-card"><span class="hand">' + esc(title) + '</span><div class="tc-row"><span class="slot midi">Midi</span><span>' + esc(lab(found.midi)) + '</span></div><div class="tc-row"><span class="slot soir">Soir</span><span>' + esc(lab(found.soir)) + '</span></div></div>';
  }
  function render() {
    if (S.cook && S.recipes[S.cook.id]) {
      app.innerHTML = renderCook();
      return;
    }
    if (S.status === 'loading') {
      app.innerHTML = hero('<span class="eyebrow">Mon carnet de cuisine</span><h1 class="display">Chargement…</h1>');
      return;
    }
    if (S.status === 'unavailable') {
      app.innerHTML = hero('<span class="eyebrow">Mon carnet de cuisine</span><h1 class="display">Carnet des repas</h1>') + '<div class="wrap"><p class="state">Le carnet charge ses données quand la page est ouverte dans Claude, connecté à ton compte. Rouvre-la depuis ta galerie d\'artefacts.</p></div>';
      return;
    }
    pickMonth();
    var m = S.monthId ? S.months[S.monthId] : null;
    var list = pickList();
    var left = list ? list.sections.reduce(function (n, s) {
      return n + s.items.filter(function (i) {
        return !i.done;
      }).length;
    }, 0) : 0;
    var top = '<div class="hero-text"><span class="eyebrow">Mon carnet de cuisine</span>';
    top += '<h1 class="display">' + esc(m ? m.label : 'Aucun mois planifié') + '</h1>';
    if (m) top += '<span class="range">du ' + fmt(m.start) + ' au ' + fmt(m.end) + ' · anti-inflammatoire, saveurs du Maroc et d\'ailleurs</span>';
    var ms = activeMonths();
    if (ms.length > 1) top += '<div class="months" role="group" aria-label="Mois">' + ms.map(function (x) {
      return '<button class="mchip" data-act="month" data-id="' + esc(x.id) + '" aria-pressed="' + (x.id === S.monthId) + '">' + esc(x.label) + '</button>';
    }).join('') + '</div>';
    top += '</div>' + (S.tab === 'today' ? '' : todayCard(m));
    var html = hero(top) + '<div class="wrap">';
    html += '<nav class="tabs" role="tablist">' + tabBtn('today', 'Aujourd\'hui', '') + tabBtn('plan', 'Planning', '') + tabBtn('courses', 'Courses', list ? '<span class="count">' + left + '</span>' : '') + tabBtn('frigo', 'Frigo', '') + tabBtn('recettes', 'Recettes', '') + '</nav>';
    html += '<main class="' + (S.readOnly ? 'ro' : '') + '">';
    if (S.used && (S.tab === 'today' || S.tab === 'plan')) html += renderUsed();
    if (S.tab === 'today') html += renderToday(m);else if (S.tab === 'plan') html += renderPlan(m);else if (S.tab === 'frigo') html += renderFrigo();else if (S.tab === 'courses') html += renderCourses(list);else if (S.tab === 'recettes') html += S.recipeId && S.recipes[S.recipeId] ? renderRecipe(S.recipeId) : renderRecipes();else html += renderRecipes();
    html += '</main></div>';
    app.innerHTML = html;
    {
      var nav = app.querySelector('.tabs'),
        t = nav && nav.querySelector('[aria-selected="true"]');
      if (t && (t.offsetLeft + t.offsetWidth > nav.scrollLeft + nav.clientWidth || t.offsetLeft < nav.scrollLeft)) nav.scrollLeft = Math.max(0, t.offsetLeft - 16);
    }
    if (S.editing) {
      var ta = document.getElementById('edit-meal');
      if (ta) {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    }
  }
  function tabBtn(id, label, extra) {
    return '<button class="tab" role="tab" data-act="tab" data-id="' + id + '" aria-selected="' + (S.tab === id) + '">' + label + extra + '</button>';
  }
  function renderPlan(m) {
    if (!m) return '<p class="empty">Aucun planning pour l\'instant. Demande à Claude de préparer le mois.</p>';
    var html = '';
    if (S.swap) {
      var sx = S.months[S.monthId].weeks[S.swap.w].days[S.swap.d][S.swap.slot] || {};
      html += '<div class="swapbar" role="status"><span>Où veux-tu mettre <b>' + esc(sx.off ? offShort(sx.off) : sx.name) + '</b> ? Touche le repas avec lequel l\'échanger.</span><button class="btn" data-act="swapcancel">Annuler</button></div>';
    } else if (!S.readOnly) html += '<p class="hint">Touche le nom d\'un plat pour ouvrir sa recette. Le cœur = fait, la croix = pas envie (Claude réutilisera ses ingrédients). Le bouton « … » sert à échanger deux repas de place ou à changer un plat.</p>';
    m.weeks.forEach(function (w, wi) {
      if (!S.showPast && !w.days.some(function (d) {
        return d.date >= TODAY;
      })) return;
      var first = S.showPast ? w.days[0] : w.days.find(function (d) {
          return d.date >= TODAY;
        }),
        last = w.days[w.days.length - 1];
      html += '<section class="week"><div class="week-head"><h2 class="serif">' + esc(w.label) + '</h2><span class="range">' + fmt(first.date) + ' – ' + fmt(last.date) + '</span></div>';
      w.days.forEach(function (d, di) {
        if (!S.showPast && d.date < TODAY) return;
        var we = /samedi|dimanche/i.test(d.day);
        var today = d.date === TODAY;
        html += '<div class="day' + (we ? ' we' : '') + (today ? ' today' : '') + '"><div class="dhead"><div class="dname">' + esc(d.day) + '</div><div class="ddate">' + fmt(d.date) + '</div>' + (today ? '<span class="pill">Aujourd\'hui</span>' : '') + '</div><div class="meals">' + meal(wi, di, 'midi', 'Midi', d.midi) + meal(wi, di, 'soir', 'Soir', d.soir) + '</div></div>';
      });
      html += '</section>';
    });
    if (!S.swap) {
      html += '<p class="pastlink"><button class="inline-link" data-act="past">' + (S.showPast ? 'Masquer les jours passés' : 'Voir les jours et les mois passés') + '</button></p>';
      if (S.showPast) {
        var lab = function lab(x) {
          return !x ? '—' : x.off ? offShort(x.off).toLowerCase() : x.name;
        };
        monthsSorted().reverse().filter(function (o) {
          return o.id !== S.monthId;
        }).forEach(function (o) {
          html += '<details class="month"><summary>' + esc(o.label) + ' <small>· du ' + fmt(o.start) + ' au ' + fmt(o.end) + '</small></summary>';
          o.weeks.forEach(function (w) {
            html += '<div class="eyebrow" style="margin-top:10px">' + esc(w.label) + '</div><ol>';
            w.days.forEach(function (d) {
              html += '<li>' + esc(d.day) + ' ' + fmt(d.date) + ' : ' + esc(lab(d.midi)) + ' / ' + esc(lab(d.soir)) + '</li>';
            });
            html += '</ol>';
          });
          html += '</details>';
        });
      }
    }
    return html;
  }
  function meal(wi, di, slot, label, x) {
    x = x || {
      name: '',
      rating: 0
    };
    var ed = S.editing && S.editing.w === wi && S.editing.d === di && S.editing.slot === slot;
    var key = 'data-w="' + wi + '" data-d="' + di + '" data-slot="' + slot + '"';
    var lab = '<span class="mlabel ' + slot + '">' + label + '</span>';
    if (ed) {
      return '<div class="meal">' + lab + '<div class="editbox"><textarea class="edit" id="edit-meal" ' + key + ' aria-label="' + label + '" placeholder="Nom du plat">' + esc(x.name) + '</textarea>' + '<div class="editbar"><button class="btn primary" data-act="save" ' + key + '>Enregistrer</button><button class="btn" data-act="off" data-v="site" ' + key + '>Sur site</button><button class="btn" data-act="off" data-v="commande" ' + key + '>Commande</button><button class="btn" data-act="off" data-v="vacances" ' + key + '>Vacances</button><button class="btn" data-act="cancel">Annuler</button></div></div><div></div></div>';
    }
    var isSrc = S.swap && S.swap.w === wi && S.swap.d === di && S.swap.slot === slot;
    if (S.swap) {
      var txt = x.off ? offShort(x.off) : x.name || '—';
      if (isSrc) return '<div class="meal swap-src">' + lab + '<div class="mcell"><span class="mname">' + esc(txt) + '</span><span class="mmeta">Repas à déplacer</span></div><div></div></div>';
      return '<button class="meal swap-target" data-act="swapto" ' + key + '>' + lab + '<span class="mcell"><span class="mname">' + esc(txt) + '</span><span class="mmeta">Toucher pour échanger</span></span><span class="swap-ico" aria-hidden="true">' + ICON_SWAP + '</span></button>';
    }
    var open = S.menu && S.menu.w === wi && S.menu.d === di && S.menu.slot === slot;
    var more = S.readOnly ? '' : '<button class="rb more" data-act="menu" ' + key + ' aria-expanded="' + open + '" aria-label="Plus d\'options" title="Plus d\'options">' + ICON_MORE + '</button>';
    var menu = open ? '<div class="mmenu"><button class="btn sm" data-act="swap" ' + key + '>' + ICON_SWAP + 'Échanger de place</button><button class="btn sm" data-act="edit" ' + key + '>' + ICON_PEN + 'Changer le plat</button>' + (x.off ? '' : '<button class="btn sm" data-act="off" data-v="site" ' + key + '>Sur site</button><button class="btn sm" data-act="off" data-v="commande" ' + key + '>Commande</button><button class="btn sm" data-act="off" data-v="vacances" ' + key + '>Vacances</button>') + '</div>' : '';
    if (x.off) {
      var _txt = offLong(x.off);
      return '<div class="meal off">' + lab + '<div class="mcell"><span class="offchip ' + esc(x.off) + '">' + _txt + '</span></div><div class="rate">' + more + '</div>' + menu + '</div>';
    }
    var r = x.recipeId && S.recipes[x.recipeId];
    var meta = r ? '<span class="mmeta">' + ICON_BOOK + totalTime(r) + (bestOf(r) !== 'classique' ? ' · ' + DEV[bestOf(r)] : '') + (x.leftover ? ' · restes' : '') + '</span>' : x.leftover ? '<span class="mmeta">restes</span>' : '';
    var name = r ? '<button class="mname link" data-act="recipe" data-id="' + esc(x.recipeId) + '">' + esc(x.name || r.title) + '</button>' : '<span class="mname">' + esc(x.name || '—') + '</span>';
    var body = '<div class="mcell">' + name + meta + '</div>';
    var rate = S.readOnly ? '<div></div>' : '<div class="rate"><button class="rb good" data-act="rate" data-v="1" ' + key + ' aria-pressed="' + (x.rating === 1) + '" aria-label="Fait" title="Fait">' + ICON_UP + '</button><button class="rb bad" data-act="rate" data-v="-1" ' + key + ' aria-pressed="' + (x.rating === -1) + '" aria-label="Pas envie" title="Pas envie">' + ICON_DOWN + '</button>' + more + '</div>';
    return '<div class="meal">' + lab + body + rate + menu + '</div>';
  }
  function renderCourses(list) {
    var ls = listsForMonth();
    if (!list) return '<p class="empty">Pas encore de liste de courses pour ce mois. Demande à Claude de la préparer.</p>';
    var html = '';
    if (ls.length > 1) html += '<div class="lists" role="group" aria-label="Listes">' + ls.map(function (l) {
      return '<button class="mchip" data-act="list" data-id="' + esc(l.id) + '" aria-pressed="' + (l.id === S.listId) + '">' + esc(l.label) + '</button>';
    }).join('') + '</div>';
    var total = list.sections.reduce(function (n, s) {
      return n + s.items.length;
    }, 0);
    var done = list.sections.reduce(function (n, s) {
      return n + s.items.filter(function (i) {
        return i.done;
      }).length;
    }, 0);
    html += '<div class="progress"><div class="row"><span><strong>' + done + ' / ' + total + '</strong> articles pris · ' + esc(list.label) + (list.people ? ' · pour ' + list.people + ' personnes' : '') + '</span>' + (S.readOnly || !done ? '' : '<button class="btn" data-act="askreset">Tout décocher</button>') + '</div><div class="bar"><span style="width:' + (total ? Math.round(done / total * 100) : 0) + '%"></span></div>' + function () {
      var n = list.sections.reduce(function (a, s) {
        return a + s.items.filter(function (i) {
          return i.done && !i.stored;
        }).length;
      }, 0);
      return n && !S.readOnly ? '<div class="storebar"><span><b>' + n + ' article' + (n > 1 ? 's' : '') + ' pris</b>, pas encore dans le frigo.</span><button class="btn primary sm" data-act="storeall">Ranger dans le frigo</button></div>' : '';
    }() + '</div>';
    html += '<p class="hint small">Ce que tu as déjà à la maison se gère dans l\'onglet <button class="inline-link" data-act="tab" data-id="frigo">Frigo</button>. La flèche à côté d\'un rayon le fait monter : range-les dans l\'ordre de ton magasin. Pour faire les courses à deux, partage le lien du carnet : la personne connectée à Claude coche aussi, et tu vois ce qui est déjà pris.</p>';
    if (S.confirmReset) html += '<div class="confirm" role="alert"><span>Décocher les ' + done + ' articles pris ?</span><button class="btn danger" data-act="reset">Décocher</button><button class="btn" data-act="cancelreset">Annuler</button></div>';
    aisleOrder(list.sections).forEach(function (si, pos) {
      var s = list.sections[si];
      var rest = s.items.filter(function (i) {
        return !i.done;
      }).length;
      html += '<section class="shop"><div class="shop-h"><h2 class="serif">' + esc(s.title) + '</h2>' + (pos > 0 && !S.readOnly ? '<button class="aisle" data-act="aisleup" data-t="' + esc(s.title) + '" aria-label="Monter le rayon ' + esc(s.title) + '" title="Monter ce rayon (ordre de ton magasin)">' + ICON_UPA + '</button>' : '') + '</div><div class="sub">' + esc(s.sub || '') + (s.sub ? ' · ' : '') + rest + ' à prendre</div>';
      s.items.forEach(function (it) {
        var id = 'it-' + esc(S.listId) + '-' + esc(it.id);
        html += '<div class="item' + (it.done ? ' done' : '') + '"><input type="checkbox" id="' + id + '" data-act="check" data-s="' + si + '" data-i="' + esc(it.id) + '"' + (it.done ? ' checked' : '') + (S.readOnly ? ' disabled' : '') + '><label for="' + id + '">' + esc(it.text) + '</label>' + (it.added && !S.readOnly ? '<button class="del" data-act="del" data-s="' + si + '" data-i="' + esc(it.id) + '" aria-label="Retirer ' + esc(it.text) + '">×</button>' : '') + '</div>';
      });
      if (!S.readOnly) html += '<form class="add" data-s="' + si + '"><input type="text" id="add-' + si + '" placeholder="Ajouter un article" aria-label="Ajouter un article à ' + esc(s.title) + '"><button class="btn primary" type="submit">Ajouter</button></form>';
      html += '</section>';
    });
    return html;
  }
  function renderHist() {
    var ms = monthsSorted().reverse();
    var meals = [];
    ms.forEach(function (m) {
      return m.weeks.forEach(function (w) {
        return w.days.forEach(function (d) {
          return ['midi', 'soir'].forEach(function (sl) {
            if (d[sl] && d[sl].name && !d[sl].off) meals.push({
              name: d[sl].name,
              rating: d[sl].rating || 0,
              month: m.label,
              date: d.date
            });
          });
        });
      });
    });
    ms.forEach(function (m) {
      return (m.log || []).forEach(function (x) {
        if (x && x.name) meals.push({
          name: x.name,
          rating: x.rating || 0,
          month: m.label,
          date: x.date || ''
        });
      });
    });
    var good = meals.filter(function (x) {
        return x.rating === 1;
      }),
      bad = meals.filter(function (x) {
        return x.rating === -1;
      });
    var html = '<div class="stats"><div class="stat"><b>' + meals.length + '</b><span>repas planifiés</span></div><div class="stat"><b>' + good.length + '</b><span>faits</span></div><div class="stat"><b>' + bad.length + '</b><span>pas envie</span></div></div>';
    html += '<div class="note hsec"><b>Pour le mois suivant</b> : demande à Claude « Prépare le planning du mois prochain à partir de mon carnet ». Il repart de cet historique pour proposer des plats nouveaux, tient compte des plats faits et écarte ceux marqués « pas envie ».</div>';
    html += '<section class="hsec"><h2 class="serif">Faits</h2>' + hl(good, 'Rien de noté pour l\'instant. Touche le cœur à côté d\'un plat du planning.') + '</section>';
    html += '<section class="hsec"><h2 class="serif">Pas envie</h2>' + hl(bad, 'Aucun plat écarté pour l\'instant.') + '</section>';
    html += '<section class="hsec"><h2 class="serif">Mois passés et en cours</h2>';
    ms.forEach(function (m) {
      var lab = function lab(x) {
        return !x ? '—' : x.off ? offShort(x.off).toLowerCase() : x.name;
      };
      var n = m.weeks.reduce(function (a, w) {
        return a + w.days.reduce(function (b, d) {
          return b + ['midi', 'soir'].filter(function (sl) {
            return d[sl] && d[sl].name && !d[sl].off;
          }).length;
        }, 0);
      }, 0);
      html += '<details class="month"' + (m.id === S.monthId ? ' open' : '') + '><summary>' + esc(m.label) + ' <small>· ' + n + ' repas · du ' + fmt(m.start) + ' au ' + fmt(m.end) + '</small></summary>';
      m.weeks.forEach(function (w) {
        html += '<div class="eyebrow" style="margin-top:10px">' + esc(w.label) + '</div><ol>';
        w.days.forEach(function (d) {
          html += '<li>' + esc(d.day) + ' : ' + esc(lab(d.midi)) + ' / ' + esc(lab(d.soir)) + '</li>';
        });
        html += '</ol>';
      });
      html += '</details>';
    });
    html += '</section>';
    var p = S.prefs;
    if (p) {
      html += '<section class="hsec"><h2 class="serif">Vos repères</h2>';
      if (p.avoid && p.avoid.length) html += '<div class="eyebrow">À éviter</div><div class="chips">' + p.avoid.map(function (a) {
        return '<span class="chip no">' + esc(a) + '</span>';
      }).join('') + '</div>';
      if (p.likes && p.likes.length) html += '<div class="eyebrow">Envies</div><div class="chips">' + p.likes.map(function (a) {
        return '<span class="chip yes">' + esc(a) + '</span>';
      }).join('') + '</div>';
      if (p.principles && p.principles.length) html += '<div class="eyebrow">Principes</div><ul class="principles">' + p.principles.map(function (a) {
        return '<li>' + esc(a) + '</li>';
      }).join('') + '</ul>';
      html += '</section>';
    }
    return html;
  }
  function hl(arr, empty) {
    if (!arr.length) return '<p class="empty">' + esc(empty) + '</p>';
    return '<ul class="hlist">' + arr.map(function (x) {
      return '<li><span>' + esc(x.name) + '</span><small>' + esc(x.month) + '</small></li>';
    }).join('') + '</ul>';
  }
  function fmtMin(t) {
    return t >= 60 ? Math.floor(t / 60) + ' h' + (t % 60 ? ' ' + String(t % 60).padStart(2, '0') : '') : t + ' min';
  }
  var DEV = {
    thermomix: 'Thermomix',
    airfryer: 'Airfryer'
  };
  function bestOf(r) {
    var b = r.devices && r.devices.best;
    return b && r.devices.variants && r.devices.variants[b] ? b : 'classique';
  }
  function methodTime(r, m) {
    var v = m && m !== 'classique' && r.devices && r.devices.variants && r.devices.variants[m];
    return v && v.time ? v.time : (r.prep || 0) + (r.cook || 0);
  }
  function totalTime(r) {
    return fmtMin(methodTime(r, bestOf(r)));
  }
  function devTag(r) {
    var b = bestOf(r);
    return b === 'classique' ? '' : '<span class="dtag d-' + b + '">' + ICON_DEV[b] + DEV[b] + '</span>';
  }
  function plannedFor(id) {
    var out = [];
    monthsSorted().forEach(function (m) {
      return m.weeks.forEach(function (w) {
        return w.days.forEach(function (d) {
          return ['midi', 'soir'].forEach(function (sl) {
            var x = d[sl];
            if (x && x.recipeId === id && !x.leftover && !x.off) out.push({
              date: d.date,
              day: d.day,
              slot: sl
            });
          });
        });
      });
    });
    return out;
  }
  function norm(s) {
    return String(s || '').toLowerCase().replace(/\u0153/g, 'oe').normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function verdicts() {
    var v = {};
    monthsSorted().forEach(function (m) {
      return m.weeks.forEach(function (w) {
        return w.days.forEach(function (d) {
          return ['midi', 'soir'].forEach(function (sl) {
            var x = d[sl];
            if (!x || !x.recipeId || !x.rating) return;
            if (x.rating === 1) v[x.recipeId] = 1;else if (v[x.recipeId] !== 1) v[x.recipeId] = -1;
          });
        });
      });
    });
    return v;
  }
  function recipeMatches(r) {
    if (S.fav) {
      var v = S._verdicts || {};
      if (S.fav === 'good' ? v[r.id] !== 1 : v[r.id] !== -1) return false;
    }
    if (S.cuisine && r.cuisine !== S.cuisine) return false;
    if (S.dev && !(r.devices && r.devices.variants && r.devices.variants[S.dev])) return false;
    if (!S.q) return true;
    var q = norm(S.q);
    return norm(r.title).includes(q) || (r.ingredients || []).some(function (i) {
      return norm(i.item).includes(q);
    });
  }
  function recipeCards() {
    S._verdicts = verdicts();
    var all = Object.entries(S.recipes).map(function (_ref5) {
      var _ref6 = _slicedToArray(_ref5, 2),
        id = _ref6[0],
        r = _ref6[1];
      return Object.assign({
        id: id
      }, r);
    });
    var withDate = all.map(function (r) {
      var p = plannedFor(r.id);
      return Object.assign(r, {
        next: p.find(function (x) {
          return x.date >= TODAY;
        }) || p[p.length - 1] || null
      });
    });
    var list = withDate.filter(recipeMatches).sort(function (a, b) {
      var ad = a.next ? a.next.date : '9999',
        bd = b.next ? b.next.date : '9999';
      var au = ad >= TODAY ? 0 : 1,
        bu = bd >= TODAY ? 0 : 1;
      return au - bu || ad.localeCompare(bd) || a.title.localeCompare(b.title);
    });
    if (!list.length) return '<p class="empty">Aucune recette ne correspond. Essaie un autre mot, comme « poulet » ou « tajine ».</p>';
    return list.map(function (r) {
      return '<button class="rcard" data-act="recipe" data-id="' + esc(r.id) + '"><span class="rtitle">' + esc(r.title) + '</span><span class="rmeta"><span class="tag c-' + esc(norm(r.cuisine).replace(/[^a-z]/g, '')) + '">' + esc(r.cuisine) + '</span>' + devTag(r) + totalTime(r) + ' · ' + esc(r.difficulty) + (r.next ? ' · ' + (r.next.date >= TODAY ? 'prévu ' : 'fait ') + esc(r.next.day.toLowerCase()) + ' ' + fmt(r.next.date) : '') + '</span></button>';
    }).join('');
  }
  function renderRecipes() {
    var n = Object.keys(S.recipes).length;
    if (!n) return '<p class="empty">Pas encore de recettes. Demande à Claude de les ajouter.</p>';
    var cuisines = _toConsumableArray(new Set(Object.values(S.recipes).map(function (r) {
      return r.cuisine;
    }))).sort();
    var html = '<div class="rsearch"><input type="text" id="recipe-q" placeholder="Chercher un plat ou un ingrédient" aria-label="Chercher une recette" value="' + esc(S.q) + '"></div>';
    html += '<div class="chips-row" role="group" aria-label="Cuisine"><button class="mchip" data-act="cuisine" data-id="" aria-pressed="' + !S.cuisine + '">Toutes · ' + n + '</button>' + cuisines.map(function (c) {
      return '<button class="mchip" data-act="cuisine" data-id="' + esc(c) + '" aria-pressed="' + (S.cuisine === c) + '">' + esc(c) + '</button>';
    }).join('') + '</div>';
    html += '<div class="chips-row dev-row" role="group" aria-label="Filtres"><span class="eyebrow">Faisable au</span>' + ['thermomix', 'airfryer'].map(function (d) {
      return '<button class="mchip" data-act="dev" data-id="' + d + '" aria-pressed="' + (S.dev === d) + '">' + ICON_DEV[d] + DEV[d] + '</button>';
    }).join('') + '<span class="eyebrow" style="margin-left:8px">Déjà fait</span><button class="mchip" data-act="fav" data-id="good" aria-pressed="' + (S.fav === 'good') + '">' + ICON_UP + 'Aimés</button><button class="mchip" data-act="fav" data-id="bad" aria-pressed="' + (S.fav === 'bad') + '">' + ICON_DOWN + 'Écartés</button></div>';
    html += '<div id="rlist" class="rlist">' + recipeCards() + '</div>';
    return html;
  }
  function renderRecipe(id) {
    var r = S.recipes[id];
    var p = plannedFor(id);
    var vars = r.devices && r.devices.variants || {};
    S.method = S.method || {};
    var meth = S.method[id] || bestOf(r);
    if (meth !== 'classique' && !vars[meth]) meth = 'classique';
    var v = meth === 'classique' ? null : vars[meth];
    var steps = v ? v.steps : r.steps || [];
    var html = '<button class="back" data-act="back">' + ICON_BACK + (S.from === 'plan' ? 'Retour au planning' : 'Toutes les recettes') + '</button>';
    html += '<article class="recipe"><span class="eyebrow">' + esc(r.cuisine) + ' · ' + esc(r.moment) + '</span><h2 class="serif rh">' + esc(r.title) + '</h2>';
    var opts = ['classique'].concat(['thermomix', 'airfryer'].filter(function (d) {
      return vars[d];
    }));
    if (opts.length > 1) {
      var lab = function lab(d) {
        return d === 'classique' ? esc(r.devices && r.devices.classicLabel || 'Classique') : ICON_DEV[d] + DEV[d];
      };
      html += '<div class="methods" role="tablist" aria-label="Méthode">' + opts.map(function (d) {
        return '<button class="meth' + (d === meth ? ' on' : '') + '" role="tab" aria-selected="' + (d === meth) + '" data-act="meth" data-id="' + esc(id) + '" data-m="' + d + '">' + lab(d) + (d === bestOf(r) ? '<small>conseillé</small>' : '') + '</button>';
      }).join('') + '</div>';
    }
    html += '<button class="btn primary cookbtn" data-act="cook" data-id="' + esc(id) + '">' + ICON_PLAY + 'Mode cuisine</button>';
    html += '<dl class="facts"><div><dt>Portions</dt><dd>' + esc(r.servings) + '</dd></div>' + (v ? '<div><dt>Temps total</dt><dd>' + fmtMin(methodTime(r, meth)) + '</dd></div><div><dt>Méthode</dt><dd>' + DEV[meth] + '</dd></div>' : '<div><dt>Préparation</dt><dd>' + esc(r.prep) + ' min</dd></div><div><dt>Cuisson</dt><dd>' + (r.cook ? esc(r.cook) + ' min' : 'aucune') + '</dd></div>') + '<div><dt>Niveau</dt><dd>' + esc(r.difficulty) + '</dd></div></dl>';
    if (r.adapt && r.adapt.length) html += '<section class="adapt"><h3 class="serif">Pour cette fois</h3><ul>' + r.adapt.map(function (t) {
      return '<li>' + esc(t) + '</li>';
    }).join('') + '</ul></section>';
    if (p.length) html += '<p class="planned">Au planning : ' + p.map(function (x) {
      return esc(x.day.toLowerCase()) + ' ' + fmt(x.date) + ' ' + (x.slot === 'midi' ? 'midi' : 'soir');
    }).join(', ') + '</p>';
    html += '<div class="rgrid"><section><h3 class="serif">Ingrédients</h3>';
    var groups = [];
    (r.ingredients || []).forEach(function (i) {
      var g = i.group || '';
      var gr = groups.find(function (x) {
        return x.g === g;
      });
      if (!gr) {
        gr = {
          g: g,
          items: []
        };
        groups.push(gr);
      }
      gr.items.push(i);
    });
    groups.forEach(function (gr) {
      if (gr.g) html += '<div class="eyebrow ig">' + esc(gr.g) + '</div>';
      html += '<ul class="ing">' + gr.items.map(function (i) {
        return '<li><span class="qty">' + esc(i.qty) + '</span><span>' + esc(i.item) + '</span></li>';
      }).join('') + '</ul>';
    });
    html += '</section><section><h3 class="serif">Étapes</h3><ol class="steps">' + steps.map(function (s, k) {
      return '<li><button class="step' + (S.stepsDone && S.stepsDone[id + ':' + meth + ':' + k] ? ' done' : '') + '" data-act="step" data-id="' + esc(id + ':' + meth) + '" data-k="' + k + '"><span class="sn">' + (k + 1) + '</span><span>' + esc(s) + '</span></button></li>';
    }).join('') + '</ol>';
    html += '<p class="hint small">Touche une étape pour la barrer pendant que tu cuisines.</p></section></div>';
    var tips = (v && v.tips && v.tips.length ? v.tips : []).concat(r.tips || []);
    if (tips.length) html += '<section class="tips"><h3 class="serif">Astuces</h3><ul>' + tips.map(function (t) {
      return '<li>' + esc(t) + '</li>';
    }).join('') + '</ul></section>';
    if (r.leftovers) html += '<section class="tips left"><h3 class="serif">Pour les restes</h3><p>' + esc(r.leftovers) + '</p></section>';
    html += '</article>';
    return html;
  }
  function openRecipe(id, from) {
    S.from = from || S.tab;
    S.tab = 'recettes';
    S.recipeId = id;
    store('tab', 'recettes');
    render();
    window.scrollTo({
      top: 0
    });
  }
  function listTexts() {
    var out = [];
    listsForMonth().forEach(function (l) {
      return l.sections.forEach(function (s) {
        return s.items.forEach(function (i) {
          return out.push(norm(i.text));
        });
      });
    });
    return out;
  }
  function ingStatus(i, texts) {
    if (i.home) return 'home';
    if (i.match && texts.some(function (t) {
      return t.includes(norm(i.match));
    })) return 'have';
    return 'missing';
  }
  function snackReady(s, texts) {
    return s.ingredients.every(function (i) {
      return i.optional || ingStatus(i, texts) !== 'missing';
    });
  }
  function renderSnacks() {
    var all = S.snacks || [];
    if (!all.length) return '<p class="empty">Pas encore d\'idées de collations. Demande à Claude d\'en ajouter.</p>';
    var texts = listTexts();
    var ready = all.filter(function (s) {
      return snackReady(s, texts);
    }).length;
    var html = '<div class="snack-sum"><span class="hand">' + ready + ' idées sur ' + all.length + '</span><span>faisables avec ce que tu as à la maison et ta liste de courses.</span></div>';
    var f = [['', 'Toutes'], ['Salé', 'Salé'], ['Sucré', 'Sucré'], ['ahead', 'À préparer le dimanche']];
    html += '<div class="chips-row" role="group" aria-label="Type">' + f.map(function (_ref7) {
      var _ref8 = _slicedToArray(_ref7, 2),
        v = _ref8[0],
        l = _ref8[1];
      return '<button class="mchip" data-act="stype" data-id="' + v + '" aria-pressed="' + (S.snackType === v) + '">' + l + '</button>';
    }).join('') + '<button class="mchip now" data-act="snow" aria-pressed="' + S.snackNow + '">Faisables maintenant</button></div>';
    var list = all.filter(function (s) {
      return (!S.snackType || (S.snackType === 'ahead' ? s.ahead : s.type === S.snackType)) && (!S.snackNow || snackReady(s, texts));
    }).sort(function (a, b) {
      return snackReady(b, texts) - snackReady(a, texts) || a.time - b.time;
    });
    if (!list.length) return html + '<p class="empty">Aucune idée pour ce filtre.</p>';
    html += '<div class="snacks">' + list.map(function (s) {
      var ok = snackReady(s, texts);
      var missing = s.ingredients.filter(function (i) {
        return !i.optional && ingStatus(i, texts) === 'missing' && i.buy;
      });
      var buys = _toConsumableArray(new Set(missing.map(function (i) {
        return i.buy;
      })));
      return '<article class="snack' + (ok ? ' ok' : '') + '"><div class="snack-head"><h3 class="display">' + esc(s.title) + '</h3><span class="tag ' + (s.type === 'Sucré' ? 't-sweet' : 't-salt') + '">' + esc(s.type) + '</span></div>' + '<div class="snack-meta">' + esc(s.time) + ' min' + (s.ahead ? ' · à préparer à l\'avance' : '') + ' · ' + (ok ? '<b class="okc">prête avec tes courses</b>' : '<b class="noc">il manque ' + missing.length + ' ingrédient' + (missing.length > 1 ? 's' : '') + '</b>') + '</div>' + '<ul class="sing">' + s.ingredients.map(function (i) {
        var st = ingStatus(i, texts);
        return '<li class="' + st + '"><span class="dot" aria-hidden="true"></span><span>' + esc(i.name) + (i.optional ? ' <em>(facultatif)</em>' : '') + '</span><small>' + (st === 'have' ? 'sur ta liste' : st === 'home' ? 'à la maison' : 'à acheter') + '</small></li>';
      }).join('') + '</ul>' + '<ol class="ssteps">' + s.steps.map(function (t) {
        return '<li>' + esc(t) + '</li>';
      }).join('') + '</ol>' + (s.tip ? '<p class="stip">' + esc(s.tip) + '</p>' : '') + (buys.length && !S.readOnly && pickList() ? '<button class="btn primary sm" data-act="snackbuy" data-id="' + esc(s.id) + '">Ajouter ' + (buys.length > 1 ? 'les ' + buys.length + ' ingrédients' : 'l\'ingrédient') + ' à la liste</button>' : '') + '</article>';
    }).join('') + '</div>';
    return html;
  }
  function addSnackToList(id) {
    var s = (S.snacks || []).find(function (x) {
      return x.id === id;
    });
    var l = pickList();
    if (!s || !l) return;
    var texts = listTexts();
    var buys = _toConsumableArray(new Set(s.ingredients.filter(function (i) {
      return !i.optional && ingStatus(i, texts) === 'missing' && i.buy;
    }).map(function (i) {
      return i.buy;
    })));
    if (!buys.length) return;
    var sections = clone(l.sections);
    var sec = sections.find(function (x) {
      return x.title === 'Collations';
    });
    if (!sec) {
      sec = {
        title: 'Collations',
        sub: 'ajouté depuis l\'onglet Collations',
        items: []
      };
      sections.push(sec);
    }
    var have = new Set(sections.flatMap(function (x) {
      return x.items.map(function (i) {
        return norm(i.text);
      });
    }));
    buys.forEach(function (b) {
      if (!have.has(norm(b))) sec.items.push({
        id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text: b,
        done: false,
        added: true
      });
    });
    l.sections = sections;
    queue('courses/' + S.listId, {
      sections: sections
    });
    render();
    toast(buys.length > 1 ? buys.length + ' ingrédients ajoutés à la liste' : 'Ajouté à la liste');
  }
  function findDay(m, date) {
    if (!m) return null;
    for (var wi = 0; wi < m.weeks.length; wi++) {
      var ds = m.weeks[wi].days;
      for (var di = 0; di < ds.length; di++) if (ds[di].date === date) return {
        wi: wi,
        di: di,
        d: ds[di]
      };
    }
    return null;
  }
  function thawNote(r) {
    if (!r) return '';
    var first = r.steps && r.steps[0] || '';
    if (/^la veille/i.test(first)) return first;
    var frozen = (r.ingredients || []).filter(function (i) {
      return /congel|cong[ée]lateur|surgel/i.test(i.item || '');
    });
    if (frozen.length) return 'Sors du congélateur et mets au frigo : ' + frozen.map(function (i) {
      return (i.qty ? i.qty + ' ' : '') + i.item.replace(/\s*\(.*?\)\s*/g, ' ').trim();
    }).join(', ') + '.';
    return '';
  }
  function bigMeal(f, slot) {
    var x = f.d[slot] || {};
    var key = 'data-w="' + f.wi + '" data-d="' + f.di + '" data-slot="' + slot + '"';
    var label = slot === 'midi' ? 'Midi' : 'Soir';
    if (x.off) return '<article class="bigmeal off"><span class="mlabel ' + slot + '">' + label + '</span><p class="bm-name">' + offLong(x.off) + '</p></article>';
    var r = x.recipeId && S.recipes[x.recipeId];
    var html = '<article class="bigmeal' + (x.rating === 1 ? ' done' : x.rating === -1 ? ' nope' : '') + '"><span class="mlabel ' + slot + '">' + label + '</span>';
    html += r ? '<button class="bm-name link" data-act="recipe" data-id="' + esc(x.recipeId) + '">' + esc(x.name || r.title) + '</button>' : '<p class="bm-name">' + esc(x.name || '—') + '</p>';
    if (r) html += '<p class="bm-meta">' + totalTime(r) + (bestOf(r) !== 'classique' ? ' · ' + DEV[bestOf(r)] : '') + (x.leftover ? ' · restes à réchauffer' : '') + '</p>';
    html += '<div class="bm-actions">';
    if (r && !x.leftover) html += '<button class="btn primary" data-act="cook" data-id="' + esc(x.recipeId) + '">' + ICON_PLAY + 'Cuisiner</button>';
    if (!S.readOnly) html += '<button class="btn' + (x.rating === 1 ? ' on-good' : '') + '" data-act="rate" data-v="1" ' + key + ' aria-pressed="' + (x.rating === 1) + '">' + ICON_UP + 'Fait</button><button class="btn' + (x.rating === -1 ? ' on-bad' : '') + '" data-act="rate" data-v="-1" ' + key + ' aria-pressed="' + (x.rating === -1) + '">' + ICON_DOWN + 'Pas envie</button>';
    html += '</div></article>';
    return html;
  }
  function renderToday(m) {
    if (!m) return '<p class="empty">Aucun planning pour l\'instant. Demande à Claude de préparer le mois.</p>';
    var html = '';
    var t = findDay(m, TODAY);
    if (t) {
      html += '<section class="tsec"><h2 class="display th">Aujourd\'hui <small>' + esc(t.d.day.toLowerCase()) + ' ' + fmt(t.d.date) + '</small></h2><div class="bigmeals">' + bigMeal(t, 'midi') + bigMeal(t, 'soir') + '</div></section>';
    }
    var tm = findDay(m, TOMORROW_G);
    if (tm) {
      var thaws = ['midi', 'soir'].map(function (sl) {
        var x = tm.d[sl] || {};
        var r = x.recipeId && S.recipes[x.recipeId];
        var n = !x.off && !x.leftover ? thawNote(r) : '';
        return n ? {
          sl: sl,
          x: x,
          n: n
        } : null;
      }).filter(Boolean);
      if (thaws.length) html += '<section class="thaw"><h3 class="serif">' + ICON_SNOW + 'À faire ce soir pour demain</h3><ul>' + thaws.map(function (o) {
        return '<li><b>' + esc(o.x.name) + '</b> (demain ' + o.sl + ') : ' + esc(o.n.replace(/^la veille( au soir)?,?\s*/i, '')) + '</li>';
      }).join('') + '</ul></section>';
      var lab = function lab(x) {
        return !x ? '—' : x.off ? offShort(x.off) : x.name;
      };
      html += '<section class="tomorrow"><div class="eyebrow">Demain · ' + esc(tm.d.day.toLowerCase()) + ' ' + fmt(tm.d.date) + '</div><div class="tc-row"><span class="slot midi">Midi</span><span>' + esc(lab(tm.d.midi)) + '</span></div><div class="tc-row"><span class="slot soir">Soir</span><span>' + esc(lab(tm.d.soir)) + '</span></div></section>';
    }
    var late = [];
    m.weeks.forEach(function (w, wi) {
      return w.days.forEach(function (d, di) {
        if (d.date >= TODAY || d.date < m.start) return;
        ['midi', 'soir'].forEach(function (sl) {
          var x = d[sl] || {};
          if (!x.off && x.name && !x.rating && !x.skipped) late.push({
            wi: wi,
            di: di,
            sl: sl,
            d: d,
            x: x
          });
        });
      });
    });
    if (late.length && !S.readOnly) {
      var show = late.slice(-8).reverse();
      html += '<section class="catchup"><h3 class="serif">Repas passés à cocher <span class="count">' + late.length + '</span></h3><p class="hint small">Dis-moi ce qui s\'est vraiment passé : ça garde le frigo et le planning justes.</p><ul>' + show.map(function (o) {
        var key = 'data-w="' + o.wi + '" data-d="' + o.di + '" data-slot="' + o.sl + '"';
        return '<li><div><b>' + esc(o.x.name) + '</b><small>' + esc(o.d.day.toLowerCase()) + ' ' + fmt(o.d.date) + ' · ' + o.sl + '</small></div><div class="cu-btns"><button class="btn sm" data-act="rate" data-v="1" ' + key + '>Fait</button><button class="btn sm" data-act="skip" ' + key + '>Pas fait</button><button class="btn sm" data-act="rate" data-v="-1" ' + key + '>Pas envie</button></div></li>';
      }).join('') + '</ul></section>';
    }
    return html;
  }
  var STOCK_SECTIONS = [['fresh', 'Frigo', 'Légumes, fruits, frais'], ['freezer', 'Congélateur', 'Viandes, poissons, surgelés'], ['pantry', 'Placard', 'Féculents, conserves, épices']];
  var nkey = function nkey(x) {
    return norm(x).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  };
  function stockBadge(k, x) {
    var meta = S.stock && S.stock.meta || {};
    var m = meta[nkey(x)];
    if (!m) return '';
    if (m.level === 'peu') return '<span class="badge low">reste peu</span>';
    if (k === 'fresh' && m.added && daysSince(m.added) >= 5) return '<span class="badge urg">à utiliser vite</span>';
    if (m.added && daysSince(m.added) < 2) return '<span class="badge new">nouveau</span>';
    return '';
  }
  function lastBilan() {
    var ids = Object.keys(S.bilans || {}).sort();
    return ids.length ? S.bilans[ids[ids.length - 1]] : null;
  }
  function renderFrigo() {
    if (S.bilan) return renderBilan();
    var st = S.stock || {};
    var lb = lastBilan();
    var html = '';
    if (!S.readOnly) {
      var since = lb ? daysSince(lb.date) : null;
      var due = !lb || since >= 13;
      html += '<div class="bilanline' + (due ? ' due' : '') + '"><span>' + (lb ? 'Dernier bilan le ' + fmt(lb.date) + (due ? ' · c\'est le moment d\'en refaire un' : '') : 'Toutes les 2 semaines, fais le point sur ce qu\'il te reste.') + '</span><span class="toolrow" style="margin:0"><button class="btn' + (due ? ' primary' : '') + ' sm" data-act="bilanstart">Faire le point</button>' + (S.sampleOk ? '<button class="btn sm" data-act="ideasopen" aria-expanded="' + !!S.ideasOpen + '">Idées anti-gaspi</button>' : '') + '</span></div>';
    }
    if (S.lastSaved) html += '<div class="note hsec"><b>Bilan enregistré.</b> Écris « bilan prêt » à Claude dans votre conversation : il le lit, te propose des plats pour finir ce qui reste, et met à jour le planning et les courses avec toi.</div>';
    if (S.ideasOpen) html += renderIdeas();
    html += '<p class="hint">Touche la croix quand un produit est fini, ajoute ce que tu achètes. Un badge rouge signale un produit frais rangé depuis 5 jours ou plus.</p><div class="frigo">';
    STOCK_SECTIONS.forEach(function (_ref9) {
      var _ref0 = _slicedToArray(_ref9, 3),
        k = _ref0[0],
        t = _ref0[1],
        sub = _ref0[2];
      var arr = st[k] || [];
      html += '<section class="fsec"><h2 class="serif">' + t + ' <small>' + arr.length + '</small></h2><p class="sub">' + sub + '</p><ul class="fitems">' + arr.map(function (x, i) {
        return '<li><span class="nm">' + esc(x) + stockBadge(k, x) + '</span>' + (S.readOnly ? '' : '<button class="fdel" data-act="stockdel" data-k="' + k + '" data-i="' + i + '" aria-label="Retirer ' + esc(x) + '">' + ICON_X + '</button>') + '</li>';
      }).join('') + (arr.length ? '' : '<li class="empty">Vide</li>') + '</ul>';
      if (!S.readOnly) html += '<form class="add stockadd" data-k="' + k + '"><input type="text" id="stock-' + k + '" placeholder="Ajouter (ex. 2 courgettes)" aria-label="Ajouter au ' + t.toLowerCase() + '"><button class="btn primary" type="submit">Ajouter</button></form>';
      html += '</section>';
    });
    html += '</div>';
    return html;
  }
  function renderBilan() {
    var st = S.stock || {},
      B = S.bilan;
    var total = 0,
      seen = 0;
    STOCK_SECTIONS.forEach(function (_ref1) {
      var _ref10 = _slicedToArray(_ref1, 1),
        k = _ref10[0];
      (st[k] || []).forEach(function (x, i) {
        total++;
        if (B.st[k + ':' + i]) seen++;
      });
    });
    var html = '<div class="bl-head"><h2 class="serif">Faire le point</h2><span class="hint" style="margin:0">' + seen + ' / ' + total + ' vérifiés</span></div>';
    html += '<p class="hint">Pour chaque produit, dis ce qu\'il en reste. Ajoute ce qui manque en bas de chaque rubrique. Les produits « fini » sortent du frigo quand tu enregistres.</p><div class="frigo bl">';
    var LAB = {
      ok: 'Il en reste',
      peu: 'Un peu',
      fini: 'Fini'
    };
    STOCK_SECTIONS.forEach(function (_ref11) {
      var _ref12 = _slicedToArray(_ref11, 2),
        k = _ref12[0],
        t = _ref12[1];
      var arr = st[k] || [];
      html += '<section class="fsec"><h2 class="serif">' + t + '</h2>';
      arr.forEach(function (x, i) {
        var v = B.st[k + ':' + i] || '';
        html += '<div class="bl-row"><span class="nm">' + esc(x) + stockBadge(k, x) + '</span><span class="seg" role="group" aria-label="' + esc(x) + '">' + ['ok', 'peu', 'fini'].map(function (o) {
          return '<button class="' + o + '" data-act="bset" data-k="' + k + '" data-i="' + i + '" data-v="' + o + '" aria-pressed="' + (v === o) + '">' + LAB[o] + '</button>';
        }).join('') + '</span></div>';
      });
      if (!arr.length) html += '<p class="empty">Vide</p>';
      html += '<form class="add stockadd" data-k="' + k + '"><input type="text" id="stock-' + k + '" placeholder="Ajouter un produit" aria-label="Ajouter au ' + t.toLowerCase() + '"><button class="btn" type="submit">Ajouter</button></form></section>';
    });
    html += '</div><div class="bl-foot"><label for="bilan-note"><b>Un mot pour Claude</b> <span class="hint small" style="margin:0">(facultatif) : envies, plats à refaire ou à éviter, semaines chargées, invités…</span></label><textarea id="bilan-note" placeholder="Ex. On a adoré le curry, pas de poisson cette semaine, on reçoit le samedi 12">' + esc(B.note || '') + '</textarea>';
    html += '<div class="row"><button class="btn primary" data-act="bilansave">Enregistrer le bilan</button><button class="btn" data-act="bilancancel">Annuler</button>' + (seen < total ? '<span class="hint small" style="margin:0">Les produits non vérifiés sont gardés tels quels.</span>' : '') + '</div></div>';
    return html;
  }
  function saveBilan() {
    return _saveBilan.apply(this, arguments);
  }
  function _saveBilan() {
    _saveBilan = _asyncToGenerator(_regenerator().m(function _callee2() {
      var st, B, meta, res, next, meals, doc, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            st = S.stock || {}, B = S.bilan;
            meta = Object.assign({}, st.meta || {});
            res = {
              ok: [],
              peu: [],
              fini: [],
              nonverifie: []
            };
            next = {};
            STOCK_SECTIONS.forEach(function (_ref13) {
              var _ref14 = _slicedToArray(_ref13, 2),
                k = _ref14[0],
                t = _ref14[1];
              next[k] = [];
              (st[k] || []).forEach(function (x, i) {
                var v = B.st[k + ':' + i];
                var key = nkey(x);
                if (v === 'fini') {
                  res.fini.push(t + ' : ' + x);
                  delete meta[key];
                  return;
                }
                next[k].push(x);
                if (v === 'peu') {
                  res.peu.push(t + ' : ' + x);
                  meta[key] = Object.assign({}, meta[key], {
                    level: 'peu'
                  });
                } else {
                  if (v === 'ok') res.ok.push(t + ' : ' + x);else res.nonverifie.push(t + ' : ' + x);
                  if (meta[key] && meta[key].level) {
                    meta[key] = Object.assign({}, meta[key]);
                    delete meta[key].level;
                  }
                }
              });
            });
            meals = {
              faits: [],
              pasEnvie: [],
              pasFaits: []
            };
            monthsSorted().forEach(function (m) {
              return m.weeks.forEach(function (w) {
                return w.days.forEach(function (d) {
                  if (d.date > TODAY || daysSince(d.date) > 15) return;
                  ['midi', 'soir'].forEach(function (sl) {
                    var x = d[sl];
                    if (!x || x.off || !x.name) return;
                    var lab = x.name + ' (' + d.date + ' ' + sl + ')';
                    if (x.rating === 1) meals.faits.push(lab);else if (x.rating === -1) meals.pasEnvie.push(lab);else if (x.skipped) meals.pasFaits.push(lab);
                  });
                });
              });
            });
            doc = {
              date: TODAY,
              stock: res,
              note: (B.note || '').trim(),
              repas: meals,
              traite: false
            };
            S.stock = Object.assign({}, st, next, {
              meta: meta
            });
            queue('settings/stock', Object.assign({}, next, {
              meta: meta
            }));
            _context2.p = 1;
            _context2.n = 2;
            return db.doc('bilans/' + TODAY).set(doc);
          case 2:
            S.bilans = Object.assign({}, S.bilans);
            S.bilans[TODAY] = doc;
            S.bilan = null;
            S.lastSaved = true;
            render();
            window.scrollTo({
              top: 0
            });
            toast('Bilan enregistré');
            _context2.n = 4;
            break;
          case 3:
            _context2.p = 3;
            _t2 = _context2.v;
            toast("Le bilan n'a pas pu être enregistré. Réessaie dans un instant.");
          case 4:
            return _context2.a(2);
        }
      }, _callee2, null, [[1, 3]]);
    }));
    return _saveBilan.apply(this, arguments);
  }
  var STOP = new Set(['frais', 'fraiche', 'fraiches', 'surgele', 'surgeles', 'surgelee', 'boite', 'boites', 'petit', 'petite', 'petits', 'grosse', 'grosses', 'gros', 'reste', 'restes', 'pour', 'avec', 'sachet', 'sachets', 'paquet', 'filet', 'filets', 'entier', 'entiers', 'tranche', 'tranches', 'demi', 'bouquet', 'botte', 'congelateur', 'maison', 'frite', 'frites']);
  function usedBy(r) {
    var st = S.stock || {};
    var ing = (r.ingredients || []).map(function (x) {
      return nkey(x.item);
    }).join(' | ');
    var out = [];
    ['fresh', 'freezer'].forEach(function (k) {
      return (st[k] || []).forEach(function (x) {
        var words = nkey(x).split(' ').filter(function (w) {
          return w.length >= 4 && !STOP.has(w) && !/^\d/.test(w);
        });
        if (words.some(function (w) {
          return ing.indexOf(w.replace(/s$/, '')) >= 0;
        })) out.push({
          k: k,
          name: x,
          on: true
        });
      });
    });
    return out;
  }
  function renderUsed() {
    var U = S.used;
    return '<div class="used" role="status"><b>« ' + esc(U.title) + ' » a utilisé quelque chose du frigo ?</b><div class="chips">' + U.items.map(function (x, j) {
      return '<button class="chip toggle" data-act="usedtog" data-j="' + j + '" aria-pressed="' + x.on + '">' + esc(x.name) + '</button>';
    }).join('') + '</div><div class="row"><button class="btn primary" data-act="usedok">Retirer la sélection du frigo</button><button class="btn" data-act="usedno">Rien à retirer</button></div></div>';
  }
  function renderIdeas() {
    if (!S.sampleOk || S.readOnly) return '';
    var I = S.ideas || {};
    var html = '<section class="ideas"><h2 class="serif">Qu\'est-ce que je fais avec… ?</h2><p>Dis ce qu\'il faut finir, ou laisse vide pour partir de tout ton frigo. Claude propose 3 plats qui respectent vos goûts.</p>';
    html += '<form class="ideaform"><input type="text" id="idea-q" placeholder="Ex. 2 courgettes, de la feta et des œufs" value="' + esc(I.q || '') + '" aria-label="Ce qu\'il faut finir"><button class="btn primary" type="submit"' + (I.busy ? ' disabled' : '') + '>Trouver des idées</button>' + (I.busy ? '<button class="btn" type="button" data-act="ideastop">Arrêter</button>' : '') + '</form>';
    if (I.busy) html += '<span class="thinking">Claude réfléchit…</span>';
    if (I.err) html += '<p class="empty">' + esc(I.err) + '</p>';
    if (I.list && I.list.length) {
      html += '<div class="idea-list">' + I.list.map(function (x, j) {
        return '<article class="idea"><h3>' + esc(x.titre) + '</h3><div class="hint small" style="margin:0">' + esc([x.moment, x.temps ? x.temps + ' min' : ''].filter(Boolean).join(' · ')) + '</div><div class="why">' + esc(x.pourquoi || '') + '</div>' + (x.utilise && x.utilise.length ? '<div class="uses">Finit : ' + esc(x.utilise.join(', ')) + '</div>' : '') + '<details><summary>Voir la recette</summary><ul>' + (x.ingredients || []).map(function (i) {
          return '<li>' + esc(i) + '</li>';
        }).join('') + '</ul><ol>' + (x.etapes || []).map(function (i) {
          return '<li>' + esc(i) + '</li>';
        }).join('') + '</ol></details>' + (x.saved ? '<span class="uses">Enregistrée dans tes recettes</span>' : '<button class="btn sm" data-act="ideasave" data-j="' + j + '">Garder cette recette</button>') + '</article>';
      }).join('') + '</div>';
    }
    return html + '</section>';
  }
  var ideaCtl = null;
  function askIdeas(_x2) {
    return _askIdeas.apply(this, arguments);
  }
  function _askIdeas() {
    _askIdeas = _asyncToGenerator(_regenerator().m(function _callee3(q) {
      var st, p, prompt, list, c, _t3;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            if (S.sample) {
              _context3.n = 1;
              break;
            }
            return _context3.a(2);
          case 1:
            S.ideas = {
              q: q,
              busy: true,
              list: S.ideas && S.ideas.list || []
            };
            render();
            st = S.stock || {}, p = S.prefs || {};
            prompt = ['Tu aides un couple (2 personnes) à cuisiner ce qu\'il a déjà chez lui pour éviter le gaspillage. Cuisine anti-inflammatoire, simple et gourmande.', 'À éviter absolument : ' + (p.avoid || []).join(' ; ') + '.', 'Ils aiment : ' + (p.likes || []).join(' ; ') + '.', 'Équipement : ' + (p.equipment || []).join(', ') + '.', 'Frigo : ' + (st.fresh || []).join(', ') + '.', 'Congélateur : ' + (st.freezer || []).join(', ') + '.', 'Placard : ' + (st.pantry || []).join(', ') + '.', q ? 'À finir en priorité : ' + q + '.' : 'Priorité aux produits frais qui risquent de se perdre.', 'Propose exactement 3 plats différents, faisables surtout avec ce qu\'ils ont (au plus 2 achats simples par plat). Réponds uniquement avec un tableau JSON de 3 objets : {"titre": string, "moment": "Midi rapide" | "Dîner" | "Week-end", "temps": nombre de minutes, "pourquoi": une phrase, "utilise": [produits de chez eux utilisés], "ingredients": ["quantité + ingrédient", ...] pour 2 personnes, "etapes": [4 à 7 étapes courtes et précises, en tutoyant]}. En français.'].join('\n');
            ideaCtl = new AbortController();
            _context3.p = 2;
            _context3.n = 3;
            return S.sample.json(prompt, {
              signal: ideaCtl.signal,
              cache: false
            });
          case 3:
            list = _context3.v;
            S.ideas = {
              q: q,
              list: Array.isArray(list) ? list.filter(function (x) {
                return x && x.titre;
              }).slice(0, 3) : []
            };
            if (!S.ideas.list.length) S.ideas.err = 'Pas d\'idée exploitable cette fois. Réessaie en précisant un peu.';
            _context3.n = 5;
            break;
          case 4:
            _context3.p = 4;
            _t3 = _context3.v;
            c = _t3 && _t3.code;
            if (c === 'cancelled') S.ideas = {
              q: q
            };else if (c === 'not_granted' || c === 'sampling_disabled' || c === 'not_declared' || c === 'capability_disabled' || c === 'capability_removed') {
              S.sampleOk = false;
              S.ideas = null;
            } else S.ideas = {
              q: q,
              err: c === 'rate_limited' ? 'Trop de demandes pour le moment. Réessaie dans quelques minutes.' : 'Claude n\'a pas pu répondre. Réessaie dans un instant.'
            };
          case 5:
            ideaCtl = null;
            render();
          case 6:
            return _context3.a(2);
        }
      }, _callee3, null, [[2, 4]]);
    }));
    return _askIdeas.apply(this, arguments);
  }
  function slug(t) {
    return nkey(t).replace(/ /g, '-').slice(0, 60) || 'idee-' + Date.now();
  }
  function saveIdea(_x3) {
    return _saveIdea.apply(this, arguments);
  }
  function _saveIdea() {
    _saveIdea = _asyncToGenerator(_regenerator().m(function _callee4(j) {
      var x, id, doc, _t4;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            x = S.ideas && S.ideas.list && S.ideas.list[j];
            if (x) {
              _context4.n = 1;
              break;
            }
            return _context4.a(2);
          case 1:
            id = 'idee-' + slug(x.titre);
            doc = {
              title: String(x.titre),
              cuisine: 'Du frigo',
              moment: String(x.moment || 'Dîner'),
              difficulty: 'Facile',
              prep: Math.max(5, Math.round((+x.temps || 30) / 3)),
              cook: Math.max(0, Math.round((+x.temps || 30) * 2 / 3)),
              servings: 2,
              devices: {
                best: 'classique',
                classicLabel: 'Cuisine'
              },
              ingredients: (x.ingredients || []).map(function (i) {
                return {
                  group: 'Ingrédients',
                  qty: '',
                  item: String(i)
                };
              }),
              steps: (x.etapes || []).map(String),
              tips: x.pourquoi ? [String(x.pourquoi)] : []
            };
            _context4.p = 2;
            _context4.n = 3;
            return db.doc('recipes/' + id).set(doc);
          case 3:
            x.saved = true;
            render();
            toast('Recette gardée dans l\'onglet Recettes');
            _context4.n = 5;
            break;
          case 4:
            _context4.p = 4;
            _t4 = _context4.v;
            toast("La recette n'a pas pu être enregistrée.");
          case 5:
            return _context4.a(2);
        }
      }, _callee4, null, [[2, 4]]);
    }));
    return _saveIdea.apply(this, arguments);
  }
  function aisleOrder(sections) {
    var ord = S.prefs && S.prefs.aisleOrder || [];
    var idx = function idx(t) {
      var i = ord.indexOf(t);
      return i < 0 ? 999 : i;
    };
    return sections.map(function (s, i) {
      return i;
    }).sort(function (a, b) {
      return idx(sections[a].title) - idx(sections[b].title) || a - b;
    });
  }
  function guessSection(t) {
    var n = norm(t);
    if (/surgel|congel|poulet|dinde|boeuf|agneau|steak|hache|saumon|cabillaud|merlu|dorade|poisson|crevette|maquereau|encornet|calamar/.test(n)) return 'freezer';
    if (/boite|conserve|riz|pate|semoule|boulgour|quinoa|lentille|farine|chapelure|panko|epice|cumin|paprika|curcuma|huile|vinaigre|sauce|moutarde|miel|sucre|levure|noix|amande|cacahuete|nouille|tortilla|origan|thym|cannelle|harissa|capre|cornichon|olive|concentre|lait de coco|feuilles de brick|mayonnaise|sriracha/.test(n)) return 'pantry';
    return 'fresh';
  }
  function saveStock(k) {
    var o = {};
    o[k] = S.stock[k];
    queue('settings/stock', o);
  }
  function cookSteps(id) {
    var r = S.recipes[id];
    var vars = r.devices && r.devices.variants || {};
    var meth = S.method && S.method[id] || bestOf(r);
    if (meth !== 'classique' && !vars[meth]) meth = 'classique';
    var v = meth === 'classique' ? null : vars[meth];
    return {
      r: r,
      meth: meth,
      steps: v ? v.steps : r.steps || []
    };
  }
  function stepMinutes(s) {
    var m = s.match(/(\d+)\s*(?:à|-)\s*(\d+)\s*min/i) || s.match(/(\d+)\s*min/i);
    if (!m) return 0;
    return +(m[2] || m[1]);
  }
  function renderCook() {
    var _cookSteps = cookSteps(S.cook.id),
      r = _cookSteps.r,
      meth = _cookSteps.meth,
      steps = _cookSteps.steps;
    var i = Math.min(S.cook.i, steps.length - 1);
    var s = steps[i] || '';
    var mins = stepMinutes(s);
    var html = '<div class="cook"><header class="ck-top"><button class="btn" data-act="cookclose">' + ICON_X + 'Fermer</button><div class="ck-title"><span class="eyebrow">' + (meth === 'classique' ? 'Mode cuisine' : DEV[meth]) + '</span><b>' + esc(r.title) + '</b></div></header>';
    html += '<div class="ck-progress" aria-hidden="true">' + steps.map(function (_, k) {
      return '<span class="' + (k < i ? 'past' : k === i ? 'cur' : '') + '"></span>';
    }).join('') + '</div>';
    html += '<p class="ck-count">Étape ' + (i + 1) + ' sur ' + steps.length + '</p><p class="ck-step">' + esc(s) + '</p>';
    if (mins) html += '<button class="btn timerbtn" data-act="timer" data-min="' + mins + '" data-label="Étape ' + (i + 1) + '">' + ICON_PLAY + 'Lancer un minuteur de ' + mins + ' min</button>';
    if (S.timers.length) html += '<div class="ck-timers">' + S.timers.map(function (t) {
      return '<div class="tmr' + (t.done ? ' done' : '') + '" data-tid="' + t.id + '"><span>' + esc(t.label) + '</span><b class="tmr-v">' + fmtLeft(t) + '</b><button class="fdel" data-act="timerdel" data-id="' + t.id + '" aria-label="Arrêter">' + ICON_X + '</button></div>';
    }).join('') + '</div>';
    html += '<details class="ck-ing"><summary>Ingrédients</summary><ul>' + (r.ingredients || []).map(function (x) {
      return '<li><b>' + esc(x.qty || '') + '</b> ' + esc(x.item) + '</li>';
    }).join('') + '</ul></details>';
    html += '<nav class="ck-nav"><button class="btn big" data-act="cookprev"' + (i === 0 ? ' disabled' : '') + '>Précédent</button>' + (i < steps.length - 1 ? '<button class="btn primary big" data-act="cooknext">Suivant</button>' : '<button class="btn primary big" data-act="cookdone">Terminé</button>') + '</nav></div>';
    return html;
  }
  function fmtLeft(t) {
    if (t.done) return 'Terminé';
    var ms = Math.max(0, t.end - Date.now());
    var s = Math.ceil(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  var tick = null;
  function startTick() {
    if (tick) return;
    tick = setInterval(function () {
      var any = false;
      S.timers.forEach(function (t) {
        if (t.done) return;
        any = true;
        if (Date.now() >= t.end) {
          t.done = true;
          ring(t);
        }
        var el = document.querySelector('.tmr[data-tid="' + t.id + '"] .tmr-v');
        if (el) el.textContent = fmtLeft(t);
        if (t.done) {
          var box = document.querySelector('.tmr[data-tid="' + t.id + '"]');
          if (box) box.classList.add('done');
        }
      });
      if (!any) {
        clearInterval(tick);
        tick = null;
      }
    }, 500);
  }
  var actx = null;
  function ring(t) {
    toast('Minuteur terminé : ' + t.label);
    try {
      navigator.vibrate && navigator.vibrate([300, 150, 300]);
    } catch (e) {}
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35, 0.7].forEach(function (o) {
        var g = actx.createGain(),
          osc = actx.createOscillator();
        osc.frequency.value = 880;
        osc.connect(g);
        g.connect(actx.destination);
        g.gain.setValueAtTime(0.0001, actx.currentTime + o);
        g.gain.exponentialRampToValueAtTime(0.3, actx.currentTime + o + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + o + 0.3);
        osc.start(actx.currentTime + o);
        osc.stop(actx.currentTime + o + 0.32);
      });
    } catch (e) {}
  }
  var wake = null;
  function lockScreen() {
    return _lockScreen.apply(this, arguments);
  }
  function _lockScreen() {
    _lockScreen = _asyncToGenerator(_regenerator().m(function _callee5() {
      var _t5;
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.p = _context5.n) {
          case 0:
            _context5.p = 0;
            if (!('wakeLock' in navigator)) {
              _context5.n = 2;
              break;
            }
            _context5.n = 1;
            return navigator.wakeLock.request('screen');
          case 1:
            wake = _context5.v;
          case 2:
            _context5.n = 4;
            break;
          case 3:
            _context5.p = 3;
            _t5 = _context5.v;
            wake = null;
          case 4:
            return _context5.a(2);
        }
      }, _callee5, null, [[0, 3]]);
    }));
    return _lockScreen.apply(this, arguments);
  }
  function unlockScreen() {
    try {
      wake && wake.release();
    } catch (e) {}
    wake = null;
  }
  document.addEventListener('visibilitychange', function () {
    if (S.cook && document.visibilityState === 'visible') lockScreen();
  });
  function setMeal(wi, di, slot, patch) {
    var m = S.months[S.monthId];
    if (!m) return;
    var weeks = clone(m.weeks);
    weeks[wi].days[di][slot] = Object.assign({
      name: '',
      rating: 0
    }, weeks[wi].days[di][slot], patch);
    if (patch.off === null) delete weeks[wi].days[di][slot].off;
    if (patch.skipped === null) delete weeks[wi].days[di][slot].skipped;
    ['recipeId', 'leftover'].forEach(function (k) {
      if (patch[k] === null) delete weeks[wi].days[di][slot][k];
    });
    m.weeks = weeks;
    queue('months/' + S.monthId, {
      weeks: weeks
    });
  }
  function swapMeals(a, b) {
    S.swap = null;
    if (!a || !b || a.w === b.w && a.d === b.d && a.slot === b.slot) {
      render();
      return;
    }
    var m = S.months[S.monthId];
    if (!m) {
      render();
      return;
    }
    var weeks = clone(m.weeks);
    var A = weeks[a.w].days[a.d],
      B = weeks[b.w].days[b.d];
    var tmp = A[a.slot];
    A[a.slot] = B[b.slot];
    B[b.slot] = tmp;
    m.weeks = weeks;
    queue('months/' + S.monthId, {
      weeks: weeks
    });
    render();
    toast('Repas échangés : ' + B.day.toLowerCase() + ' ' + (b.slot === 'midi' ? 'midi' : 'soir') + ' ↔ ' + A.day.toLowerCase() + ' ' + (a.slot === 'midi' ? 'midi' : 'soir'));
  }
  function saveEdit(ta) {
    if (!S.editing) return;
    var _S$editing = S.editing,
      w = _S$editing.w,
      d = _S$editing.d,
      slot = _S$editing.slot;
    S.editing = null;
    var v = ta.value.trim();
    var cur = S.months[S.monthId].weeks[w].days[d][slot] || {};
    if (v && (v !== cur.name || cur.off)) setMeal(w, d, slot, {
      name: v,
      rating: 0,
      off: null,
      recipeId: null,
      leftover: null
    });
    S.dirty = false;
    render();
  }
  app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b || b.tagName === 'INPUT') return;
    var act = b.dataset.act;
    if (act === 'tab') {
      S.tab = b.dataset.id;
      S.recipeId = null;
      S.swap = null;
      S.menu = null;
      store('tab', S.tab);
      S.confirmReset = false;
      render();
      window.scrollTo({
        top: 0
      });
      return;
    }
    if (act === 'recipe') {
      openRecipe(b.dataset.id, S.tab === 'recettes' ? 'recettes' : S.tab);
      return;
    }
    if (act === 'back') {
      var f = S.from;
      S.recipeId = null;
      if (f && f !== 'recettes') {
        S.tab = f;
        store('tab', f);
      }
      render();
      window.scrollTo({
        top: 0
      });
      return;
    }
    if (act === 'cuisine') {
      S.cuisine = b.dataset.id;
      render();
      return;
    }
    if (act === 'fav') {
      S.fav = S.fav === b.dataset.id ? '' : b.dataset.id;
      render();
      return;
    }
    if (act === 'past') {
      S.showPast = !S.showPast;
      render();
      return;
    }
    if (act === 'ideasopen') {
      S.ideasOpen = !S.ideasOpen;
      render();
      return;
    }
    if (act === 'dev') {
      S.dev = S.dev === b.dataset.id ? '' : b.dataset.id;
      render();
      return;
    }
    if (act === 'meth') {
      S.method = S.method || {};
      S.method[b.dataset.id] = b.dataset.m;
      render();
      return;
    }
    if (act === 'stype') {
      S.snackType = b.dataset.id;
      render();
      return;
    }
    if (act === 'snow') {
      S.snackNow = !S.snackNow;
      render();
      return;
    }
    if (act === 'step') {
      S.stepsDone = S.stepsDone || {};
      var k = b.dataset.id + ':' + b.dataset.k;
      S.stepsDone[k] = !S.stepsDone[k];
      b.classList.toggle('done', S.stepsDone[k]);
      return;
    }
    if (act === 'month') {
      S.monthId = b.dataset.id;
      store('month', S.monthId);
      S.listId = null;
      render();
      return;
    }
    if (act === 'list') {
      S.listId = b.dataset.id;
      store('list', S.listId);
      S.confirmReset = false;
      render();
      return;
    }
    if (act === 'cook') {
      S.cook = {
        id: b.dataset.id,
        i: 0
      };
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
      lockScreen();
      render();
      window.scrollTo({
        top: 0
      });
      return;
    }
    if (act === 'cookclose' || act === 'cookdone') {
      S.cook = null;
      unlockScreen();
      render();
      if (act === 'cookdone') toast('Bon appétit !');
      return;
    }
    if (act === 'cooknext') {
      S.cook.i++;
      render();
      window.scrollTo({
        top: 0
      });
      return;
    }
    if (act === 'cookprev') {
      S.cook.i = Math.max(0, S.cook.i - 1);
      render();
      window.scrollTo({
        top: 0
      });
      return;
    }
    if (act === 'timer') {
      S.timers.push({
        id: 't' + Date.now(),
        label: b.dataset.label + ' · ' + S.recipes[S.cook.id].title,
        end: Date.now() + +b.dataset.min * 60000,
        done: false
      });
      startTick();
      render();
      return;
    }
    if (act === 'timerdel') {
      S.timers = S.timers.filter(function (t) {
        return t.id !== b.dataset.id;
      });
      render();
      return;
    }
    if (S.readOnly) return;
    if (act === 'menu') {
      var _k = {
        w: +b.dataset.w,
        d: +b.dataset.d,
        slot: b.dataset.slot
      };
      S.menu = S.menu && S.menu.w === _k.w && S.menu.d === _k.d && S.menu.slot === _k.slot ? null : _k;
      render();
      return;
    }
    if (act === 'swap') {
      S.swap = {
        w: +b.dataset.w,
        d: +b.dataset.d,
        slot: b.dataset.slot
      };
      S.menu = null;
      render();
      return;
    }
    if (act === 'swapcancel') {
      S.swap = null;
      render();
      return;
    }
    if (act === 'swapto') {
      swapMeals(S.swap, {
        w: +b.dataset.w,
        d: +b.dataset.d,
        slot: b.dataset.slot
      });
      return;
    }
    if (act === 'edit') {
      S.editing = {
        w: +b.dataset.w,
        d: +b.dataset.d,
        slot: b.dataset.slot
      };
      S.menu = null;
      render();
      return;
    }
    if (act === 'save') {
      var ta = document.getElementById('edit-meal');
      if (ta) saveEdit(ta);
      return;
    }
    if (act === 'cancel') {
      S.editing = null;
      S.dirty = false;
      render();
      return;
    }
    if (act === 'off') {
      var wi = +b.dataset.w,
        di = +b.dataset.d,
        slot = b.dataset.slot;
      S.editing = null;
      S.menu = null;
      S.dirty = false;
      setMeal(wi, di, slot, {
        name: '',
        rating: 0,
        off: b.dataset.v,
        recipeId: null,
        leftover: null
      });
      render();
      return;
    }
    if (act === 'rate') {
      var _wi = +b.dataset.w,
        _di = +b.dataset.d,
        _slot = b.dataset.slot,
        v = +b.dataset.v;
      var cur = S.months[S.monthId].weeks[_wi].days[_di][_slot];
      var was = cur && cur.rating;
      setMeal(_wi, _di, _slot, {
        rating: cur && cur.rating === v ? 0 : v,
        skipped: null
      });
      if (v === 1 && was !== 1 && cur && cur.recipeId && !cur.leftover && S.recipes[cur.recipeId]) {
        var items = usedBy(S.recipes[cur.recipeId]);
        S.used = items.length ? {
          title: cur.name || S.recipes[cur.recipeId].title,
          items: items
        } : null;
      }
      render();
      return;
    }
    if (act === 'snackbuy') {
      addSnackToList(b.dataset.id);
      return;
    }
    if (act === 'skip') {
      setMeal(+b.dataset.w, +b.dataset.d, b.dataset.slot, {
        skipped: true
      });
      render();
      toast('Noté : pas fait');
      return;
    }
    if (act === 'bilanstart') {
      S.bilan = {
        st: {},
        note: ''
      };
      S.lastSaved = false;
      render();
      window.scrollTo({
        top: 0
      });
      return;
    }
    if (act === 'bilancancel') {
      S.bilan = null;
      render();
      return;
    }
    if (act === 'bset') {
      var key = b.dataset.k + ':' + b.dataset.i;
      S.bilan.st[key] = S.bilan.st[key] === b.dataset.v ? '' : b.dataset.v;
      var y = window.scrollY;
      render();
      window.scrollTo(0, y);
      return;
    }
    if (act === 'bilansave') {
      b.disabled = true;
      saveBilan();
      return;
    }
    if (act === 'usedtog') {
      var x = S.used && S.used.items[+b.dataset.j];
      if (x) {
        x.on = !x.on;
        b.setAttribute('aria-pressed', String(x.on));
      }
      return;
    }
    if (act === 'usedno') {
      S.used = null;
      render();
      return;
    }
    if (act === 'usedok') {
      var U = S.used;
      S.used = null;
      if (!U) {
        render();
        return;
      }
      S.stock = Object.assign({}, S.stock);
      var meta = Object.assign({}, S.stock.meta || {});
      var touched = new Set();
      var n = 0;
      U.items.filter(function (x) {
        return x.on;
      }).forEach(function (x) {
        var arr = (S.stock[x.k] || []).slice();
        var i = arr.indexOf(x.name);
        if (i >= 0) {
          arr.splice(i, 1);
          S.stock[x.k] = arr;
          delete meta[nkey(x.name)];
          touched.add(x.k);
          n++;
        }
      });
      if (n) {
        var patch = {
          meta: meta
        };
        touched.forEach(function (k) {
          return patch[k] = S.stock[k];
        });
        S.stock.meta = meta;
        queue('settings/stock', patch);
      }
      render();
      toast(n ? n + ' produit' + (n > 1 ? 's' : '') + ' retiré' + (n > 1 ? 's' : '') + ' du frigo' : 'Rien de retiré');
      return;
    }
    if (act === 'ideastop') {
      if (ideaCtl) ideaCtl.abort();
      return;
    }
    if (act === 'ideasave') {
      b.disabled = true;
      saveIdea(+b.dataset.j);
      return;
    }
    if (act === 'aisleup') {
      var l = S.lists[S.listId];
      if (!l) return;
      var titles = aisleOrder(l.sections).map(function (i) {
        return l.sections[i].title;
      });
      var ord = (S.prefs && S.prefs.aisleOrder || []).slice();
      titles.forEach(function (t) {
        if (ord.indexOf(t) < 0) ord.push(t);
      });
      var t = b.dataset.t;
      var pos = titles.indexOf(t);
      if (pos <= 0) return;
      var prev = titles[pos - 1];
      var a = ord.indexOf(t),
        c = ord.indexOf(prev);
      ord[a] = prev;
      ord[c] = t;
      S.prefs = Object.assign({}, S.prefs, {
        aisleOrder: ord
      });
      queue('settings/prefs', {
        aisleOrder: ord
      });
      render();
      return;
    }
    if (act === 'stockdel') {
      var _k2 = b.dataset.k;
      S.stock = Object.assign({}, S.stock);
      S.stock[_k2] = (S.stock[_k2] || []).filter(function (_, i) {
        return i !== +b.dataset.i;
      });
      saveStock(_k2);
      render();
      return;
    }
    if (act === 'storeall') {
      var _l = S.lists[S.listId];
      if (!_l) return;
      S.stock = Object.assign({
        fresh: [],
        freezer: [],
        pantry: []
      }, S.stock);
      var sections = clone(_l.sections);
      var _touched = new Set();
      var _n = 0;
      sections.forEach(function (s) {
        return s.items.forEach(function (i) {
          if (i.done && !i.stored) {
            var name = i.text.replace(/\s*[·—].*$/, '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
            var _k3 = guessSection(name);
            S.stock[_k3] = (S.stock[_k3] || []).concat(name);
            _touched.add(_k3);
            i.stored = true;
            _n++;
          }
        });
      });
      {
        var _meta = Object.assign({}, S.stock.meta || {});
        sections.forEach(function (s) {
          return s.items.forEach(function (i) {
            if (i.stored && i.done) {
              var nm = i.text.replace(/\s*[·—].*$/, '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
              var _key = nkey(nm);
              if (!_meta[_key]) _meta[_key] = {
                added: TODAY
              };
            }
          });
        });
        S.stock.meta = _meta;
        queue('settings/stock', {
          meta: _meta
        });
      }
      _touched.forEach(saveStock);
      _l.sections = sections;
      queue('courses/' + S.listId, {
        sections: sections
      });
      render();
      toast(_n + ' article' + (_n > 1 ? 's' : '') + ' rangé' + (_n > 1 ? 's' : '') + ' dans le frigo');
      return;
    }
    if (act === 'askreset') {
      S.confirmReset = true;
      render();
      return;
    }
    if (act === 'cancelreset') {
      S.confirmReset = false;
      render();
      return;
    }
    if (act === 'reset') {
      var _l2 = S.lists[S.listId];
      var _sections = clone(_l2.sections);
      _sections.forEach(function (s) {
        return s.items.forEach(function (i) {
          return i.done = false;
        });
      });
      _l2.sections = _sections;
      S.confirmReset = false;
      queue('courses/' + S.listId, {
        sections: _sections
      });
      render();
      toast('Liste remise à zéro');
      return;
    }
    if (act === 'del') {
      var _l3 = S.lists[S.listId];
      var _sections2 = clone(_l3.sections);
      var s = _sections2[+b.dataset.s];
      s.items = s.items.filter(function (i) {
        return i.id !== b.dataset.i;
      });
      _l3.sections = _sections2;
      queue('courses/' + S.listId, {
        sections: _sections2
      });
      render();
      return;
    }
  });
  app.addEventListener('change', function (e) {
    var c = e.target;
    if (c.dataset.act !== 'check' || S.readOnly) return;
    var l = S.lists[S.listId];
    var sections = clone(l.sections);
    var it = sections[+c.dataset.s].items.find(function (i) {
      return i.id === c.dataset.i;
    });
    if (!it) return;
    it.done = c.checked;
    l.sections = sections;
    queue('courses/' + S.listId, {
      sections: sections
    });
    render();
  });
  app.addEventListener('submit', function (e) {
    var sf = e.target.closest('form.stockadd');
    if (sf) {
      e.preventDefault();
      var _inp = sf.querySelector('input');
      var _v = _inp.value.trim();
      if (!_v) return;
      var k = sf.dataset.k;
      S.stock = Object.assign({}, S.stock);
      S.stock[k] = (S.stock[k] || []).concat(_v);
      if (S.bilan) S.bilan.st[k + ':' + (S.stock[k].length - 1)] = 'ok';
      {
        var meta = Object.assign({}, S.stock.meta || {});
        meta[nkey(_v)] = {
          added: TODAY
        };
        S.stock.meta = meta;
        queue('settings/stock', {
          meta: meta
        });
      }
      saveStock(k);
      _inp.value = '';
      S.dirty = false;
      render();
      var _again = document.getElementById('stock-' + k);
      if (_again) _again.focus();
      return;
    }
    var fi = e.target.closest('form.ideaform');
    if (fi) {
      e.preventDefault();
      if (S.ideas && S.ideas.busy) return;
      var q = (document.getElementById('idea-q') || {}).value || '';
      S.dirty = false;
      document.activeElement && document.activeElement.blur && document.activeElement.blur();
      askIdeas(q.trim());
      return;
    }
    var f = e.target.closest('form.add');
    if (!f) return;
    e.preventDefault();
    var inp = f.querySelector('input');
    var v = inp.value.trim();
    if (!v) return;
    var l = S.lists[S.listId];
    var sections = clone(l.sections);
    sections[+f.dataset.s].items.push({
      id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: v,
      done: false,
      added: true
    });
    l.sections = sections;
    queue('courses/' + S.listId, {
      sections: sections
    });
    inp.value = '';
    S.dirty = false;
    render();
    var again = document.getElementById(inp.id);
    if (again) again.focus();
  });
  app.addEventListener('input', function (e) {
    if (e.target.id === 'bilan-note' && S.bilan) {
      S.bilan.note = e.target.value;
      return;
    }
    if (e.target.id === 'idea-q') {
      S.ideas = Object.assign({}, S.ideas, {
        q: e.target.value
      });
      return;
    }
    if (e.target.id !== 'recipe-q') return;
    S.q = e.target.value;
    var l = document.getElementById('rlist');
    if (l) l.innerHTML = recipeCards();
  });
  document.addEventListener('keydown', function (e) {
    if (!S.cook || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    var n = cookSteps(S.cook.id).steps.length;
    if (e.key === 'ArrowRight' && S.cook.i < n - 1) {
      S.cook.i++;
      render();
    }
    if (e.key === 'ArrowLeft' && S.cook.i > 0) {
      S.cook.i--;
      render();
    }
    if (e.key === 'Escape') {
      S.cook = null;
      unlockScreen();
      render();
    }
  });
  app.addEventListener('keydown', function (e) {
    if (e.target.id !== 'edit-meal') return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit(e.target);
    }
    if (e.key === 'Escape') {
      S.editing = null;
      S.dirty = false;
      render();
    }
  });
  function start() {
    var c = window.claude;
    if (!c || typeof c.use !== 'function') {
      S.status = 'unavailable';
      render();
      return;
    }
    c.use('db').then(function (d) {
      if (!d) {
        S.status = 'unavailable';
        render();
        return;
      }
      db = d;
      var got = 0;
      var ready = function ready() {
        if (++got >= 2 && S.status === 'loading') {
          S.status = 'ok';
          render();
        }
      };
      var onErr = function onErr() {
        if (S.status === 'loading') {
          S.status = 'unavailable';
          render();
        }
      };
      db.collection('months').onSnapshot(function (snap) {
        var next = {};
        snap.docs.forEach(function (doc) {
          var p = pending['months/' + doc.id];
          next[doc.id] = p && S.months[doc.id] ? S.months[doc.id] : clone(doc.data());
        });
        S.months = next;
        if (S.status === 'loading') ready();else requestRender();
      }, onErr);
      db.collection('courses').onSnapshot(function (snap) {
        var next = {};
        snap.docs.forEach(function (doc) {
          var p = pending['courses/' + doc.id];
          next[doc.id] = p && S.lists[doc.id] ? S.lists[doc.id] : clone(doc.data());
        });
        S.lists = next;
        if (S.status === 'loading') ready();else requestRender();
      }, onErr);
      db.doc('settings/snacks').onSnapshot(function (s) {
        S.snacks = s.exists && Array.isArray(s.data().items) ? s.data().items : [];
        if (S.status !== 'loading') requestRender();
      }, function () {});
      db.doc('settings/stock').onSnapshot(function (s) {
        S.stock = s.exists ? s.data() : null;
        if (S.status !== 'loading') requestRender();
      }, function () {});
      db.doc('settings/prefs').onSnapshot(function (s) {
        S.prefs = s.exists ? clone(s.data()) : null;
        if (S.status !== 'loading') requestRender();
      }, function () {});
      db.collection('bilans').onSnapshot(function (snap) {
        var next = {};
        snap.docs.forEach(function (doc) {
          next[doc.id] = doc.data();
        });
        S.bilans = next;
        if (S.status !== 'loading') requestRender();
      }, function () {});
      db.collection('recipes').onSnapshot(function (snap) {
        var next = {};
        snap.docs.forEach(function (doc) {
          next[doc.id] = doc.data();
        });
        S.recipes = next;
        if (S.status !== 'loading') requestRender();
      }, function () {});
    }, function () {
      S.status = 'unavailable';
      render();
    });
    c.use('sample').then(function (fn) {
      if (fn) {
        S.sample = fn;
        S.sampleOk = true;
        if (S.status !== 'loading') requestRender();
      }
    }, function () {});
  }
  render();
  start();
})();