define(["backbone", "underscore", "jquery-ui", "text!../html/BoardSelectionView.html"], function (Backbone, _, $, BoardSelectionTemplate) {
    var BoardSelectionView = Backbone.View.extend({
        template: _.template(BoardSelectionTemplate),
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
        }
    });

    return BoardSelectionView;
});
