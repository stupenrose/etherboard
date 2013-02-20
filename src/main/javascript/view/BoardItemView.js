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
        events: {
            "click .avatarDeleteButton,.stickyCloseButton": "destroy",
            "click .stickyFlipButton": "flip",
            "click .stickyEditButton": "edit",
            "click .remove": "removeBucketContent"
        },
        initialize: function () {
            this.listenTo(this.model, "change", this.render);
            this.listenTo(this.model, "destroy", this.remove);
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

            this.$el.prop("boardItemId", this.model.get("id"));

            return this;
        },
        renderBucket: function () {
            var that = this;

            this.$el.html(this.bucketTmpl(this.model.toJSON()));
            this.$el.css(this.model.get("pos"));
            this.$el.css("position", "absolute");
            this.$el.css("width", this.model.get("width"));
            this.$el.css("height", this.model.get("height"));

            this.$el.draggable({
                containment: [0, 0, Infinity, Infinity],
                /*drag: function (event, ui) {
                    var msg = {
                        type: "positionChange",
                        widgetId: bucketId,
                        position: widget.offset()
                    };
                    webSocketClient.send(JSON.stringify(msg));
                },*/
                stop: function (event, ui) {
                    event.stopPropagation();
                    that.model.set("pos", $(this).offset());
                    that.model.save();
                }
            })
            .droppable({
                drop: function (event, ui) {
                    var sticky = $(ui.draggable),
                        stickyObject = that.model.collection.get(sticky.prop("boardItemId"));

                    event.stopPropagation();

                    if (stickyObject.get("kind") === "sticky") {
                        stickyObject.destroy();
                        that.model.pushContent({name: stickyObject.get("name"), extraNotes: stickyObject.get("extraNotes")});

                        /*webSocketClient.send(JSON.stringify({
                            type: 'addBucketItem',
                            widgetId: bucketId,
                            itemContents: {name: sticky.find(".stickyContent").html(), extraNotes:  sticky.find(".extraNotes").html()}
                        }));*/

                        that.model.save();
                    }
                }
            })
            .resizable({
                minHeight: 150,
                minWidth: 150,
                stop: function (event, ui) {
                    that.$(".stickyHeader").width(that.$el.width() + 4);

                    that.model.set({width: that.$el.width()}, {silent: true});
                    that.model.set({height: that.$el.height()}, {silent: true});
                    that.model.save();
                }
            });
        },
        renderColumn: function () {
            this.$el.html(this.columnTmpl(this.model.toJSON()));
        },
        renderAvatar: function () {
            var that = this;

            this.$el.html(this.avatarTmpl(this.model.toJSON()));
            this.$el.css(this.model.get("pos"));
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
            var that = this;

            this.$el.html(this.stickyTmpl(this.model.toJSON()));
            this.$el.css(this.model.get("pos"));
            this.$el.css("position", "absolute");
            this.$el.css("width", this.model.get("width"));
            this.$el.css("height", this.model.get("height"));

            this.$el.draggable({
                containment: [0, 0, Infinity, Infinity],
                /*drag: function (event, ui) {
                    var msg = {
                        type: "positionChange",
                        widgetId: widgetId,
                        position: widget.offset()
                    };
                    webSocketClient.send(JSON.stringify(msg));
                },*/
                stop: function (event, ui) {
                    event.stopPropagation();
                    that.model.set("pos", $(this).offset());
                    that.model.save();
                }
            });

        },
        destroy: function () {
            if (confirm("DELETE is permanent! :(")) {
                this.model.destroy();
                this.remove();
            }
        },
        flip: function () {
            this.$el.toggleClass("flip");
        },
        edit: function () {
            console.log("edit called!");
        },
        removeBucketContent: function () {
            console.log("remove sticky from bucket!");
        }
    });
    
    return BoardItemView;
});
