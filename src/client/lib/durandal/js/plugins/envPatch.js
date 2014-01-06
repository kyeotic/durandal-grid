define(['durandal/app', 'durandal/system'], function(app, system) {
	return {
		install: function() {
			app.log = system.log;
	    	app.guid = system.guid;
		}
	}
})