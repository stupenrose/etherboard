require.config({
    baseUrl: "/javascript",
    paths: {
        "backbone": "lib/backbone-min",
        "underscore": "lib/underscore-min",
        "jquery": "lib/jquery-1.9.1.min",
        "jquery-ui": "http://ajax.googleapis.com/ajax/libs/jqueryui/1.9.1/jquery-ui.min",
        "html": "../html",
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
        },
        "jquery-ui": {
            deps: ["jquery"],
            exports: "$"
        }
    }
});

define(["backbone", "jquery-ui", "model/Board", "view/BoardSelectionView", "view/BoardView"], function (Backbone, $, Board, BoardSelectionView, BoardView) {
    new (Backbone.Router.extend({
        routes: {
            "": "defaultRoute",
            ":boardName": "showBoard"
        },
        initialize: function () {
            this.view = new Backbone.View();
        },
        defaultRoute: function () {
            this.view.remove();
            this.view = new BoardSelectionView();
            $("body").append(this.view.el);
        },
        showBoard: function (boardName) {
            this.view.remove();

            var board = new Board({name: boardName});
            this.view = new BoardView({model: board, boardName: boardName});
            $("body").append(this.view.el);
            board.fetch();
        }
    }))();

    Backbone.history.start();
});
