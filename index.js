'use strict'

if (typeof Proxy !== 'function' && typeof Reflect !== 'object') {
  console.error('Error: your current Node.js not support Proxy or Reflect!')
  process.exit()
}

if (process.env.NODE_ENV === 'production') {
  console.warn('Warning: proxy-hot-reload should not be used in production environment!')
}

const Module = require('module')

const _ = require('lodash')
const glob = require('glob')
const shimmer = require('shimmer')
const chokidar = require('chokidar')
const debug = require('debug')('proxy-hot-reload')

const globOpt = {
  nodir: true,
  absolute: true
}

module.exports = function proxyHotReload (opts) {
  opts = opts || {}
  const includes = opts.includeFiles || glob.sync(process.env.PROXY_HOT_RELOAD_INCLUDES || opts.includes || '**/*.js', globOpt) || []
  const excludes = opts.excludeFiles || glob.sync(process.env.PROXY_HOT_RELOAD_EXCLUDES || opts.excludes || '**/node_modules/**', globOpt) || []
  const watchedFileChangedButNotReloadCache = opts.watchedFileChangedButNotReloadCache || function (filename) {
    debug(`${filename} changed, but not reload cache!`)
  }
  const watchFiles = _.difference(includes, excludes)
  const loadedFiles = Object.create(null)

  chokidar
    .watch(watchFiles, {
      usePolling: true
    })
    .on('change', (path) => {
      try {
        if (require.cache[path]) {
          if ('_exports' in require.cache[path]) {
            delete require.cache[path]
            require(path)
            if (path in loadedFiles) {
              debug('Reload file: %s', path)
            }
          }
        }
      } catch (e) {
        console.error('proxy-hot-reload reload `%s` error:', path)
        console.error(e.stack)
      }
    })
    .on('error', (error) => console.error(error))

  shimmer.wrap(Module.prototype, '_compile', function (__compile) {
    return function proxyHotReloadCompile (content, filename) {
      if (!_.includes(watchFiles, filename)) {
        try {
          return __compile.call(this, content, filename)
        } catch (e) {
          console.error('proxy-hot-reload cannot compile file: %s', filename)
          console.error(e.stack)
          throw e
        }
      } else {
        const result = __compile.call(this, content, filename)
        this._exports = this.exports
        // non-object return original compiled code
        if (!_.isPlainObject(this._exports)) {
          watchedFileChangedButNotReloadCache(filename)
          return result
        }
        if (!(filename in loadedFiles)) {
          loadedFiles[filename] = true
          debug('Watch file: %j', filename)
        }

        try {
          // try to wrap with Proxy
          this.exports = new Proxy(this._exports, {
            get: function (target, key, receiver) {
              try {
                if (require.cache[filename]) {
                  debug('Get `%s` from require.cache[%s]', key, filename)
                  return require.cache[filename]._exports[key]
                } else {
                  debug('Get `%s` from original %s', key, filename)
                  return Reflect.get(target, key, receiver)
                }
              } catch (e) {
                console.error('proxy-hot-reload get `%s` from `%s` error:', key, filename)
                console.error(e.stack)
                throw e
              }
            }
          })
        } catch (e) {
          console.error('proxy-hot-reload wrap `%s` with Proxy error:', filename)
          console.error(e.stack)
        }
        return result
      }
    }
  })
}
