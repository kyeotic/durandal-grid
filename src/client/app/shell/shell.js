define(['plugins/router', 'knockout', 'durandal/app'], 
function (router, ko, app) {
	return {
		title: app.title,
		router: router,
		activate: function() {

			router.map([
				{ route: ['','default'],	moduleId: 'examples/default',		title: 'Default',		nav: true },
				{ route: 'basic',			moduleId: 'examples/basic',			title: 'Basic',			nav: true },
				{ route: 'bare',			moduleId: 'examples/bare',			title: 'Bare',			nav: true },
				{ route: 'observable',		moduleId: 'examples/observable',	title: 'Observable',	nav: true },
				{ route: 'custom-row',		moduleId: 'examples/customRows',	title: 'Custom Rows',	nav: true }
			]).buildNavigationModel();

			return router.activate();
		}
	};
});