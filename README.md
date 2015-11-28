## rtail slides for node interactive 2015

### Install and initial setup

    $ npm i
    $ node_modules/.bin/gulp serve

This will spin up a local server with [livereload](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei?hl=en).

### Test dist version

The version deployed to s3 is minified and compressed to maximize performances. Sometimes (rarely) there are inconsistencies between compressed and uncompressed version. It's a good practice to test the `dist` build to check that everything is ok.

    $ node_modules/.bin/gulp serve:dist

You can now navigate to http://localhost:3000/dist
