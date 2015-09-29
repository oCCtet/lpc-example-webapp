# Makefile for lpc-example-app

PACKAGE = lpc-example-app
SUBDIRS = web-app

.DEFAULT: all
all:

%:
	@for d in $(SUBDIRS); do \
            $(MAKE) -C $$d $@; \
        done
