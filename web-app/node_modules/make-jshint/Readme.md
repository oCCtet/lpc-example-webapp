
# make-jshint

  `lint` target for Make if you happen to use jshint


## Installation

```
$ npm install --save-dev make-jshint
```

## Example

Include, defaulting to `*.js lib test`:

```Makefile
include node_modules/make-jshint/index.mk
```

Specify the source:

```Makefile
SRC = lib/*.js
include node_modules/make-jshint/index.mk
```

Specify configuration in .jshint file

# License

  MIT
