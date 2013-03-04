define(["backbone", "text!html/ManageColumnItem.html"], function(Backbone, ColumnTemplate) {
   var  ColumnView = Backbone.View.extend({
        template: _.template(ColumnTemplate),
        initialize: function() {
            this.id = this.model.get("id");
        },
        events: {
            "click .columnItemDeleteButton": "destroyView",
            "click .columnItemEditButton": "edit",
            "keypress :input" : "doneEditing",
            'drop' : 'drop'
        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },
        destroyView: function() {
            if (confirm("DELETE is permanent! :(")) {
                this.model.fetch({type: 'DELETE'});
                this.model.destroy();
                this.remove();
            }
        },
        drop: function(event, index) {
            this.$el.trigger('update-sort', [this.model, index]);
        },
        edit: function() {
            var id = this.model.get("id");
            var currentText = $("#column"+id).text();
            $("#column"+id).hide();
            $("#edit"+id).show();
            $("#edit"+id).val(currentText);
        },
        doneEditing: function(e) {
            if(e.keyCode == 13) {
                var id = this.model.get("id");
                var currentText = $("#edit"+id).val();
                $("#column"+id).show();
                $("#column"+id).text(currentText);
                $("#edit"+id).hide();

                this.model.set("name", currentText);
                this.model.save();
            }
        }
   });

   return ColumnView;
});