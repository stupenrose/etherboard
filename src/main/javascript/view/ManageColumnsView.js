define(["backbone", "text!html/ManageColumnsView.html", "model/BoardItem", "text!html/Column.html", "view/ColumnView", "jquery"],
    function (Backbone, ManageColumnsViewTemplate, BoardItem, ColumnTemplate, ColumnView, $)  {
   var ManageColumnsView = Backbone.View.extend({
       template: _.template(ManageColumnsViewTemplate),
       initialize: function () {
           this.render();
           $(".existingColumns").sortable({
               update: function(event, ui) {
                   console.log(ui.item.index());
               }
           });

           this.boardItems = this.options.boardItems;
           this.boardName = this.options.boardName;
       },
       events: {
           'update-sort': 'updateSort'
       },
       render: function () {
           var that = this;


           that.dialog = this.$el.html(this.template()).dialog({
               closeOnEscape: true,
               title: "Manage Columns",
               close: function () {
                   that.trigger('closeView');
                   that.remove();
               }
           });

           _.each(this.options.boardItems.models, function(boardItem) {
               var kind = boardItem.get("kind");
               switch(kind) {
                   case "column": that.renderColumn(boardItem);
                                  break;
               }
           });
       },
       renderColumn: function(boardItem) {
           var view = new ColumnView({model: boardItem});

           $(".existingColumns").append(view.render().el);
       },
       updateSort: function(event, model, position) {
           console.log("Sortable update");
           this.render();
       },
       swap: function(b){
           console.dir(b);
           console.log("And");
          /* b = jQuery(b)[0];
           var a = this[0];
           var t = a.parentNode.insertBefore(document.createTextNode(''), a);
           console.dir(t);
           b.parentNode.insertBefore(a, b);
           t.parentNode.insertBefore(b, t);
           t.parentNode.removeChild(t);*/
           return this;
       }
   });

   return ManageColumnsView;
});