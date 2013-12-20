define(["backbone", "model/BacklogSelectItem"], function (Backbone, BacklogSelectItem) {
    var BacklogSelectItems = Backbone.Collection.extend({
        model: BacklogSelectItem
    });

    return BacklogSelectItems;
});
