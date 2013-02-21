define(["backbone", "underscore", "jquery-ui", "text!html/BoardSelectionView.html", "view/CreateBoardView"], function (Backbone, _, $, BoardSelectionTemplate, CreateBoardView) {
    var BoardSelectionView = Backbone.View.extend({
        template: _.template(BoardSelectionTemplate),
        events: {
            "click #createNewBoardButton": "createBoard"
        },
        initialize: function (options) {
            var that = this;

            $.getJSON("/board", function (boards) {
                that.boardNames = boards;
                that.render();
            });
        },
        render: function () {
            this.$el.html(this.template({boardNames: this.boardNames}));
            this.$("#createNewBoardButton").button();
            return this;
        },
        createBoard: function () {
            console.log("creating view...");
            new CreateBoardView();
        }
    });

    return BoardSelectionView;
});
