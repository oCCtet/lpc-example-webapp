README for web-app
==================

The web-app is an example service software (daemon) that provides a
custom web application and its backend service, designed to work on
a Luminato LPC module.

Luminato management console (the main WebUI) fetches the `/app.json`
application definition file from the service via HTTP GET request;
the file contains an URL from where additional files are fetched:

 - `URL/index.xml` -- layout file defining UI elements and their
   locations.
 - `URL/index.json` -- model file defining meta models used in the
   layout.

Static files like these are served from the `./public` directory.

The model file may define a `ctor` value, which is the URL of the
JavaScript containing any code required by the meta models; if the
model file contains

    {
      "ctor": "/path/EXAMPLE"
    }

then the JSONP response shall be constructed based on the contents of
the file `./public/path/EXAMPLE.jsonp`.

The rest of the functionality serves any requests the web application
itself may make.
