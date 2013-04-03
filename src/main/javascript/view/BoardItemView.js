define([ "backbone",
    "model/BoardItem",
    "text!html/Bucket.html",
    "text!html/Column.html",
    "text!html/Avatar.html",
    "text!html/Sticky.html",],
    function (Backbone, BoardItem, BucketTemplate, ColumnTemplate, AvatarTemplate, StickyTemplate) {
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
                this.listenTo(this.model, "change:contents move rename", this.render);
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

                console.log("rendering bucket!");

                this.$el.html(this.bucketTmpl(this.model.toJSON()));
                this.$el.css(this.model.get("pos"));
                this.$el.css("position", "absolute");
                this.$el.css("width", this.model.get("width"));
                this.$el.css("height", this.model.get("height"));

                this.$el.draggable({
                    containment: [0, 0, Infinity, Infinity],
                    drag: function (event, ui) {
                        that.model.set("pos", $(this).offset());
                    },
                    stop: function (event, ui) {
                        event.stopPropagation();
                        that.model.set("pos", $(this).offset());
                        that.model.save();
                    }
                })
                    .droppable({
                        drop: function (event, ui) {
                            event.stopPropagation();

                            var sticky = $(ui.draggable),
                                stickyObject = that.model.collection.get(sticky.prop("boardItemId"));

                            if (stickyObject.get("kind") === "sticky") {
                                that.model.pushContent(stickyObject.attributes);
                                that.model.save();
                                stickyObject.destroy();
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
                var that = this;
                this.$el.html(this.columnTmpl(this.model.toJSON()));
                this.$el.resizable({
                    animate: true,
                    animateEasing: "easeOutBounce",
                    ghost: true,
                    handles: "e",
                    minWidth: 200,
                    stop: function(event, ui) {
                        that.model.set({width: that.$el.width()}, {silent: true});
                        that.model.save();
                    }
                });
                this.$el.css("width", this.model.get("width"));
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
                drag: function (event, ui) {
                    that.model.set("pos", $(this).offset());
                },
                stop: function (event) {
                    event.stopPropagation();
                    that.model.set("pos", $(this).offset());
                    that.model.save();
                }
            });
        },
        renderSticky: function () {
            var that = this,
                bugId,

            //TODO: need to figure out a way to check if the bugzilla url exists
            bugId  = this.model.get("name").match(/\d+/);

            this.$el.html(this.stickyTmpl({name: this.model.get("name"), budId: bugId}));

            this.$el.css(this.model.get("pos"));
            this.$el.css("position", "absolute");
            this.$el.css("width", this.model.get("width"));
            this.$el.css("height", this.model.get("height"));

            this.$el.draggable({
                containment: [0, 0, Infinity, Infinity],
                drag: function (event, ui) {
                    that.model.set("pos", $(this).offset());
                },
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
        removeBucketContent: function (ev) {
            var that = this;
            var idToRemove = $(ev.target).data("boarditemid");
            var contentPoppedOut = this.model.removeContentById(idToRemove);
            var newSticky = new BoardItem(contentPoppedOut, {boardName: this.model.boardName});

            newSticky.sync("create", newSticky, {
                success: function () {
                    that.model.collection.add(newSticky);
                    that.model.save();
                }
            });
        }
    });
    
    return BoardItemView;
});
