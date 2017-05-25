;(function(){
//============== config ==================

var TestemConfig = {"decycle_depth":5};
//============== decycle.js ==================

// Modified version of https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
// Handle DOM elements
// Removed global reference
// Stop traversing beyond a max depth

/*
    cycle.js
    2013-02-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint evil: true, regexp: true */

/*members $ref, apply, call, decycle, hasOwnProperty, length, prototype, push,
    retrocycle, stringify, test, toString, nodeType
*/
/* exported decycle */
'use strict';

function decycle(object, maxDepth) {
  // Make a deep copy of an object or array, assuring that there is at most
  // one instance of each object or array in the resulting structure. The
  // duplicate references (which might be forming cycles) are replaced with
  // an object of the form
  //      {$ref: PATH}
  // where the PATH is a JSONPath string that locates the first occurance.
  // So,
  //      var a = [];
  //      a[0] = a;
  //      return JSON.stringify(JSON.decycle(a));
  // produces the string '[{"$ref":"$"}]'.

  // JSONPath is used to locate the unique object. $ indicates the top level of
  // the object or array. [NUMBER] or [STRING] indicates a child member or
  // property.

  var objects = [];   // Keep a reference to each unique object or array
  var paths = [];     // Keep the path to each unique object or array

  maxDepth = maxDepth || 5;
  return (function derez(value, path, depth) {
    if (depth > maxDepth) {
      return 'Max depth.';
    }

    // The derez recurses through the object, producing the deep copy.

    var i,          // The loop counter
        name,       // Property name
        nu;         // The new object or array

    // typeof null === 'object', so go on if this value is really an object but not
    // one of the weird builtin objects.
    // Handle DOM elements
    if (value === null || typeof value === 'undefined' || value instanceof Boolean || value instanceof Number) {
      return value;
    }
    if (typeof value === 'object' && typeof value.nodeType === 'number') {
      return String(value);
    }

    if (typeof value === 'object' && value !== null &&
            !(value instanceof Date)    &&
            !(value instanceof RegExp)  &&
            !(value instanceof String)) {

      // If the value is an object or array, look to see if we have already
      // encountered it. If so, return a $ref/path object. This is a hard way,
      // linear search that will get slower as the number of unique objects grows.

      for (i = 0; i < objects.length; i += 1) {
        if (objects[i] === value) {
          return {$ref: paths[i]};
        }
      }

      // Otherwise, accumulate the unique value and its path.

      objects.push(value);
      paths.push(path);

      // If it is an array, replicate the array.

      if (Object.prototype.toString.apply(value) === '[object Array]') {
        nu = [];
        for (i = 0; i < value.length; i += 1) {
          nu[i] = derez(value[i], path + '[' + i + ']', depth + 1);
        }
      } else {

        // If it is an object, replicate the object.

        nu = {};
        for (name in value) {
          if (Object.prototype.hasOwnProperty.call(value, name)) {
            nu[name] = derez(value[name],
                path + '[' + JSON.stringify(name) + ']', depth + 1);
          }
        }
      }
      return nu;
    }
    return value;
  }(object, '$', 0));
}

//============== jasmine_adapter.js ==================

/*

jasmine_adapter.js
==================

Testem's adapter for Jasmine. It works by adding a custom reporter.

*/

/* globals emit, jasmine */
/* exported jasmineAdapter */
'use strict';

function jasmineAdapter() {

  var results = {
    failed: 0,
    passed: 0,
    total: 0,
    tests: []
  };

  function JasmineAdapterReporter() {}
  JasmineAdapterReporter.prototype.reportRunnerStarting = function() {
    emit('tests-start');
  };
  JasmineAdapterReporter.prototype.reportSpecResults = function(spec) {
    if (spec.results().skipped) {
      return;
    }
    var test = {
      passed: 0,
      failed: 0,
      total: 0,
      id: spec.id + 1,
      name: spec.getFullName(),
      items: []
    };

    var items = spec.results().getItems();

    for (var i = 0, len = items.length; i < len; i++) {
      var item = items[i];
      if (item.type === 'log') {
        continue;
      }
      var passed = item.passed();
      test.total++;
      if (passed) {
        test.passed++;
      } else {
        test.failed++;
      }
      test.items.push({
        passed: passed,
        message: item.message,
        stack: item.trace.stack ? item.trace.stack : undefined
      });
    }

    results.total++;
    if (test.failed > 0) {
      results.failed++;
    } else {
      results.passed++;
    }

    emit('test-result', test);
  };
  JasmineAdapterReporter.prototype.reportRunnerResults = function() {
    emit('all-test-results', results);
  };
  jasmine.getEnv().addReporter(new JasmineAdapterReporter());

}

//============== jasmine2_adapter.js ==================

/*

 jasmine2_adapter.js
 ==================

 Testem's adapter for Jasmine. It works by adding a custom reporter.

 */

/* globals emit, jasmine */
/* exported jasmine2Adapter */
'use strict';

function jasmine2Adapter() {

  var results = {
    failed: 0,
    passed: 0,
    total: 0,
    pending: 0,
    tests: []
  };

  function Jasmine2AdapterReporter() {

    this.jasmineStarted = function() {
      emit('tests-start');
    };

    this.specDone = function(spec) {

      var test = {
        passed: 0,
        failed: 0,
        total: 0,
        pending: 0,
        id: spec.id + 1,
        name: spec.fullName,
        items: []
      };

      var i, l, failedExpectations, item;

      if (spec.status === 'passed') {
        test.passed++;
        test.total++;
        results.passed++;
      } else if (spec.status === 'pending') {
        test.pending++;
        test.total++;
        results.pending++;
      } else {
        failedExpectations = spec.failedExpectations;
        for (i = 0, l = failedExpectations.length; i < l; i++) {
          item = failedExpectations[i];
          test.items.push({
            passed: item.passed,
            message: item.message,
            stack: item.stack || undefined
          });
        }
        test.failed++;
        results.failed++;
        test.total++;
      }

      results.total++;

      emit('test-result', test);
    };

    this.jasmineDone = function() {
      emit('all-test-results', results);
    };

  }

  jasmine.getEnv().addReporter(new Jasmine2AdapterReporter());
}

//============== qunit_adapter.js ==================

/*

qunit_adapter.js
================

Testem's QUnit adapter. Works by using QUnit's hooks:

* `testStart`
* `testDone`
* `moduleStart`
* `moduleEnd`
* `done`
* `log`

*/

/* globals QUnit, emit */
/* exported qunitAdapter */
'use strict';

function qunitAdapter() {

  var results = {
    failed: 0,
    passed: 0,
    skipped: 0,
    total: 0,
    tests: []
  };
  var currentTest;
  var currentModule;
  var id = 1;

  function lineNumber(e) {
    return e.line || e.lineNumber;
  }

  function sourceFile(e) {
    return e.sourceURL || e.fileName;
  }

  function message(e) {
    var msg = (e.name && e.message) ? (e.name + ': ' + e.message) : e.toString();
    return msg;
  }

  function stacktrace(e) {
    if (e.stack) {
      return e.stack;
    }
    return undefined;
  }

  QUnit.log(function(params, e) {
    if (e) {
      currentTest.items.push({
        passed: params.result,
        line: lineNumber(e),
        file: sourceFile(e),
        stack: stacktrace(e) || params.source,
        message: message(e)
      });
    } else {
      if (params.result) {
        currentTest.items.push({
          passed: params.result,
          message: params.message
        });
      } else {
        currentTest.items.push({
          passed: params.result,
          actual: params.actual,
          expected: params.expected,
          stack: params.source,
          message: params.message
        });
      }

    }

  });
  QUnit.testStart(function(params) {
    currentTest = {
      id: id++,
      name: (currentModule ? currentModule + ': ' : '') + params.name,
      items: []
    };
    emit('tests-start');
  });
  QUnit.testDone(function(params) {
    currentTest.failed = params.failed;
    currentTest.passed = params.passed;
    currentTest.skipped = params.skipped;
    currentTest.total = params.total;
    currentTest.runDuration = params.runtime;

    results.total++;

    if (currentTest.skipped) {
      results.skipped++;
    } else if (currentTest.failed > 0) {
      results.failed++;
    } else {
      results.passed++;
    }

    results.tests.push(currentTest);

    emit('test-result', currentTest);
  });
  QUnit.moduleStart(function(params) {
    currentModule = params.name;
  });
  QUnit.moduleEnd = function() {
    currentModule = undefined;
  };
  QUnit.done(function(params) {
    results.runDuration = params.runtime;
    emit('all-test-results', results);
  });

}

//============== mocha_adapter.js ==================

/*

mocha_adapter.js
================

Testem`s adapter for Mocha. It works by monkey-patching `Runner.prototype.emit`.

*/

/* globals mocha, emit, Mocha */
/* globals module */
/* exported mochaAdapter */
'use strict';

function mochaAdapter() {

  var results = {
    failed: 0,
    passed: 0,
    total: 0,
    pending: 0,
    tests: []
  };
  var id = 1;
  var Runner;
  var ended = false;
  var waiting = 0;

  try {
    Runner = mocha.Runner || Mocha.Runner;
  } catch (e) {
    console.error('Testem: failed to register adapter for mocha.');
  }

  function getFullName(test) {
    var name = '';
    while (test) {
      name = test.title + ' ' + name;
      test = test.parent;
    }
    return name.replace(/^ /, '');
  }

  /* Store a reference to the global setTimeout function, in case it's
  	 * manipulated by test helpers */
  var _setTimeout = setTimeout;

  var oEmit = Runner.prototype.emit;
  Runner.prototype.emit = function(evt, test, err) {
    var name = getFullName(test);
    if (evt === 'start') {
      emit('tests-start');
    } else if (evt === 'end') {
      if (waiting === 0) {
        emit('all-test-results', results);
      }
      ended = true;
    } else if (evt === 'test end') {
      waiting++;
      _setTimeout(function() {
        waiting--;
        if (test.state === 'passed') {
          testPass(test);
        } else if (test.state === 'failed') {
          testFail(test, err);
        } else if (test.pending) {
          testPending(test);
        }
        if (ended && waiting === 0) {
          emit('all-test-results', results);
        }
      }, 0);
    } else if (evt === 'fail') {
      testFail(test, err);
    }

    oEmit.apply(this, arguments);

    function testPass(test) {
      var tst = {
        passed: 1,
        failed: 0,
        total: 1,
        pending: 0,
        id: id++,
        name: name,
        runDuration: test.duration,
        items: []
      };
      results.passed++;
      results.total++;
      results.tests.push(tst);
      emit('test-result', tst);
    }

    function makeFailingTest(test, err) {
      err = err || test.err;
      var items = [{
        passed: false,
        message: err.message,
        stack: (err && err.stack) ? err.stack : undefined
      }];
      var tst = {
        passed: 0,
        failed: 1,
        total: 1,
        pending: 0,
        id: id++,
        name: name,
        runDuration: test.duration,
        items: items
      };
      return tst;
    }

    function testFail(test, err) {
      var tst = makeFailingTest(test, err);
      results.failed++;
      results.total++;
      results.tests.push(tst);
      emit('test-result', tst);

    }

    function testPending() {
      var tst = {
        passed: 0,
        failed: 0,
        total: 1,
        pending: 1,
        id: id++,
        name: name,
        items: []
      };
      results.total++;
      results.tests.push(tst);
      emit('test-result', tst);
    }
  };

}

// Exporting this as a module so that it can be unit tested in Node.
if (typeof module !== 'undefined') {
  module.exports = mochaAdapter;
}

//============== buster_adapter.js ==================

/*

buster_adapter.js
=================

Testem's adapter for Buster.js. It works by attaching event listeners to the test runner.

*/

/* globals emit, buster */
/* exported busterAdapter */
'use strict';

function busterAdapter() {

  var id = 1;
  var started = false;

  var results = {
    failed: 0,
    passed: 0,
    total: 0,
    pending: 0,
    tests: []
  };

  var runner = buster.testRunner;
  var currContext = null;

  runner.on('context:start', function(context) {
    if (!started) {
      emit('tests-start');
    }
    currContext = context;
  });
  runner.on('context:end', function() {
    currContext = null;
  });

  function onSuccess(test) {
    emit('test-result', {
      passed: 1,
      failed: 0,
      total: 1,
      pending: 0,
      id: id++,
      name: currContext ? (currContext.name + ' ' + test.name) : test.name
    });
    results.passed++;
    results.total++;
  }

  function onFailure(test) {
    emit('test-result', {
      passed: 0,
      failed: 1,
      total: 1,
      pending: 0,
      id: id++,
      name: currContext ? (currContext.name + ' ' + test.name) : test.name,
      items: [{
        passed: false,
        message: test.error.message,
        stack: test.error.stack ? test.error.stack : undefined
      }]
    });
    results.failed++;
    results.total++;
  }

  function onDeferred(test) {
    emit('test-result', {
      passed: 0,
      failed: 0,
      total: 1,
      pending: 1,
      id: id++,
      name: currContext ? (currContext.name + ' ' + test.name) : test.name
    });
    results.total++;
  }

  runner.on('test:success', onSuccess);
  runner.on('test:failure', onFailure);
  runner.on('test:error', onFailure);
  runner.on('test:timeout', onFailure);
  runner.on('test:deferred', onDeferred);

  runner.on('suite:end', function() {
    emit('all-test-results', results);
  });

}

//============== testem_client.js ==================

/*

testem_client.js
================

The client-side script that reports results back to the Testem server via Socket.IO.
It also restarts the tests by refreshing the page when instructed by the server to do so.

*/
/* globals document, window */
/* globals module */
/* globals jasmineAdapter, jasmine2Adapter, mochaAdapter */
/* globals qunitAdapter, busterAdapter, decycle, TestemConfig */
/* exported Testem */
'use strict';

function getTestemIframeSrc() {
  // Compute a URL to testem/connection.html based on the URL from which this
  // script was loaded (not the document's base URL, in case the document was
  // loaded via a file: URL)
  var scripts = document.getElementsByTagName('script');
  var thisScript = scripts[scripts.length - 1];
  var a = document.createElement('a');
  a.href = thisScript.src;
  a.pathname = '/testem/connection.html';
  return a.href;
}

function appendTestemIframeOnLoad(callback) {
  var iframeAppended = false;
  // Needs to call this synchronously during script load so we know which
  // <script> tag is loading us and we can grab the right src attribute.
  var iframeHref = getTestemIframeSrc();

  var appendIframe = function() {
    if (iframeAppended) {
      return;
    }
    iframeAppended = true;
    var iframe = document.createElement('iframe');
    iframe.style.border = 'none';
    iframe.style.position = 'fixed';
    iframe.style.right = '5px';
    iframe.style.bottom = '5px';
    iframe.frameBorder = '0';
    iframe.allowTransparency = 'true';
    iframe.src = iframeHref;
    document.body.appendChild(iframe);
    callback(iframe);
  };

  var domReady = function() {
    if (!document.body) {
      return setTimeout(domReady, 1);
    }
    appendIframe();
  };

  var DOMContentLoaded = function() {
    if (document.addEventListener) {
      document.removeEventListener('DOMContentLoaded', DOMContentLoaded, false);
    } else {
      document.detachEvent('onreadystatechange', DOMContentLoaded);
    }
    domReady();
  };

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', DOMContentLoaded, false);
    window.addEventListener('load', DOMContentLoaded, false);
  } else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', DOMContentLoaded);
    window.attachEvent('onload', DOMContentLoaded);
  }

  if (document.readyState !== 'loading') {
    domReady();
  }
}

