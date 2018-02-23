# from git://github.com/andreineculau/core.inc.mk:core.inc.mk

SHELL := bash
# .SHELLFLAGS := -euo pipefail -O globstar -c # BASH v4
.SHELLFLAGS := -euo pipefail -c
.DEFAULT_GOAL := all
.DELETE_ON_ERROR:
.SUFFIXES:
.NOTPARALLEL:

# ------------------------------------------------------------------------------

.PHONY: all
all: deps build check


.PHONY: deps
deps:
	npm install


.PHONY: build
build: deps


.PHONY: check
check:
	npm test


.PHONY: test
test: check


.PHONY: version
version:
	npm version patch


.PHONY: publish
publish:
	git push origin v`cat "package.json" | json "version"`
