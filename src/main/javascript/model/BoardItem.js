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
            if (this.isNew()) {
                return "/board/" + this.boardName + "/objects";
            }

            return "/board/" + this.boardName + "/objects/" + this.get("id");
        },
        pushContent: function (newContent, options) {
            var newContents = _.clone(this.get("contents"));
            newContents.push(newContent);

            this.set({contents: newContents}, options);
        },
        removeContentMatching: function (similarItem, options) {
            var contentToRemove = _.findWhere(this.get("contents"), similarItem),
                newContents = _.reject(this.get("contents"), function (value) {
                    for (var key in similarItem) {
                        if (similarItem[key] !== value[key]) return false;
                    }
                    return true;
                });

            this.set({contents: newContents}, options);
            return contentToRemove;
        },
        removeContentById: function (idToRemove) {
            return this.removeContentMatching({id: idToRemove});
        },
        moveTo: function (newPosition, options) {
            this.set({pos: newPosition}, options);

            if(options.silent) {
                this.trigger("move", this, newPosition);
            }
        },
        getWidgetId: function () {
            var type = this.get("kind");

            if (type !== "bucket") {
                type = "widget";
            }

            return type + this.get("id");
        }
    });

    return BoardItem;
});
