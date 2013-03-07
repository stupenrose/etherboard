define(["backbone", "model/Column"], function (Backbone, Column) {
    var ColumnItems = Backbone.Collection.extend({
        model: Column
    });

    return ColumnItems;
});
