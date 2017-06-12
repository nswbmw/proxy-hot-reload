'use strict';

if (typeof Proxy !== 'function' && typeof Reflect !== 'object') {
  console.error('Error: your current Node.js not support Proxy or Reflect!');
  return;
}

if (process.env.NODE_ENV === 'production') {
  console.warn('Warning: proxy-hot-reload should not used in production environment!');
}

const Module = require('module');

const _ = require('lodash');
const glob = require('glob');
const shimmer = require('shimmer');
const chokidar = require('chokidar');
const debug = require('debug')('proxy-hot-reload');

const pkg = require('./package');
const globOpt = {
  nodir: true,
  absolute: true
}

module.exports = function proxyHotReload(opts) {
  opts = opts || {};
  const includes = glob.sync(process.env.PROXY_HOT_RELOAD_INCLUDES || opts.includes || '**/*.js', globOpt) || [];
  const excludes = glob.sync(process.env.PROXY_HOT_RELOAD_EXCLUDES || opts.excludes || '**/node_modules/**', globOpt) || [];
  const filenames = _.difference(includes, excludes);
  debug('Watch files: %j', filenames);

  chokidar
    .watch(filenames, {
      usePolling: true
    })
    .on('change', (path) => {
      try {
        if (require.cache[path]) {
          delete require.cache[path];
          require(path);
          debug('Reload file: %s', path);
        }
      } catch (e) {
        console.error('proxy-hot-reload reload %s error:', path);
        console.error(e.stack);
      }
    })
    .on('error', (error) => console.error(error));


  shimmer.wrap(Module.prototype, '_compile', function (__compile) {
    return function proxyHotReloadCompile(content, filename) {
      if (!_.includes(filenames, filename)) {
        try {
          return __compile.call(this, content, filename);
        } catch(e) {
          console.error('proxy-hot-reload cannot compile file: %s', filename);
          console.error(e.stack);
          throw e;
        }
      } else {
        const result = __compile.call(this, content, filename);
        this._exports = this.exports;
        try {
          // try to wrap with Proxy
          this.exports =  new Proxy(this._exports, {
            get: function (target, key, receiver) {
              try {
                if (require.cache[filename]) {
                  debug('Get %s from require.cache[%s]', key, filename);
                  return require.cache[filename]._exports[key];
                } else {
                  debug('Get %s from original %s', key, filename);
                  return Reflect.get(target, key, receiver);
                }
              } catch (e) {
                console.error('proxy-hot-reload get %s from %s error:', key, filename);
                console.error(e.stack);
                throw e;
              }
            }
          });

        } catch (e) {
          console.error('proxy-hot-reload wrap %s with Proxy error:', filename);
          console.error(e.stack);
        }
        return result;
      }
    }
  });
};
