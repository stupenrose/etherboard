define(["backbone", "collection/BacklogSelectItems"], function (Backbone) {
    var BacklogSelect = Backbone.Model.extend({
        defaults: {
            "id": "",
            "name": ""
        },
        url: function () {
            return "/backlog/";
        },
        parse: function (response) {
            response.objects = new BacklogSelectItems(response.objects, {seletItemName: this.get("name")});
            return response;
        }
    });

    return BacklogSelect;
});
