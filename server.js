"use strict"
/*jshint esversion: 6 */
const shell = require('shelljs');
const appToServe = process.env.APPLICATION || getAppInfo();
const baseHref = process.env.APP_BASE_HREF || '/';

const pathConfig = [
    { 
        urlPath: '/ftgw/pna/:role/:product/:app', 
        fsPath: 'dist/apps/' + appToServe 
    }, 
    { 
        urlPath: '/ftgw/pna/:role/:product/:app/*', 
        fsPath: 'dist/apps/' + appToServe + '/index.html' 
    }, 
    
    { urlPath: baseHref, fsPath: 'dist/apps/' + appToServe }, 
    { urlPath: baseHref + '*', fsPath: 'dist/apps/' + appToServe + '/index.html' }
];

const express = require('express'), 
    http = require('http'), 
    cors = require('cors'), 
    clc = require('cli-color'), 
    path = require('path'), 
    url = require("url"), 
    fs = require("fs"), 
    notice = clc.blue, 
    favicon = require('serve-favicon'), 
    morgan = require('morgan'), 
    _path = pathConfig;

let logging = false, 
    app, 
    renderData = {}, 
    server = null, 
    running = false, 
    servedDirectories = []; 

function getAppInfo() {
    var _appPath = shell.ls('dist/apps').toString(); 
    console.log('application path: ' + _appPath);
    var len = _appPath.indexOf(','); 
    var appName = _appPath;
    if (len != -1) { 
        appName = _appPath.substring(0, len); 
    } 
    return appName;
}

