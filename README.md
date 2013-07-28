Hexa
============

Hexa is a project intended to provide a client side Web based hexadecimal editor.

You can test it there : http://hexa.insertafter.com

Debugging buffers
-------
Do not forget to unblock/allow popups.
```js
var hexa=window.open('http://hexa.insertafter.com');
// Debug TypedArrays/DataViews
hexa.postMessage(typedArray.buffer,'*');
// Debug files
var file; // Your blob
var reader = new FileReader();
reader.readAsArrayBuffer(file);
reader.onloadend=function(event) {
	hexa.postMessage(event.target.result,'*');
};

```
Transferable object are not accessible anymore once transfered. To avoid this, user :
```js
buffer.slice(0); // not available on IE 10
```

License
-------
Copyright Nicolas Froidure 2013. MIT licence.
