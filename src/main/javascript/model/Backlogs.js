define(["backbone", "collections/BacklogItems"], function (Backbone, BacklogItems) {
    var Backlogs = Backbone.Model.extend({
        defaults: {
            logs: new BacklogItems()
        },
        url: function () {
            return "/backlogs/"
        },
        parse: function (response) {
            response.logs = new BacklogItems(response.logs, {name: this.get("name")}) ;
            return response;

        }
    });

    return Backlogs;
});
