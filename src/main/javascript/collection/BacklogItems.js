define(["backbone", "model/BacklogItem"], function (Backbone, BacklogItem) {
    var BacklogItems = Backbone.Collection.extend({
        model: BacklogItem
    });

    return BacklogItems;
});
