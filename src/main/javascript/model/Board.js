define(["backbone", "collection/BoardItems"], function (Backbone, BoardItems) {
    var Board = Backbone.Model.extend({
        defaults: {
            boardUpdatesWebSocket: "",
            id_sequence: 0,
            name: "",
            objects: new BoardItems(),
            type: "simple"
        },
        url: function () {
            return "/board/" + this.get("name") + "/objects";
        },
        parse: function (response) {
            response.objects = new BoardItems(response.objects, {boardName: this.get("name")});
            return response;
        }
    });

    return Board;
});
