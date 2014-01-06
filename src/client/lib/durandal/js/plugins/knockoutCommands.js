/*
    Taken from KoLite
    Copyright © 2012 Hans Fjällemark & John Papa

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
*/

define(['knockout', 'jquery', 'Q'], function(ko, $, Q) {

    var install = function() {
        //Command objects
        ko.command = function (options) {
            var
                self = function () {
                    return self.execute.apply(this, arguments);
                },
                canExecuteDelegate = options.canExecute,
                executeDelegate = options.execute;

            self.canExecute = ko.computed(function () {
                return canExecuteDelegate ? canExecuteDelegate() : true;
            });

            self.execute = function (arg1, arg2) {
                // Needed for anchors since they don't support the disabled state
                if (!self.canExecute()) return

                return executeDelegate.apply(this, [arg1, arg2]);
            };

            return self;
        };

        ko.promiseCommand = function (options) {
            var canExecuteDelegate = options.canExecute;
            var executeDelegate = options.execute;
            
            //Execute will be called from the binding, and so it needs to .done() its own chain
            //But direct calls need access to a chainable promise, so we make a new promise for
            //The end of the old chain, and return that
            var self = function () {
                var promise = self.execute.apply(this, arguments);
                return Q.when(promise).fail(function() {
                        console.log('An error occured with execute delegate');
                        console.log(executeDelegate);
                    });
            };

            self.isExecuting = ko.observable();

            self.canExecute = ko.computed(function () {
                return canExecuteDelegate ? canExecuteDelegate(self.isExecuting()) : !self.isExecuting();
            });

            self.execute = function (arg1, arg2) {
                // Needed for anchors since they don't support the disabled state
                if (!self.canExecute())
                    return null;

                self.isExecuting(true);

                return Q.fapply(executeDelegate, [arg1, arg2]).then(function () {
                    self.isExecuting(false);
                }).done();
            };

            return self;
        };

        //Command Bindings
        ko.utils.wrapAccessor = function (accessor) {
            return function () {
                return accessor;
            };
        };

        ko.bindingHandlers.command = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                var
                    value = valueAccessor(),
                    commands = value.execute ? { click: value } : value,

                    isBindingHandler = function (handler) {
                        return ko.bindingHandlers[handler] !== undefined;
                    },

                    initBindingHandlers = function () {
                        for (var command in commands) {
                            if (!isBindingHandler(command)) {
                                continue;
                            };

                            ko.bindingHandlers[command].init(
                                element,
                                ko.utils.wrapAccessor(commands[command].execute),
                                allBindingsAccessor,
                                viewModel
                            );
                        }
                    },

                    initEventHandlers = function () {
                        var events = {};

                        for (var command in commands) {
                            if (!isBindingHandler(command)) {
                                events[command] = commands[command].execute;
                            }
                        }

                        ko.bindingHandlers.event.init(
                            element,
                            ko.utils.wrapAccessor(events),
                            allBindingsAccessor,
                            viewModel);
                    };

                initBindingHandlers();
                initEventHandlers();
            },

            update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                var commands = valueAccessor();
                var canExecute = commands.canExecute;

                if (!canExecute) {
                    for (var command in commands) {
                        if (commands[command].canExecute) {
                            canExecute = commands[command].canExecute;
                            break;
                        }
                    }
                }

                if (!canExecute) {
                    return;
                }

                ko.bindingHandlers.enable.update(element, canExecute, allBindingsAccessor, viewModel);
            }
        };
    };

    return {
        install: install
    };
});