DIR ?= $(dir $(lastword $(MAKEFILE_LIST)))

SRC ?= *.js lib test
LINT_SRC ?= $(SRC)

LINT := $(DIR)node_modules/.bin/jshint

lint:
	$(LINT) $(LINT_SRC)

.PHONY: lint
