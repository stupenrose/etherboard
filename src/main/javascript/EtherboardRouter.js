require.config({
    baseUrl: "/javascript",
    paths: {
        "backbone": "lib/backbone-min",
        "underscore": "lib/underscore-min",
        "jquery": "lib/jquery-1.9.1.min",
        "text": "lib/text"
    },
    shim: {
        "backbone": {
            deps: ["underscore", "jquery"],
            exports: "Backbone"
        },
        "underscore": {
            exports: "_"
        },
        "jquery": {
            exports: "$"
        }
    }
});

define(["backbone", "model/Board"], function (Backbone, Board) {
    new (Backbone.Router.extend({
        routes: {
            "*action": "testRoute"
        },
        testRoute: function (action) {
            var board = new Board({name: action});
            board.fetch();
            console.dir(board);

            window.b = board;
        }
    }))();

    Backbone.history.start();
});
