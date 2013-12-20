define(["backbone", "jquery-ui", ], function (Backbone, $) {
    var boardSelection = $('<h1>Boards</h1><ul class="boardList">');
    var BoardSelectionView = Backbone.View.extend({

        //template: _.template(BoardSelectionTemplate),
        initialize: function (options) {
            var that = this;

            $.getJSON("/board", function (boards) {
                that.boardNames = boards;
                that.render();
            });
        },
        render: function () {
            this.$el.html(boardSelection({boardNames: this.boardNames}));
            this.$("#createNewBoardButton").button();
            return this;
        }
    });

    return BoardSelectionView;
});
