// MIDIPlayer : Play a MIDIFile instance

// AMD + global + NodeJS : You can use this object by inserting a script
// or using an AMD loader (like RequireJS) or using NodeJS
(function(root,define){ define(['./libs/commandor/Commandor'],
	function(Commandor) {
// START: Module logic start

	var BYTES_PER_LINE=16,
		LINES_PER_PAGE=16;

	function Application() {
		// Properties
		this.fileName='newfile.bin'
		this.dataView=null;
		this.page=0;
		this.index=0;
		// Registering ui elements
		this.filePicker=document.querySelector('input[type="file"]');
		this.form=document.querySelector('form');
		// Regsitering events
	  this.filePicker.addEventListener('change', function(event){
			if(event.target.files.length)
		  	this.readFile(event.target.files[0]);
	  }.bind(this));
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
		this.cmdMgr.suscribe('open',this.pickFile.bind(this));
		this.cmdMgr.suscribe('select',this.select.bind(this));
		// Starting
		this.loadBuffer();
	}

	/* Command functions */

	Application.prototype.pickFile = function() {
		this.filePicker.click();
	};

	Application.prototype.select = function(event, params) {
		if(this.selected) {
			this.selected.removeAttribute('class');
		}
		this.selected=event.target;
		this.selected.setAttribute('class','selected');
		this.drawForm((params&&params.index)||0)
	};

	/* Internals functions */

	Application.prototype.readFile = function(file) {
		var reader = new FileReader();
		reader.readAsArrayBuffer(file);
		reader.onloadend=(function(event) {
			this.loadBuffer(event.target.result);
 		}).bind(this);
	};

	Application.prototype.loadBuffer = function(buffer) {
		if(!buffer)
			buffer=new ArrayBuffer(32);
		this.dataView=new DataView(buffer);
		this.drawPage(0);
		this.drawForm(0);
	};

	/* Display functions */

	Application.prototype.drawPage = function(page) {
		this.page=page||0;
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
			th.innerHTML=(i*BYTES_PER_LINE).toString(16);
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
					charValue=(this.dataView.getUint8(k)>31?String.fromCharCode(charCode):'.');
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
	};

	Application.prototype.drawForm = function(index) {
		this.index=index||0;
		var littleendian=this.form.elements['littleendian'].checked;
		this.form.elements['uint8'].value=this.dataView.getUint8(this.index);
		this.form.elements['int8'].value=this.dataView.getInt8(this.index);
		this.form.elements['uint16'].value=this.dataView.getUint16(this.index,littleendian);
		this.form.elements['int16'].value=this.dataView.getInt16(this.index,littleendian);
		this.form.elements['uint32'].value=this.dataView.getUint32(this.index,littleendian);
		this.form.elements['int32'].value=this.dataView.getInt32(this.index,littleendian);
		//this.form.elements['uint64'].value=this.dataView.getUint64(this.index);
		//this.form.elements['int64'].value=this.dataView.getInt64(this.index);
		this.form.elements['hex'].value=this.toFixedString(this.dataView.getUint8(this.index),16,2);
		this.form.elements['hex'].value=this.toFixedString(this.dataView.getUint8(this.index),16,2);
		this.form.elements['octal'].value=this.toFixedString(this.dataView.getUint8(this.index),8,4);
		this.form.elements['bin'].value=this.toFixedString(this.dataView.getUint8(this.index),2,8);
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

// END: Module logic end

	return Application;

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
			factory=deps; deps=name;
		}
		this.Application=factory.apply(this, deps.map(function(dep){
			return root[dep.substring(dep.lastIndexOf('/')+1)];
		}));
	}.bind(this)
	)
);
