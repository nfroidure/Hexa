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
  console.log(event);
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

