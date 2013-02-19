define(["backbone", "model/BoardItem"], function (Backbone, BoardItem) {
    var BoardItems = Backbone.Collection.extend({
        model: BoardItem
    });

    return BoardItems;
});