var testFrameworkDidInit = false;
function hookIntoTestFramework(socket) {
  if (testFrameworkDidInit) {
    return;
  }

  var found = true;
  if (typeof getJasmineRequireObj === 'function') {
    jasmine2Adapter(socket);
  } else if (typeof jasmine === 'object') {
    jasmineAdapter(socket);
  } else if (typeof Mocha === 'function') {
    mochaAdapter(socket);
  } else if (typeof QUnit === 'object') {
    qunitAdapter(socket);
  } else if (typeof buster !== 'undefined') {
    busterAdapter(socket);
  } else {
    found = false;
  }

  testFrameworkDidInit = found;
  return found;
}

var addListener;
if (typeof window !== 'undefined') {
  addListener = window.addEventListener ?
    function(obj, evt, cb) { obj.addEventListener(evt, cb, false); } :
    function(obj, evt, cb) { obj.attachEvent('on' + evt, cb); };
}

// Used internally in order to remember state involving a message that needs to
// be fired after a delay. It matters which socket sends the message, because
// the socket is configurable by custom adapters.
function Message(socket, emitArgs) {
  this.socket = socket;
  this.emitArgs = emitArgs;
}

// eslint-disable-next-line no-use-before-define
if (typeof TestemConfig === 'undefined' || {}) {
  var TestemConfig = {};
}

