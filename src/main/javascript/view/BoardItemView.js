define([ "backbone",
    "text!html/Bucket.html",
    "text!html/Column.html",
    "text!html/Avatar.html",
    "text!html/Sticky.html"],
    function (Backbone, BucketTemplate, ColumnTemplate, AvatarTemplate, StickyTemplate) {

    var BoardItemView = Backbone.View.extend({
        bucketTmpl: _.template(BucketTemplate),
        columnTmpl: _.template(ColumnTemplate),
        avatarTmpl: _.template(AvatarTemplate),
        stickyTmpl: _.template(StickyTemplate),
        className: function () {
            return this.model.get("kind").replace("image", "avatar");
        },
        initialize: function () {
            this.listenTo(this.model, "change", this.render);
            this.render();
        },
        render: function () {
            var kind = this.model.get("kind");

            switch (kind) {
                case "bucket": this.renderBucket(); break;
                case "column": this.renderColumn(); break;
                case "image": this.renderAvatar(); break;
                case "sticky": this.renderSticky(); break;
                default: console.log("Invalid BoardItem.kind: " + kind); break;
            }

            return this;
        },
        renderBucket: function () {
            this.$el.html(this.bucketTmpl(this.model.toJSON()));
            this.$el.css("top", this.model.get("pos").top);
            this.$el.css("left", this.model.get("pos").left);
            this.$el.css("width", this.model.get("width"));
            this.$el.css("height", this.model.get("height"));
        },
        renderColumn: function () {
            this.$el.html(this.columnTmpl(this.model.toJSON()));
        },
        renderAvatar: function () {
            var that = this;

            this.$el.html(this.avatarTmpl(this.model.toJSON()));
            this.$el.css("top", this.model.get("pos").top);
            this.$el.css("left", this.model.get("pos").left);
            this.$el.css("position", "absolute");

            this.bar = this.$(".avatarHeader");

            this.$el.hover(
                function () {
                    that.bar.stop(true, true).delay(3000).fadeTo(300, 1);
                },
                function () {
                    that.bar.stop(true, false).fadeTo(100, 0);
                });
            
            this.$el.draggable({
                containment: [0, 0, Infinity, Infinity],
                /*drag: function (event, ui) {
                    var msg = {
                        type: "positionChange",
                        widgetId: "widget" + that.model.get("id"),
                        position: $(this).offset()
                    };
                    webSocketClient.send(JSON.stringify(msg));
                },*/
                stop: function (event) {
                    event.stopPropagation();
                    that.model.set("pos", $(this).offset());
                    that.model.save();
                }
            });
        },
        renderSticky: function () {
            this.$el.html(this.stickyTmpl(this.model.toJSON()));
            this.$el.css("top", this.model.get("pos").top);
            this.$el.css("left", this.model.get("pos").left);
            this.$el.css("width", this.model.get("width"));
            this.$el.css("height", this.model.get("height"));
        }
    });
    
    return BoardItemView;
});
