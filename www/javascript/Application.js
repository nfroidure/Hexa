// MIDIPlayer : Play a MIDIFile instance

// AMD + global + NodeJS : You can use this object by inserting a script
// or using an AMD loader (like RequireJS) or using NodeJS
(function(root,define){ define(['./libs/commandor/Commandor'],
	function(Commandor) {
// START: Module logic start

	function Application() {
		this.root=document.querySelector('.app');
		this.cmdMgr=new Commandor(this.root);
		this.sndMgr=new Sounds('sounds');
		var view=document.getElementById('Home');
		view.classList.add('selected');
		// menu
		new ViewPromise(this,'Home').then(function() {
			throw Error('Application unexpectly ended !');
		},function(error) {
			throw error;
		});
	}

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
