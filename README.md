## proxy-hot-reload

Node.js application hot reload with `Proxy`.

### Install

```
$ npm i proxy-hot-reload --save
```

### Example

**app.js**

```
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

```
module.exports = {
  id: 1,
  age: 19
}
```

Then try to modify user.js, access to `localhost:3000`.

### Usage

**require('proxy-hot-reload')([option])**

option:

1. includes: as `PROXY_HOT_RELOAD_INCLUDES`, files should be includes, see [glob](https://github.com/isaacs/node-glob).
2. excludes: as `PROXY_HOT_RELOAD_EXCLUDES`, files should be excludes, see [glob](https://github.com/isaacs/node-glob).

### Note

1. proxy-hot-reload should not be used in production environment.
2. proxy-hot-reload is effective for some specific files like: `lib/*.js`, `utils/*.js` etc.

If you find some bugs please raise an issue or make a pull request.

### License

MIT