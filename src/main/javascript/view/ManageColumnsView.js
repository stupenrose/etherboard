define(["backbone", "text!html/ManageColumnsView.html", "model/BoardItem", "text!html/Column.html", "view/ColumnView", "jquery"],
    function (Backbone, ManageColumnsViewTemplate, BoardItem, ColumnTemplate, ColumnView, $)  {
   var boardItems = [],
       oldIndex,
       ManageColumnsView = Backbone.View.extend({
       template: _.template(ManageColumnsViewTemplate),
       initialize: function () {
           var that = this;
           this.render();
           $(".existingColumns").sortable({
               start: function(event, ui) {
                   oldIndex = ui.item.index();
               },
               update: function(event, ui) {
                   if(ui.item.index() !== oldIndex) {
                       that.rearrange(oldIndex, ui.item.index());
                   }
                   console.log(ui.item.index());
               }
           });

           //this.boardItems = this.options.boardItems;
           this.boardName = this.options.boardName;
       },
       rearrange: function(oldIndex, newIndex) {
           console.log(oldIndex + " " + newIndex);
           if(oldIndex < newIndex) {
               while(oldIndex !== newIndex) {
                   var current = boardItems[oldIndex];
                   var nextName = current.model.get("name");
                   var next = boardItems[++oldIndex];
                   current.model.set("name", next.model.get("name"));
                   next.model.set("name", nextName);
               }
           } else {
               while(oldIndex > newIndex) {
                   var current = boardItems[oldIndex];
                   var nextName = current.model.get("name");
                   var next = boardItems[--oldIndex];
                   current.model.set("name", next.model.get("name"));
                   next.model.set("name", nextName);
               }
           }

           _.each(boardItems, function(item){
               item.model.save();
           });
           this.trigger('closeView');
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

           console.dir(boardItems);
       },
       renderColumn: function(boardItem) {
           var view = new ColumnView({model: boardItem});
           boardItems.push(view);
           $(".existingColumns").append(view.render().el);
       }
   });

   return ManageColumnsView;
});