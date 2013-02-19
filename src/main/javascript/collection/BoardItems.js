define(["backbone", "model/Sticky", "model/Column", "model/Bucket"], function (Backbone, Sticky, Column, Bucket) {
    var BoardItems = Backbone.Collection.extend({
        model: function (attr, options) {
            switch (attr.kind) {
            case "sticky":
                return new Sticky(attr, options);
            case "column":
                return new Column(attr, options);
            case "bucket":
                return new Bucket(attr, options);
            default:
                return new Backbone.Model();
            }
        }
    });

    return BoardItems;
});
