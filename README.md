## proxy-hot-reload

Node.js application hot reload with `Proxy`.

**NB**: proxy-hot-reload can only proxy modules that return an plain object, like:

```js
module.export = { ... }
// or
exports.xxx = ...
```

### Install

```sh
$ npm i proxy-hot-reload --save
```

### Example

**app.js**

```js
'use strict';

if (process.env.NODE_ENV !== 'production') {
  require('proxy-hot-reload')({
    includes: '**/*.js'
  });
}

const express = require('express');
const app = express();
const user = require('./user');

app.get('/', function (req, res) {
  res.send(user);
})

app.listen(3000);
```

**user.js**

```js
module.exports = {
  id: 1,
  age: 19
}
```

```sh
DEBUG=proxy-hot-reload node app.js
```

Then try to modify user.js, access to `localhost:3000`.

### Usage

**require('proxy-hot-reload')([option])**

option:

1. includeFiles([obsolute filepath]) || includes(glob pattern string): as `PROXY_HOT_RELOAD_INCLUDES`, files should be includes, see [glob](https://github.com/isaacs/node-glob).
2. excludeFiles([obsolute filepath]) || excludes(glob pattern string): as `PROXY_HOT_RELOAD_EXCLUDES`, files should be excludes, see [glob](https://github.com/isaacs/node-glob).
3. watchedFileChangedButNotReloadCache: default:

```js
function (filename) {
  debug(`${filename} changed, but not reload cache!`)
}
```

### Note

1. proxy-hot-reload should not be used in production environment.
2. proxy-hot-reload is effective for some specific files like: `lib/*.js`, `utils/*.js` etc.

If you find some bugs please raise an issue or make a pull request.

### License

MIT