define(["backbone", "text!html/ManageColumnsView.html", "model/BoardItem", "text!html/Column.html", "view/ColumnView", "jquery"],
    function (Backbone, ManageColumnsViewTemplate, BoardItem, ColumnTemplate, ColumnView, $)  {
   var ManageColumnsView = Backbone.View.extend({
       template: _.template(ManageColumnsViewTemplate),
       initialize: function () {
           this.render();

           $(".existingColumns").sortable();

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
           this.collection.remove(model);

           this.collection.each(function (model, index) {
               var ordinal = index;
               if (index >= position)
                   ordinal += 1;
               model.set('ordinal', ordinal);
           });

           model.set('ordinal', position);
           this.collection.add(model, {at: position});

           this.render();
       }
   });

   return ManageColumnsView;
});