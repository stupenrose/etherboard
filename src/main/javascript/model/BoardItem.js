define(["backbone"], function (Backbone) {
    var BoardItem = Backbone.Model.extend({
        defaults: {
            contents: [],
            name: "",
            extraNotes: "",
            height: 150,
            width: 150,
            pos: { left: 0, top: 0 },
            kind: "sticky"
        },
        initialize: function (attributes, options) {
            if (!options || !options.boardName) {
                throw "Must specify boardName";
            }
            this.boardName = options.boardName;
        },
        url: function () {
            if(this.isNew()) {
                return "/board/" + this.boardName + "/objects";
            }

            return "/board/" + this.boardName + "/objects/" + this.get("id");
        },
        pushContent: function (newContent) {
            var newContents = _.clone(this.get("contents"));
            newContents.push(newContent);

            this.set("contents", newContents);
        },
        removeContentById: function (idToRemove) {
            var contentToRemove = _.findWhere(this.get("contents"), {id: idToRemove});
            var newContents = _.filter(this.get("contents"), function (c) {
                return c.id != idToRemove;
            });

            this.set("contents", newContents);

            return contentToRemove;
        }
    });

    return BoardItem;
});
