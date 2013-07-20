// Modules
var http=require('http'),
	fs=require('fs'),
	url = require('url'),
	crypto = require('crypto'),
	zlib = require('zlib');

// Constants
const MIME_TYPES={
	'html':'text/html',
	'js':'text/javascript',
	'manifest':'text/cache-manifest',
	'css': 'text/css',
	'png': 'image/png',
	'jpg': 'image/jpeg',
	'ico': 'image/ico',
	'mp3': 'audio/mp3',
	'ogg': 'audio/ogg',
	'mid': 'audio/x-midi',
	'json': 'application/json',
	'csv': 'text/csv',
	'webapp':'application/x-web-app-manifest+json'
	};

// Global vars
var rootDirectory=__dirname+'/www', // default directory
	domain='hexa.insertafter.com',
	port=8127;

// HTTP Server

// looking for the RootDirectory on CLI args
if(process.argv[2])
	rootDirectory=process.argv[2];
if(!fs.statSync(rootDirectory).isDirectory())
	throw Error('Cannot stat the given rootDirectory ('+rootDirectory+').');

var httpServer=http.createServer(function (request, response) {
	// Parsing URI
	var parsedUrl=url.parse(request.url);
	// Dynamic contents
	// generating the manifest
	if(parsedUrl.pathname==='/application.manifest'&&
		(request.method=='HEAD'||request.method=='GET')) {
		// parralelizing folder stat
		var folders=['images','css'];
		var listings=[];
		var foldersLeft=folders.length;
		folders.forEach(function(name) {
			fs.readdir(rootDirectory+'/'+name,function(error,file) {
				if(error) {
					response.writeHead(500);
					response.end();
					throw Error('Unable to read the folder "'+name+'".');
				}
				listings[name]=file;
				// when all folders are stated
				if(0==--foldersLeft) {
					response.writeHead(200,{'Content-Type':MIME_TYPES['manifest']});
					// generating the manifest
					response.write('CACHE MANIFEST\n# v 1.1\n\nCACHE:\n/index.html\n');
					folders.forEach(function(name) {
						for(var i=listings[name].length-1; i>=0; i--) {
							if(-1!==listings[name][i].indexOf('.')&&'list.json'!==listings[name][i])
								response.write('/'+name+'/'+listings[name][i]+'\n');
							}
						});
					// ending the manifest
					response.end('javascript/production.js\n\nFALLBACK:\n\n\nNETWORK:\n*\n');
					}
				});
			});
		return;
		}

	// Static contents : read-only access
	if('HEAD'!==request.method&&'GET'!==request.method) {
		response.writeHead(401);
		response.end();
		return;
	}
	// No query params
	if('search' in parsedUrl) {
		response.writeHead(401);
		response.end();
	}
	// redirecting the rootDirectory to index.html
	if('/'===parsedUrl.pathname||!parsedUrl.pathname) {
		response.writeHead(301,{'Location':'/index.html'});
		response.end();
		return;
	}
	// Checking the file corresponding to the path
	fs.stat(rootDirectory+parsedUrl.pathname,
		function(error,result) {
			var headers={}, code=0, start=0, end;
			// Sending 404 errors
			if(error||!result.isFile()) {
				response.writeHead(404);
				response.end();
				return;
			}
			// Reading file ext
			var ext=parsedUrl.pathname
				.replace(/^(?:.*)\.([a-z0-9]+)$/,'$1');
			if(!MIME_TYPES[ext]) {
				response.writeHead(500);
				response.end();
				throw Error('Unsupported MIME type ('+ext+')');
			}
			headers['Content-Type']=MIME_TYPES[ext];
			headers['Content-Length']=result.size;
			// Looking for ranged requests
			if(request.headers.range) {
				var chunks = request.headers.range.replace(/bytes=/, "").split("-");
				start = parseInt(chunks[0],10);
				end =  chunks[1] ? parseInt(chunks[1], 10) :
					headers['Content-Length']-1; 
				headers['Content-Range'] = 'bytes ' + start + '-' + end + '/'
					+ (headers['Content-Length']);
				headers['Accept-Ranges'] = 'bytes';
				headers['Content-Length']= (end-start)+1;
				headers['Transfer-Encoding'] = 'chunked';
				headers['Connection'] = 'close';
				code=206;
			} else {
				code=200;
			}
			if('GET'===request.method) {
				if(0===MIME_TYPES[ext].indexOf('text/')
					&&request.headers['accept-encoding']) {
					// setting content encoding
					if(request.headers['accept-encoding'].match(/\bdeflate\b/)) {
						headers['Content-Encoding'] = 'deflate';
						delete headers['Content-Length'];
					} else if (request.headers['accept-encoding'].match(/\bgzip\b/)) {
						headers['Content-Encoding'] = 'gzip';
						delete headers['Content-Length'];
					}
				}
				// sending code and headers
				response.writeHead(code, headers);
				// getting ofstream
				var ofstream=fs.createReadStream(rootDirectory
					+parsedUrl.pathname,{start: start, end: end});
				if(headers['Content-Encoding']) {
					ofstream.pipe('gzip'===headers['Content-Encoding']?
							zlib.createGzip():zlib.createDeflate())
						.pipe(response);
				}
				else {
					ofstream.pipe(response);
				}
			} else {
				// sending code and headers
				response.writeHead(code, headers);
				response.end();
			}
		}
	); 
}).listen(port);

console.log('Server started on http://'+domain+':'+port+'/, '
	+'serving directory :'+rootDirectory);

