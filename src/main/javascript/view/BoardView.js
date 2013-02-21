define(["backbone", "view/BoardItemView", "view/CreateItemView"], function (Backbone, BoardItemView, CreateItemView) {
    var BoardView = Backbone.View.extend({
        id: "board",
        initialize: function () {
            this.listenTo(this.model, "sync", this.render);
            this.listenTo(this.model, "add", this.add);
        },
        events: {
            "click .createButton": "createItem"
        },
        add: function (boardItem) {
            var boardItemView = new BoardItemView({model: boardItem});
            this.$el.append(boardItemView.el);
        },
        render: function () {
            var that = this;
            this.$el.empty();

            this.$el.css("width", "2000px");
            this.$el.append("<div id='title' class='header'><a href='#'>Etherboard:</a>" + this.model.get("name") + "</div>");

            this.buttons = $("<div class='buttons'/>").appendTo(this.$el);
            $("<button id='newStickyButton' class='createButton'>New Item</button>").button().appendTo(this.buttons);

            //this.buttons.append("<button id='newStickyButton'>New Sticky</button>");
            //this.buttons.append("<button id='newBucketButton'>New Bucket</button>");
            //this.buttons.append("<button id='newImageButton'>New Image</button>");
            //this.$("button").button();

            this.model.get("objects").forEach(function (boardItem) {
                var boardItemView = new BoardItemView({model: boardItem});
                that.$el.append(boardItemView.el);
            });
        },
        createItem: function () {
            window.civ = new CreateItemView({boardItems: this.model.get("objects"), boardName: this.model.get("name")});
        }
    });

    return BoardView;
});
