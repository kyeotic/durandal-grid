require.config({
    paths: {
        'text': '../lib/require/text',
        'durandal':'../lib/durandal/js',
        'plugins' : '../lib/durandal/js/plugins',
        'transitions' : '../lib/durandal/js/transitions',
        'knockout': '../lib/knockout-3.1.0',
        'bootstrap': '//netdna.bootstrapcdn.com/bootstrap/3.0.3/js/bootstrap.min.js',
        'jquery': '//code.jquery.com/jquery-1.10.2.min',
        'Q' : '../lib/q.min'
    },
    shim: {
        'bootstrap': {
            deps: ['jquery'],
            exports: 'jQuery'
        }
    },
    waitSeconds: 30
});

define(['durandal/system', 'durandal/app', 'durandal/viewLocator'],
function(system, app, viewLocator) {

    //>>excludeStart("build", true);
    system.debug(true);
    //>>excludeEnd("build");  

    //specify which plugins to install and their configuration
    app.configurePlugins({

        //Durandal plugins
        router:true,
        dialog: true,
        widget: {
            kinds: ['grid']
        }
    });

    app.title = 'Durandal Grid Widget';
    app.start().then(function () {
        //Replace 'viewmodels' in the moduleId with 'views' to locate the view.
        //Look for partial views in a 'views' folder in the root.
        //viewLocator.useConvention();
        
        //Show the app by setting the root view model for our application with a transition.
        app.setRoot('shell/shell');
    });
});