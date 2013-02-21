define(["backbone", "collection/BoardItems"], function (Backbone, BoardItems) {
    var Board = Backbone.Model.extend({
        defaults: {
            boardUpdatesWebSocket: "",
            id_sequence: 0,
            name: "",
            type: "simple"
        },
        url: function () {
            return "/board/" + this.get("name") + "/objects";
        },
        parse: function (response) {
            var that = this;
            response.objects = new BoardItems(response.objects, {boardName: this.get("name")});

            response.objects.bind("add", function (newBoardItem) {
                that.trigger("add", newBoardItem);
            });

            response.objects.bind("change", function (newBoardItem) {
                console.dir(arguments);
            });

            return response;
        }
    });

    return Board;
});
