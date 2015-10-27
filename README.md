LPC webapp for UI integration
=============================

This example webapp for the Application module demonstrates the
integration of application-specific user interface elements into
the management console (a.k.a. WebUI).

# Overview #

The management console provides several pre-defined locations onto
which applications may inject their custom user interface elements.
This allows the applications to seamlessly integrate their configuration
and monitoring controls into the managements console; alternatively,
the applications may choose to just offer a method to access their
stand-alone web user interface e.g. in the form of a button that opens
the stand-alone interface into another web browser window.

The example webapp is built with [n][Node.js], serving the HTTP requests
made by the management console to:

  1. Load the static UI integration (layout, model and JavaScript) files, and
  2. Serve the RESTful requests made by the UI integration itself.

  [n]: https://nodejs.org

The webapp exposes TCP port 8079.

# Containerization #

The webapp for integrating user interface should reside in its own
container, as should other parts of the application. To enable access
to Application module resources, the containers may need to be run in
the _host_ network mode.

Slot-specific configuration should be stored in a host-mounted data
volume, as in `-v /usr/etc/appconfig:/usr/etc`.

# Native Installation #

The example webapp can alternatively be installed and run "natively"
on the host; either by copying the source as-is to the host, or by
installing a sanitized copy, possibly into a staging area first.

To run the webapp, a Ubuntu host is assumed with `nodejs` and `nodejs-legacy`
packages installed. For installing a sanitized copy, `make` and `jq` packages
are additionally required.

Run the following command to install:

    # make install

`DESTDIR` may be specified for installing into a staging area:

    # make install DESTDIR=/path/to/staging

Upstart script is also installed to auto-start the application on system
boot.

# License #

The webapp is Copyright (C) 2015 Teleste Corporation.

The webapp is provided as-is, solely for the purpose of being example
source code, not meant for production.

The example app uses Node.js built-in libraries and external node modules,
licensed under their own licenses. See the README.md files in their respective
directories.
