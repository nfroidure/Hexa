;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// AMD + global + NodeJS : You can use this object by inserting a script
// or using an AMD loader (like RequireJS) or using NodeJS
(function(root,define){ define([], function() {
// START: Module logic start

	// Commandor constructor : rootElement is the element
	// from wich we capture commands
	var Commandor=function Commandor(rootElement) {
		// event handlers
		var _pointerDownListener, _pointerUpListener, _pointerClickListener,
			_touchstartListener, _touchendListener, _clickListener,
			_keydownListener, _keyupListener,
			_formChangeListener, _formSubmitListener,
		// Commands hashmap
			_commands={'____internal':true};
		;
		// Testing rootElement
		if(!rootElement) {
			throw Error('No rootElement given');
		}
		// keeping a reference to the rootElement
		this.rootElement=rootElement;
		// MS Pointer events : should unify pointers, but... read and see by yourself. 
		if(!!('onmsgesturechange' in window)) {
			// event listeners for buttons
			(function() {
				var curElement=null;
				_pointerDownListener=function(event) {
					curElement=this.findButton(event.target)||this.findForm(event.target);
					curElement&&event.preventDefault()||event.stopPropagation();
				}.bind(this);
				_pointerUpListener=function(event) {
					if(curElement) {
						if(curElement===this.findButton(event.target)) {
							this.captureButton(event);
						} else if(curElement===this.findForm(event.target)) {
							this.captureForm(event);
						}
						event.preventDefault(); event.stopPropagation();
						curElement=null;
					}
				}.bind(this);
				this.rootElement.addEventListener('MSPointerDown', _pointerDownListener, true);
				this.rootElement.addEventListener('MSPointerUp', _pointerUpListener, true);
			}).call(this);
			// fucking IE10 bug : it doesn't cancel click event
			// when gesture events are cancelled
			_pointerClickListener=function(event){
					if(this.findButton(event.target)) {
						event.preventDefault();
						event.stopPropagation();
					}
				}.bind(this);
			this.rootElement.addEventListener('click',_pointerClickListener,true);
		} else {
			// Touch events
			if(!!('ontouchstart' in window)) {
				(function() {
					// a var keepin' the touchstart element
					var curElement=null;
					_touchstartListener=function(event) {
						curElement=this.findButton(event.target)||this.findForm(event.target);
						curElement&&event.preventDefault()||event.stopPropagation();
					}.bind(this);
					this.rootElement.addEventListener('touchstart', _touchstartListener, true);
					// checking it's the same at touchend, capturing command if so
					_touchendListener=function(event) {
						if(curElement==this.findButton(event.target)) {
							this.captureButton(event);
						} else if(curElement===this.findForm(event.target)) {
							this.captureForm(event);
						} else {
							curElement=null;
						}
					}.bind(this);
					this.rootElement.addEventListener('touchend', _touchendListener,true);
				}).call(this);
			}
		// Clic events
		_clickListener=this.captureButton.bind(this);
		this.rootElement.addEventListener('click', _clickListener, true);
		}
		// Keyboard events
		// Cancel keydown action (no click event)
		_keydownListener=function(event) {
			if(13===event.keyCode&&(this.findButton(event.target)
				||this.findForm(event.target))) {
				event.preventDefault()&&event.stopPropagation();
			}
		}.bind(this);
		this.rootElement.addEventListener('keydown', _keydownListener, true);
		// Fire on keyup
		_keyupListener=function(event) {
			if(13===event.keyCode&&!event.ctrlKey) {
				if(this.findButton(event.target)) {
					this.captureButton.apply(this, arguments);
				} else {
					this.captureForm.apply(this, arguments);
				}
			}
		}.bind(this);
		this.rootElement.addEventListener('keyup', _keyupListener, true);
		// event listeners for forms submission
		_formSubmitListener=this.captureForm.bind(this);
		this.rootElement.addEventListener('submit', _formSubmitListener, true);
		// event listeners for form changes
		_formChangeListener=this.formChange.bind(this);
		this.rootElement.addEventListener('change', _formChangeListener, true);
		this.rootElement.addEventListener('select', _formChangeListener, true);

		// Common command executor
		this.executeCommand=function (event,command,element) {
			if(!_commands) {
				throw Error('Cannot execute command on a disposed Commandor object.');
			}
			// checking for the app protocol
			if(0!==command.indexOf('app:'))
				return false;
			// removing app:
			command=command.substr(4);
			var chunks=command.split('?');
			// the first chunk is the command path
			var callback=_commands;
			var nodes=chunks[0].split('/');
			for(var i=0, j=nodes.length; i<j-1; i++) {
				if(!callback[nodes[i]]) {
					throw Error('Cannot execute the following command "'+command+'".');
				}
				callback=callback[nodes[i]];
			}
			if('function' !== typeof callback[nodes[i]]) {
				throw Error('Cannot execute the following command "'+command+'", not a fucntion.');
			}
			// Preparing arguments
			var args={};
			if(chunks[1]) {
				chunks=chunks[1].split('&');
				for(var k=0, l=chunks.length; k<l; k++) {
					var parts=chunks[k].split('=');
					if(undefined!==parts[0]&&undefined!==parts[1]) {
						args[parts[0]]=decodeURIComponent(parts[1]);
					}
				}
			}
			// executing the command fallback
			if(callback.____internal) {
				return !!!((callback[nodes[i]])(event,args,element));
			} else {
				return !!!(callback[nodes[i]](event,args,element));
			}
			return !!!callback(event,args,element);
		};

		// Add a callback or object for the specified path
		this.suscribe=function(path,callback) {
			if(!_commands) {
				throw Error('Cannot suscribe commands on a disposed Commandor object.');
			}
			var nodes=path.split('/'),
				command=_commands;
			for(var i=0, j=nodes.length-1; i<j; i++) {
				if((!command[nodes[i]])||!(command[nodes[i]] instanceof Object)) {
					command[nodes[i]]={'____internal':true};
				}
				command=command[nodes[i]];
				if(!command.____internal) {
					throw Error('Cannot suscribe commands on an external object.');
				}
			}
			command[nodes[i]]=callback;
		};

		// Delete callback for the specified path
		this.unsuscribe=function(path) {
			if(!_commands) {
				throw Error('Cannot unsuscribe commands of a disposed Commandor object.');
			}
			var nodes=path.split('/'),
				command=_commands;
			for(var i=0, j=nodes.length-1; i<j; i++) {
				command=command[nodes[i]]={};
			}
			if(!command.____internal) {
				throw Error('Cannot unsuscribe commands of an external object.');
			}
			command[nodes[i]]=null;
		};

		// Dispose the commandor object (remove event listeners)
		this.dispose=function() {
			_commands=null;
			if(_pointerDownListener) {
				this.rootElement.removeEventListener('MSPointerDown',
					_pointerDownListener, true);
				this.rootElement.removeEventListener('MSPointerUp',
					_pointerUpListener, true);
				this.rootElement.removeEventListener('click',
					_pointerClickListener, true);
			}
			if(_touchstartListener) {
				this.rootElement.removeEventListener('touchstart',
					_touchstartListener, true);
				this.rootElement.removeEventListener('touchend',
					_touchendListener, true);
			}
			this.rootElement.removeEventListener('click', _clickListener, true);
			this.rootElement.removeEventListener('keydown', _keydownListener, true);
			this.rootElement.removeEventListener('keyup', _keyupListener, true);
			this.rootElement.removeEventListener('change', _formChangeListener, true);
			this.rootElement.removeEventListener('select', _formChangeListener, true);
			this.rootElement.removeEventListener('submit', _formSubmitListener, true);
		};
	}

	// Look for a button
	Commandor.prototype.findButton=function(element) {
		while(element&&element.parentNode) {
			if('A'===element.nodeName
				&&element.hasAttribute('href')
				&&-1!==element.getAttribute('href').indexOf('app:')) {
				return element;
			}
			if('INPUT'===element.nodeName&&element.hasAttribute('type')
				&&(element.getAttribute('type')=='submit'
						||element.getAttribute('type')=='button')
				&&element.hasAttribute('formaction')
				&&-1!==element.getAttribute('formaction').indexOf('app:')
				) {
				return element;
			}
			if(element===this.rootElement) {
				return null;
			}
			element=element.parentNode;
		}
		return null;
	}

	// Look for a form
	Commandor.prototype.findForm=function(element) {
		if('FORM'===element.nodeName||
			('INPUT'===element.nodeName&&element.hasAttribute('type')
			&&'submit'===element.getAttribute('type'))) {
			while(element&&element.parentNode) {
				if('FORM'===element.nodeName&&element.hasAttribute('action')
					&&-1!==element.getAttribute('action').indexOf('app:')) {
					return element;
				}
				if(element===this.rootElement) {
					return null;
				}
				element=element.parentNode;
			}
			return element;
		}
		return null;
	};

	// Look for form change
	Commandor.prototype.findFormChange=function(element) {
		while(element&&element.parentNode) {
			if('FORM'===element.nodeName&&element.hasAttribute('action')
				&&-1!==element.getAttribute('action').indexOf('app:')) {
				return element;
			}
			if(element===this.rootElement) {
				return null;
			}
			element=element.parentNode;
		}
		return element;
	};

	// Extract the command for a button
	Commandor.prototype.doCommandOfButton=function(element, event) {
		var command='';
		// looking for a button with formaction attribute
		if('INPUT'===element.nodeName) {
			command=element.getAttribute('formaction');
		// looking for a link
		} else if('A'===element.nodeName) {
			command=element.getAttribute('href');
		}
		// executing the command
		this.executeCommand(event,command,element);
	};

	// Button event handler
	Commandor.prototype.captureButton=function(event) {
		var element=this.findButton(event.target);
		// if there is a button, stop event
		if(element) {
			// if the button is not disabled, run the command
			if((!element.hasAttribute('disabled'))
				||'disabled'===element.getAttribute('disabled')) {
				this.doCommandOfButton(element, event);
			}
			event.stopPropagation()||event.preventDefault();
		}
	};

	// Form change handler
	Commandor.prototype.formChange=function(event) {
		// find the evolved form
		var element=this.findFormChange(event.target),
			command='';
		// searching the data-change attribute containing the command
		if('FORM'===element.nodeName&&element.hasAttribute('data-change')) {
			command=element.getAttribute('data-change');
		}
		// executing the command
		command&&this.executeCommand(event,command,element);
	};

	// Extract the command for a button
	Commandor.prototype.doCommandOfForm=function(element, event) {
		var command='';
		// looking for a button with formaction attribute
		if('FORM'===element.nodeName) {
			command=element.getAttribute('action');
		}
		// executing the command
		this.executeCommand(event,command,element);
	};

	// Form command handler
	Commandor.prototype.captureForm=function(event) {
		var element=this.findForm(event.target);
		// if there is a button, stop event
		if(element) {
			// if the button is not disabled, run the command
			if((!element.hasAttribute('disabled'))
				||'disabled'===element.getAttribute('disabled')) {
				this.doCommandOfForm(element, event);
			}
			event.stopPropagation()||event.preventDefault();
		}
	};

// END: Module logic end

	return Commandor;


});})(this,typeof define === 'function' && define.amd ?
	// AMD
	define :
	// NodeJS
	(typeof exports === 'object'?function (name, deps, factory) {
		var root=this;
		if(typeof name === 'object') {
			factory=deps; deps=name;
		}
		module.exports=factory.apply(this, deps.map(function(dep){
			return require(dep);
		}));
	}:
	// Global
	function (name, deps, factory) {
		var root=this;
		if(typeof name === 'object') {
			factory=deps; deps=name;  name='Commandor';
		}
		this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
			return root[dep.substring(dep.lastIndexOf('/')+1)];
		}));
	}.bind(this))
);

},{}],2:[function(require,module,exports){
// Hexa : Full front Hexadecimal editor

// Dependencies
var Commandor = require('commandor');

/* Consts */
var BYTES_PER_LINE=16,
	LINES_PER_PAGE=16;

/* Constructor */
function Application() {
	// Properties
	this.fileName='newfile.bin';
	this.fileMime='application/octet-binary';
	this.dataView=null;
	this.page=0;
	this.maxPage=0;
	this.index=0;
	// Registering ui elements
	this.filePicker=document.querySelector('input[type="file"]');
	this.form=document.querySelector('form');
	this.fileInfo=document.querySelector('nav span');
	this.pages=document.querySelectorAll('nav span')[1];
	// Registering events
  this.filePicker.addEventListener('change', function(event){
		if(event.target.files.length)
	  	this.readFile(event.target.files[0]);
  }.bind(this));
  window.addEventListener("message", this.handleMessage.bind(this), false);
	// Retrieving template elements
	this.tbody=document.querySelector('table tbody');
	this.rowTh=document.querySelector('table tbody tr th');
	this.rowTh.parentNode.removeChild(this.rowTh);
	this.byteTd=document.querySelector('table tbody tr td');
	this.byteTd.parentNode.removeChild(this.byteTd);
	this.charTd=document.querySelector('table tbody tr td');
	this.charTd.parentNode.removeChild(this.charTd);
	this.tbody.removeChild(this.tbody.firstChild);
	// Commands management
	this.cmdMgr=new Commandor(document.documentElement);
	this.cmdMgr.suscribe('open',this.open.bind(this));
	this.cmdMgr.suscribe('new',this.newFile.bind(this));
	this.cmdMgr.suscribe('save',this.save.bind(this));
	this.cmdMgr.suscribe('browse',this.browse.bind(this));
	this.cmdMgr.suscribe('select',this.select.bind(this));
	this.cmdMgr.suscribe('change',this.change.bind(this));
	// Starting
	this.loadBuffer();
}

/* Command functions */
Application.prototype.open = function() {
	this.filePicker.click();
};

Application.prototype.newFile = function() {
	this.fileName='newfile.bin';
	this.fileMime='application/octet-binary';
	this.loadBuffer();
};

Application.prototype.save = function() {
	var file=new Blob([this.dataView], {type: this.fileMime});
	window.open(URL.createObjectURL(file));
	/*
	var reader = new FileReader();
	reader.readAsDataURL(file);
	reader.onloadend=(function(event) {
		window.open(event.target.result);
	}).bind(this);*/
};

Application.prototype.browse = function(event, params) {
	var page=this.page;
	if('begin'===params.page) {
		page=0;
	} else if('previous'===params.page) {
		page=page-->0?page:0;
	}else if('next'===params.page) {
		page=page++<this.maxPage?page:this.maxPage;
	} else if('end'===params.page) {
		page=this.maxPage;
	}
	if(page!==this.page)
		this.drawPage(page);
};

Application.prototype.select = function(event, params) {
	var index=params&&parseInt(params.index,10)||0;
	if(index>=this.dataView.byteLength)
		index=this.dataView.byteLength-1;
	this.drawForm(index)
};

Application.prototype.change = function(event, params) {
	if('index'===event.target.getAttribute('name')) {
		this.index=parseInt((event.target.value<this.dataView.byteLength?event.target.value:this.dataView.byteLength-1),10);
		this.page=Math.floor(this.index/(LINES_PER_PAGE*BYTES_PER_LINE));
		this.drawPage(this.page);
	}
	this.drawForm();
};

/* Internals functions */
Application.prototype.readFile = function(file) {
	this.fileName=file.name;
	this.fileMime=file.type||'application/octet-binary';
	var reader = new FileReader();
	reader.readAsArrayBuffer(file);
	reader.onloadend=(function(event) {
		this.loadBuffer(event.target.result);
	}).bind(this);
};

Application.prototype.loadBuffer = function(buffer) {
	this.fileInfo.innerHTML=this.fileName+'['+this.fileMime+']';
	if(!buffer)
		buffer=new ArrayBuffer(32);
	this.dataView=new DataView(buffer);
	this.maxPage=Math.floor(this.dataView.byteLength/(LINES_PER_PAGE*BYTES_PER_LINE));
	this.drawPage(0);
	this.drawForm(0);
};

/* Display functions */
Application.prototype.drawPage = function(page) {
	this.page=page||0;
	this.pages.firstChild.textContent=(this.page+1)+'/'+(this.maxPage+1);
	while(this.tbody.firstChild) {
		this.tbody.removeChild(this.tbody.firstChild);
	}
	var table=this.tbody.parentNode, tr, th, td, charValue, byteValue;
	// temporary removing the table body
	table.removeChild(this.tbody);
	// printing each lines
	for(var i=this.page*LINES_PER_PAGE, j=i+LINES_PER_PAGE; i<j; i++) {
		tr=document.createElement('tr');
		// line header
		th=this.rowTh.cloneNode(true);
		th.innerHTML=this.toFixedString(i*BYTES_PER_LINE,16,6);
		tr.appendChild(th);
		// printing bytes
		for(var k=i*BYTES_PER_LINE, l=k+BYTES_PER_LINE; k<l; k++) {
			td=this.byteTd.cloneNode(true);
			if(k<this.dataView.buffer.byteLength) {
				byteValue=this.toFixedString(this.dataView.getUint8(k),16,2);
			} else {
				byteValue='--';
			}
			td.firstChild.firstChild.textContent=byteValue;
			td.firstChild.setAttribute('href',td.firstChild.getAttribute('href')+(k));
			td.firstChild.setAttribute('title',td.firstChild.getAttribute('title')+(k).toString(16));
			tr.appendChild(td);
		}
		// printing chars
		for(var k=i*BYTES_PER_LINE, l=k+BYTES_PER_LINE; k<l; k++) {
			td=this.charTd.cloneNode(true);
			if(k<this.dataView.buffer.byteLength) {
				charValue=(this.dataView.getUint8(k)>31?String.fromCharCode(this.dataView.getUint8(k)):'.');
			} else {
				charValue=' ';
			}
			td.firstChild.firstChild.textContent=charValue;
			td.firstChild.setAttribute('href',td.firstChild.getAttribute('href')+(k));
			td.firstChild.setAttribute('title',td.firstChild.getAttribute('title')+(k).toString(16));
			tr.appendChild(td);
		}
		this.tbody.appendChild(tr);
	}
	table.appendChild(this.tbody);
	this.byteCells=document.querySelectorAll('table tbody td.byte');
	this.charCells=document.querySelectorAll('table tbody td.char');
};

Application.prototype.drawForm = function(index) {
	if('undefined'===typeof index) {
		index=this.index||0;
	}
	if(this.index!=index) {
		this.byteCells[this.index%(LINES_PER_PAGE*BYTES_PER_LINE)]
			.firstChild.removeAttribute('class');
		this.charCells[this.index%(LINES_PER_PAGE*BYTES_PER_LINE)]
			.firstChild.removeAttribute('class');
	}
	this.index=index;
	this.byteCells[this.index%(LINES_PER_PAGE*BYTES_PER_LINE)]
		.firstChild.setAttribute('class','selected');
	this.charCells[this.index%(LINES_PER_PAGE*BYTES_PER_LINE)]
		.firstChild.setAttribute('class','selected');
	var littleendian=this.form.elements['littleendian'].checked;
	var streamlength=parseInt(this.form.elements['streamlength'].value,10);
	this.form.elements['uint8'].value=this.dataView.getUint8(this.index);
	this.form.elements['int8'].value=this.dataView.getInt8(this.index);
	if(this.index+1<this.dataView.buffer.byteLength) {
		this.form.elements['uint16'].removeAttribute('disabled');
		this.form.elements['uint16'].value=this.dataView.getUint16(this.index,littleendian);
		this.form.elements['int16'].removeAttribute('disabled');
		this.form.elements['int16'].value=this.dataView.getInt16(this.index,littleendian);
	} else {
		this.form.elements['uint16'].setAttribute('disabled','disabled');
		this.form.elements['uint16'].value='';
		this.form.elements['int16'].setAttribute('disabled','disabled');
		this.form.elements['int16'].value='';
	}
	if(this.index+3<this.dataView.buffer.byteLength) {
		this.form.elements['uint32'].removeAttribute('disabled');
		this.form.elements['uint32'].value=this.dataView.getUint32(this.index,littleendian);
		this.form.elements['int32'].removeAttribute('disabled');
		this.form.elements['int32'].value=this.dataView.getInt32(this.index,littleendian);
		this.form.elements['float32'].removeAttribute('disabled');
		this.form.elements['float32'].value=this.dataView.getFloat32(this.index,littleendian);
	} else {
		this.form.elements['uint32'].setAttribute('disabled','disabled');
		this.form.elements['uint32'].value='';
		this.form.elements['int32'].setAttribute('disabled','disabled');
		this.form.elements['int32'].value='';
		this.form.elements['float32'].setAttribute('disabled','disabled');
		this.form.elements['float32'].value='';
	}
	if(this.index+7<this.dataView.buffer.byteLength) {
		this.form.elements['float64'].removeAttribute('disabled');
		this.form.elements['float64'].value=this.dataView.getFloat64(this.index,littleendian);
	} else {
		this.form.elements['float64'].setAttribute('disabled','disabled');
		this.form.elements['float64'].value='';
	}
	this.form.elements['index'].setAttribute('max',this.dataView.byteLength-1);
	this.form.elements['index'].value=this.index;
	if(this.index-1+streamlength<this.dataView.buffer.byteLength) {
		this.form.elements['hex'].removeAttribute('disabled');
		this.form.elements['hex'].setAttribute('pattern','[0-9a-f]{'+(streamlength*2)+'}');
		this.form.elements['hex'].value=this.toFixedString(
			this.dataView['getUint'+(streamlength*8)](this.index),16,streamlength*2);
		this.form.elements['octal'].removeAttribute('disabled');
		this.form.elements['octal'].setAttribute('pattern','[0-8]{'+(streamlength*4)+'}');
		this.form.elements['octal'].value=this.toFixedString(
			this.dataView['getUint'+(streamlength*8)](this.index),8,streamlength*4);
		this.form.elements['bin'].removeAttribute('disabled');
		this.form.elements['bin'].setAttribute('pattern','[01]{'+(streamlength*8)+'}');
		this.form.elements['bin'].value=this.toFixedString(
			this.dataView['getUint'+(streamlength*8)](this.index),2,streamlength*8);
	} else {
		this.form.elements['hex'].removeAttribute('pattern');
		this.form.elements['hex'].setAttribute('disabled','disabled');
		this.form.elements['hex'].value='';
		this.form.elements['octal'].removeAttribute('pattern');
		this.form.elements['octal'].setAttribute('disabled','disabled');
		this.form.elements['octal'].value='';
		this.form.elements['bin'].removeAttribute('pattern');
		this.form.elements['bin'].setAttribute('disabled','disabled');
		this.form.elements['bin'].value='';
	}
};

/* IPC */
Application.prototype.handleMessage = function(event) {
	if(event.data instanceof ArrayBuffer) {
		this.fileName=event.origin.replace(/https?:\/\/([^:\/]+)(?:.*)/,'$1')+'.bin';
		this.fileMime='application/octet-binary';
		this.loadBuffer(event.data);
	}
};

/* Utils */
Application.prototype.toFixedString = function(num,base,n) {
	var s=num.toString(base);
	while(s.length<n) {
		s='0'+s;
	}
	return s;
};

new Application();


},{"commandor":1}]},{},[2])
;