var Testem = {
  emitMessageQueue: [],
  afterTestsQueue: [],
  console: {},

  // The maximum depth beyond which decycle will truncate an emitted event
  // object. When undefined, decycle uses its default.
  decycleDepth: TestemConfig.decycle_depth,

  useCustomAdapter: function(adapter) {
    adapter(new TestemSocket());
  },
  getId: function() {
    // If the test page defined a custom method for discovering our id, use
    // that
    if (window.getTestemId) {
      return window.getTestemId();
    }
    var match = window.location.pathname.match(/^\/(-?[0-9]+)/);
    return match ? match[1] : null;
  },
  emitMessage: function() {
    if (this._noConnectionRequired) {
      return;
    }
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; ++i) {
      args[i] = arguments[i];
    }

    var message = new Message(this, args);

    if (this._isIframeReady) {
      this.emitMessageToIframe(message);
    } else {
      // enqueue until iframe is ready
      this.enqueueMessage(message);
    }
  },
  emit: function(evt) {
    var argsWithoutFirst = new Array(arguments.length - 1);
    for (var i = 0; i < argsWithoutFirst.length; ++i) {
      argsWithoutFirst[i] = arguments[i];
    }

    if (this.evtHandlers && this.evtHandlers[evt]) {
      var handlers = this.evtHandlers[evt];
      for (var j = 0; j < handlers.length; j++) {
        var handler = handlers[j];
        handler.apply(this, argsWithoutFirst);
      }
    }
    this.emitMessage.apply(this, arguments);
  },
  on: function(evt, callback) {
    if (!this.evtHandlers) {
      this.evtHandlers = {};
    }
    if (!this.evtHandlers[evt]) {
      this.evtHandlers[evt] = [];
    }
    this.evtHandlers[evt].push(callback);
  },
  handleConsoleMessage: null,
  noConnectionRequired: function() {
    this._noConnectionRequired = true;
    this.emitMessageQueue = [];
  },
  emitMessageToIframe: function(message) {
    message.socket.sendMessageToIframe('emit-message', message.emitArgs);
  },
  sendMessageToIframe: function(type, data) {
    var message = { type: type };
    var decycleDepth = -1;
    if (data) {
      message.data = data;

      if (data[0] === 'browser-console') {
        // User content in data
        decycleDepth = this.decycleDepth + 1;
      } else if (data[0] === 'test-result') {
        // User content in data.test.items
        decycleDepth = this.decycleDepth + 3;
      } else if (data[0] === 'all-test-results') {
        // User content in data.tests.test.items
        decycleDepth = this.decycleDepth + 4;
      } else {
        // Events don't contain user content / cycles
        decycleDepth = -1;
      }
    }

    message = this.serializeMessage(message, decycleDepth);
    this.iframe.contentWindow.postMessage(message, '*');
  },
  enqueueMessage: function(message) {
    if (this._noConnectionRequired) {
      return;
    }
    this.emitMessageQueue.push(message);
  },
  iframeReady: function() {
    this.drainMessageQueue();
    this._isIframeReady = true;
  },
  drainMessageQueue: function() {
    while (this.emitMessageQueue.length) {
      var item = this.emitMessageQueue.shift();
      this.emitMessageToIframe(item);
    }
  },
  listenTo: function(iframe) {
    this.iframe = iframe;
    var self = this;

    addListener(window, 'message', function messageListener(event) {
      if (event.source !== self.iframe.contentWindow) {
        // ignore messages not from the iframe
        return;
      }

      var message = self.deserializeMessage(event.data);
      var type = message.type;

      switch (type) {
        case 'reload':
          self.reload();
          break;
        case 'get-id':
          self.sendId();
          break;
        case 'no-connection-required':
          self.noConnectionRequired();
          break;
        case 'iframe-ready':
          self.iframeReady();
          break;
        case 'tap-all-test-results':
          self.emit('tap-all-test-results');
          break;
        case 'stop-run':
          self.emit('after-tests-complete');
          break;
      }
    });
  },
  sendId: function() {
    this.sendMessageToIframe('get-id', this.getId());
  },
  reload: function() {
    window.location.reload();
  },
  deserializeMessage: function(message) {
    return JSON.parse(message);
  },
  serializeMessage: function(message, depth) {
    // decycle to remove possible cyclic references
    if (depth !== -1) {
      message = decycle(message, depth);
    }
    // stringify for clients that only can handle string postMessages (IE <= 10)
    return JSON.stringify(message);
  },
  runAfterTests: function() {
    if (Testem.afterTestsQueue.length) {
      var afterTestsCallback = Testem.afterTestsQueue.shift();

      if (typeof afterTestsCallback !== 'function') {
        throw Error('Callback not a function');
      } else {
        afterTestsCallback.call(this, null, null, Testem.runAfterTests);
      }

    } else {
      emit('after-tests-complete');
    }
  },
  afterTests: function(cb) {
    Testem.afterTestsQueue.push(cb);
  }
};

