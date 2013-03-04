define(["backbone", "model/BoardItem", "text!html/CreateItemView.html"], function (Backbone, BoardItem, CreateItemViewTemplate) {
    var CreateItemView = Backbone.View.extend({
        template: _.template(CreateItemViewTemplate),
        initialize: function (options) {
            this.render();

            this.boardItems = options.boardItems;
            this.boardName = options.boardName;
        },
        tagName: "form",
        className: "newBoardItemForm",
        events: {
            "change select": "selectType",
            "submit": "onSubmit"
        },
        selectType: function (e) {
            this.$(".itemOptions").hide();
            this.$("." + e.target.value + "Options").show();
        },
        onSubmit: function (e) {
            e.preventDefault();

            var newItem = {
                    kind: this.$("select").val(),
                    name: this.$("*[name='name']:visible").val(),
                    extraNotes: this.$("*[name='extraNotes']:visible").val()
                },
                boardItem = new BoardItem(newItem, {boardName: this.boardName}),
                that = this;

            boardItem.save(newItem, {
                success: function () {
                    that.boardItems.add(boardItem);
                    that.$el.dialog("close");
                }
            });


            return false;
        },
        render: function () {
            var that = this;
            console.log(this.boardName);
            that.dialog = this.$el.html(this.template()).dialog({
                closeOnEscape: true,
                title: "Create New Board Item",
                close: function () {
                    that.remove();
                }
            });
        }
    });

    return CreateItemView;
});