function absolutePathFromCwd(p) { 
    return path.join(process.cwd(), p).replace(/([^\/]*)\/\.\.\//g, ""); 
}

function absolutePathFromCurrentFile(p) { 
    return path.join(__dirname, p).replace(/([^\/]*)\/\.\.\//g, ""); 
}

function leadingSlash(url, b) { 
    return (b ? "/" : "") + url.replace(/^ *\//, ""); 
}

function removeTrailingSlash(url) { 
    return url.replace(/\/+$/, ""); 
}

// note: changing the paths.conf to return something other than /:context/dpcs/:serviceID will break this function
function getBaseUrl(req) { 
    return '/ftgw/pna/'+ req.params.role + '/' + req.params.product + '/' + req.params.app;
}

/** 
 * * this function replaces the default base href with a new provided base 
 * * this is so the base href matches the route the app is served from */
 var cache = {}; 
 function modifyIndexBaseHref(res, base, fullFsPath) {
    var baseHref = leadingSlash(base + '/', true); 
    if (cache[baseHref]) { 
        // res.send(System.web.HttpUtility.HtmlEncode(cache[baseHref])); 
    } else { 
        fs.readFile(fullFsPath, 'utf8', (err, file) => { 
            if(err) { 
            // todo: we don't have logging in client side app, maybe need to add? 
            res.status(500).send('An error occurred.'); 
        } 
        else 
        { 
            cache[baseHref] = file.replace('<base href="/">', `<base href="${baseHref}">`); 
            // res.send(System.web.HttpUtility.HtmlEncode(cache[baseHref])); 
        } 
    }); 
} 
}
        
function enableCors(app) {
            let CORSwhitelist = [];
            // Determine if the developer has provided a string (single) domain 
            // an array of domains to whitelist or if they just want to stick with 
            // the default domain whitelist 
            let CorsValidator = function () { 
                var customWhitelist;
                if (typeof process.env.CORS_OVERRIDE === 'string') { 
                    CORSwhitelist.push(new RegExp(opts.cors)); 
                } 
                else { 
                    CORSwhitelist = [/^(?:.+\.)?fmr\.com$/, /^(?:.+\.)?fidelity\.com$/]; 
                }
        };
        CorsValidator.prototype = { validate: function (origin, callback) { 
            if (CORSwhitelist.some(function (item) { 
                return (new RegExp(item).test(origin)); 
            })) { 
                callback(null, true); 
            } 
            else { 
                callback(null, false); 
            } 
        } 
    };
    return cors({ 
        origin: function (origin, callback) { 
            var validator = new CorsValidator(); 
            validator.validate(origin, callback); 
        }, 
        credentials: false 
    });
} 
    
function serveIndex(app, urlPath, fsPath, fullFsPath) {
    urlPath = leadingSlash(urlPath, true); 
    // if the file being requested is the index.html file 
    if( fullFsPath.indexOf("index")>-1 ) { 
        app.use(urlPath, (req, res) => { 
            if (req.params.context) { 
                // if the app is hosted at a route that isn't root (e.g. /prgw/dpcs/digitaladvisor), change the base href to match the hosting route 
                modifyIndexBaseHref(res, leadingSlash(getBaseUrl(req), true), fullFsPath); 
            } 
            else { 
                // if hosted at base, no need to do anything 
                res.sendFile(fullFsPath); 
            } 
        });
     } 
     else { 
         //intercept possible requests for index.html pages (that could also be requests for js/css) 
         app.use(urlPath, (req, res, next) => { 
             //normalize the url so it can be matched regardless of the form it comes in
             var url = leadingSlash(removeTrailingSlash(req.originalUrl), true), 
             // add param values to /:context/dpcs/:serviceID for matching against the original url 
             baseUrl = getBaseUrl(req), 
             pathsToMatch = [ urlPath, 
                // in case someone actually adds index.html to the route 
                urlPath + '/index.html', 
                baseUrl, 
                baseUrl + '/index.html' 
            ].map((currVal) => { 
                return leadingSlash(currVal, true); 
            }); 
            // if this is a request for an index page, return the modified index 
            // background: when a file isn't specified, like in /prgw/dpcs/digitaladvisor, Express will return an index.html if one is found in the static folder 
            if( pathsToMatch.indexOf(url) > -1 ) { 
                // we want to return index.html but fullFsPath is only the route to the folder (without index.html) at this point 
                modifyIndexBaseHref(res, removeTrailingSlash(url), fullFsPath + '/index.html'); 
            } else { 
                // if we aren't asking for the index file, go to the "next" app.use (the static file server) 
                next(); 
            } 
        }); 
        // if none of the previous routes were for index.html files, serve from the static folder 
        app.use(urlPath, express.static(fullFsPath));
         
    }
        
}

function serve(app, urlPath, fsPath) {
    var fullFsPath = absolutePathFromCwd(fsPath); 
    log("STATIC", leadingSlash(urlPath, true), fullFsPath); 
    // this block sets the base href based on the requested path 
    serveIndex(app, urlPath, fsPath, fullFsPath); 
    servedDirectories.push({ 
        fsPath: fullFsPath, 
        mountPath: urlPath 
    });
}

function log() { 
    if (logging) {
        console.log.apply(console, arguments);
     } 
}

function startWebServer(port, isRestart) {
    app = express(); 
    let serverPort = Number(port || process.env.PORT); 
    if (isNaN(serverPort)) { 
        throw new Error('Server port must be a numeric value'); 
    }
    app.set('port', serverPort);
    var faviconPath = absolutePathFromCurrentFile('/dist/apps/' + appToServe + '/favicon.ico');
    if (fs.existsSync(faviconPath)) {
        app.use(favicon(faviconPath));
    }
    app.use(enableCors(app));
    app.locals.pretty = true;
    var server = http.createServer(app); 
    server.listen(serverPort, function () {
         if (!isRestart) { 
             console.log("Server started on port: " + serverPort); 
            } 
        });
    app.use(morgan('dev'));

    // Add health check
    var router = express.Router();
    router.get('/', function (req, res, next) {
        res.json({status: 'healthy'});
    });
    app.use("/health", router);
    
    return server;
}

function mountDirectories(app, configs) { 
    servedDirectories = []; 
    configs.forEach(function (config) { 
        serve(app, leadingSlash(config.urlPath, true), config.fsPath); 
    }); 
}
function logRouting(configs) { 
    configs.forEach(function (config) { 
        console.log(notice(leadingSlash(config.urlPath, true)) + " ━► " + absolutePathFromCwd(config.fsPath));
    }); 
}

function startServer(config, isRestart) { 
    server = startWebServer(config.port, isRestart); 
    renderData.config = config; 
    mountDirectories(app, config.routing); 
    if (!isRestart) { 
        logRouting(config.routing); 
    } 
    running = true; 
}

function stop() { 
    server.close(); 
    running = false; 
}
function startServerForApi() { 
    var cmd = 'node ' + 'dist/apps/' + appToServe + '/main.js'; 
    shell.exec(cmd); 
}

if (appToServe.indexOf('api') != -1 || appToServe.indexOf('gql') != -1 || appToServe.indexOf('resolver') != -1) {
    //Start the server up for API app 
    startServerForApi();
}else { 
    //Start the server up for UI app 
    startServer({ 
        port: process.env.PORT || 80,
        routing: _path 
    });
}