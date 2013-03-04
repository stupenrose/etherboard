define(["backbone"], function (Backbone) {
    var Column = Backbone.Model.extend({
        defaults: {
            name: "",
            extraNotes: "",
            height: 30,
            width: 50,
            pos: { left: 0, top: 0 },
            kind: "column"
        },
        initialize: function (attributes, options) {
            if (!options || !options.boardName) {
                throw "Must specify boardName";
            }

            this.boardName = options.boardName;
        },
        url: function () {
            return "/board/" + this.boardName + "/objects/" + this.get("id");
        }
    });

    return Column;
});
