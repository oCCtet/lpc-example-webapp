# Makefile for lpc-example-app/web-app

PACKAGENAME = lpc-example-app
LIBDIR = usr/lib/nodejs

SRCDIRS = lib models routes

.DEFAULT: all
all:

DIR = ./
SRC = *.js $(SRCDIRS)
include node_modules/make-jshint/index.mk

.PHONY: check
check: lint

$(DESTDIR)/etc/lpc-example-app.conf: config/production.conf
	mkdir -p $(dir $@)
	install -m 0644 $< $@

.PHONY: $(DESTDIR)/etc/init
$(DESTDIR)/etc/init: $(wildcard initscripts/*.conf)
	mkdir -p $@
	install -m 0644 -t $@ $^

.PHONY: $(DESTDIR)/$(LIBDIR)/$(PACKAGENAME)
$(DESTDIR)/$(LIBDIR)/$(PACKAGENAME): $(wildcard *.js) $(wildcard *.json)
	mkdir -p $@
	install -m 0644 -t $@ $^

.PHONY: $(DESTDIR)/$(LIBDIR)/$(PACKAGENAME)/public
$(DESTDIR)/$(LIBDIR)/$(PACKAGENAME)/public:
	mkdir -p $@
	cp -a -t $(dir $@) $(notdir $@)

.PHONY: $(DESTDIR)/$(LIBDIR)/$(PACKAGENAME)/node_modules
$(DESTDIR)/$(LIBDIR)/$(PACKAGENAME)/node_modules: package.json
	mkdir -p $@
	cp -a -t $@ $(addprefix node_modules/,\
            $(shell jq '.dependencies?|keys|join(" ")' $< | tr -d [\"]))

define SRCDIR_template
.PHONY: $(DESTDIR)/$(LIBDIR)/$(PACKAGENAME)/$(1)
$(DESTDIR)/$(LIBDIR)/$(PACKAGENAME)/$(1): $(wildcard $(1)/*.js) $(wildcard $(1)/*.json)
	mkdir -p $$@
	install -m 0644 -t $$@ $$^
endef

$(foreach sd,$(SRCDIRS),$(eval $(call SRCDIR_template,$(sd))))

.PHONY: install
install: $(DESTDIR)/etc/lpc-example-app.conf \
    $(DESTDIR)/etc/init \
    $(DESTDIR)/$(LIBDIR)/$(PACKAGENAME) \
    $(DESTDIR)/$(LIBDIR)/$(PACKAGENAME)/public \
    $(DESTDIR)/$(LIBDIR)/$(PACKAGENAME)/node_modules \
    $(addprefix $(DESTDIR)/$(LIBDIR)/$(PACKAGENAME)/,$(SRCDIRS))

.PHONY: clean
clean:

.PHONY: distclean
distclean:

DISTRIBUTE_INST_DIR=.install
DISTRIBUTE_TARBALL=lpc-example-app.tar.gz
DISTRIBUTE_LOGIN?=root
DISTRIBUTE_HOST?=myluminato-ip-address
.PHONY: distribute
distribute:
	mkdir -p $(DISTRIBUTE_INST_DIR)
	$(RM) -r $(DISTRIBUTE_INST_DIR)/*
	$(MAKE) install DESTDIR=$(shell pwd)/$(DISTRIBUTE_INST_DIR)
	tar -cvzf $(DISTRIBUTE_TARBALL) -C $(DISTRIBUTE_INST_DIR) .
	scp $(DISTRIBUTE_TARBALL) $(DISTRIBUTE_LOGIN)@$(DISTRIBUTE_HOST):/mnt/user/
