define(["backbone", "jquery-ui", "text!html/CreateBoardView.html"], function (Backbone, $, CreateBoardTemplate) {
    var CreateBoardView = Backbone.View.extend({
        template: _.template(CreateBoardTemplate),
        initialize: function () {
            this.render();
        },
        tagName: "form",
        id: "newBoardForm",
        events: {
            "change select": "changeType",
            "submit": "onSubmit"
        },
        changeType: function (e) {
            var newType = $(e.target).val();

            this.$("#pivotalOptions").toggle();

            if (newType === "simple") {
                this.$("#pivotalOptions > input").attr("disabled", "disabled");
            } else {
                this.$("#pivotalOptions > input").removeAttr("disabled");
            }
        },
        onSubmit: function (e) {
            e.preventDefault();

            var boardName = this.$("#newBoardName").val(),
                that = this;

            $.post("/board", this.$el.serialize(), function () {
                window.location = "#" + boardName;
                that.$el.dialog("close");
            });

            return false;
        },
        render: function () {
            var that = this;

            this.$el.html(this.template());

            this.$el.dialog({
                closeOnEscape: true,
                title: "Create New Board",
                close: function () {
                    that.remove();
                }
            });
        }
    });

    return CreateBoardView;
});
