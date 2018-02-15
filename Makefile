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
all: deps build


.PHONY: deps
deps:
	npm install


.PHONY: build
build: deps


.PHONY: test
test:
	npm test


.PHONY: version
version:
	npm version patch


.PHONY: publish
publish: version
	git push origin v`cat "package.json" | json "version"`
