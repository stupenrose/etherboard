define(["backbone", "view/BoardItemView"], function (Backbone, BoardItemView) {
    var BoardView = Backbone.View.extend({
        id: "board",
        initialize: function () {
            this.listenTo(this.model, "change", this.render);
        },
        render: function () {
            var that = this;
            this.$el.empty();

            this.$el.css("width", "2000px");
            this.$el.append("<div id='title' class='header'><a href='#'>Etherboard:</a>" + this.model.get("name") + "</div>");

            this.buttons = $("<div class='buttons'/>").appendTo(this.$el);

            this.buttons.append("<button id='newStickyButton'>New Sticky</button>");
            this.buttons.append("<button id='newBucketButton'>New Bucket</button>");
            this.buttons.append("<button id='newImageButton'>New Image</button>");

            this.$("button").button();

            this.model.get("objects").forEach(function (boardItem) {
                var boardItemView = new BoardItemView({model: boardItem, boardName: that.boardName});
                that.$el.append(boardItemView.el);
            });

        }
    });

    return BoardView;
});