// Represents a configurable socket on top of window.Testem, which is provided
// to each custom adapter.
function TestemSocket() {}
TestemSocket.prototype = Testem;

// Exporting this as a module so that it can be unit tested in Node.
if (typeof module !== 'undefined') {
  module.exports = Testem;
}

function init() {
  appendTestemIframeOnLoad(function(iframe) {
    Testem.listenTo(iframe);
  });
  interceptWindowOnError();
  takeOverConsole();
  setupTestStats();
  Testem.hookIntoTestFramework = function() {
    if (!hookIntoTestFramework(Testem)) {
      throw new Error('Testem was unable to detect a test framework, please load it before invoking Testem.hookIntoTestFramework');
    }
  };
  hookIntoTestFramework(Testem);
  Testem.on('all-test-results', Testem.runAfterTests);
  Testem.on('tap-all-test-results', Testem.runAfterTests);
}

function setupTestStats() {
  var originalTitle = document.title;
  var total = 0;
  var passed = 0;
  Testem.on('test-result', function(test) {
    total++;
    if (test.failed === 0) {
      passed++;
    }
    updateTitle();
  });

  function updateTitle() {
    if (!total) {
      return;
    }
    document.title = originalTitle + ' (' + passed + '/' + total + ')';
  }
}

function takeOverConsole() {
  function intercept(method) {
    var original = console[method];
    Testem.console[method] = original;
    console[method] = function() {
      var doDefault, message;
      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; ++i) {
        args[i] = arguments[i];
      }

      if (Testem.handleConsoleMessage) {
        message = decycle(args, Testem.decycleDepth).join(' ');
        doDefault = Testem.handleConsoleMessage(message);
      }

      if (doDefault !== false) {
        args.unshift(method);
        args.unshift('browser-console');
        emit.apply(Testem, args);

        if (typeof original === 'object') {
          // Do this for IE
          Function.prototype.apply.call(original, console, arguments);
        } else {
          // Do this for normal browsers
          original.apply(console, arguments);
        }
      }
    };
  }
  var methods = ['log', 'warn', 'error', 'info'];
  for (var i = 0; i < methods.length; i++) {
    if (window.console && console[methods[i]]) {
      intercept(methods[i]);
    }
  }
}

function interceptWindowOnError() {
  var orginalOnError = window.onerror;
  window.onerror = function(msg, url, line) {
    if (typeof msg === 'string' && typeof url === 'string' && typeof line === 'number') {
      emit('top-level-error', msg, url, line);
    }
    if (orginalOnError) {
      orginalOnError.apply(window, arguments);
    }
  };
}

function emit() {
  Testem.emit.apply(Testem, arguments);
}

if (typeof window !== 'undefined') {
  window.Testem = Testem;
  init();
}
}());