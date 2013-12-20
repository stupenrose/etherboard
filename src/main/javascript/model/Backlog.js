define(["backbone", "collection/BacklogItems"], function (Backbone, BacklogItems) {
    var Backlog = Backbone.Model.extend({
        defaults: {
            "id": "",
            "name": "" ,
            "objects": []
        },
        url: function () {
            return "/backlog/" + this.get("id");
        },
        parse: function (response) {
            response.objects = new BackLogItems(response.objects, {backlogName: this.get("name")});
            return response;
        }
    });

    return Backlog;
});
