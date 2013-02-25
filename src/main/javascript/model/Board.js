define(["backbone", "model/BoardItem", "collection/BoardItems", "WebSocketClient"], function (Backbone, BoardItem, BoardItems, WebSocketClient) {
    var Board = Backbone.Model.extend({
        defaults: {
            boardUpdatesWebSocket: "",
            id_sequence: 0,
            name: "",
            type: "simple"
        },
        url: function () {
            return "/board/" + this.get("name") + "/objects";
        },
        parse: function (response) {
            var that = this;

            this.webSocketClient = WebSocketClient(response.boardUpdatesWebSocket, {
                onMessage: function (e) {
                    var msg = JSON.parse(e.data),
                        updateType = msg.type,
                        boardItemId = msg.widgetId ? msg.widgetId.replace(/^(widget|bucket)/, "") : undefined,
                        oldBoardItem = boardItemId ? that.get("objects").get(boardItemId) : undefined,
                        newBoardItem = boardItemId ? undefined : new BoardItem(msg.object, {boardName: that.get("name")});

                    switch (updateType) {
                    case "positionChange":
                        oldBoardItem.moveTo(msg.position, {silent: true});
                        break;

                    case "newSticky":
                    case "newBucket":
                    case "newImage":
                        that.get("objects").add(newBoardItem, {silent: true});
                        that.trigger("add", newBoardItem);
                        break;

                    case "addBucketItem":
                        oldBoardItem.pushContent(msg.itemContents, {silent: true});
                        oldBoardItem.trigger("rename", oldBoardItem, msg.content);
                        break;

                    case "removeBucketItem":
                        oldBoardItem.removeContentMatching(msg.content, {silent: true});
                        oldBoardItem.trigger("rename", oldBoardItem, msg.content);
                        break;

                    case "deleteWidget":
                        oldBoardItem.trigger("destroy", oldBoardItem, oldBoardItem.collection, {silent: true});
                        break;

                    case "stickyContentChanged":
                    case "bucketContentChanged":
                        oldBoardItem.set({name: msg.content, extraNotes: msg.extraNotes}, {silent: true});
                        oldBoardItem.trigger("rename", oldBoardItem, msg.content);
                        break;

                    default:
                        console.log("??? unknown message type: |" + updateType + "| ???");
                        break;
                    }
                }
            });

            response.objects = new BoardItems(response.objects, {boardName: this.get("name")});

            response.objects.bind("add", function (newBoardItem) {
                that.trigger("add", newBoardItem);    //bubble the add event so that BoardView can create a BoardItemView for it

                var msg = { type: newBoardItem.get("kind"), object: newBoardItem.attributes };
                
                if (msg.type === "sticky") {
                    msg.type = "newSticky";
                } else if (msg.type === "bucket") {
                    msg.type = "newBucket";
                } else if (msg.type === "image") {
                    msg.type = "newImage";
                } else {
                    throw "Invalid boardItem type: " + msg.type;
                }

                that.webSocketClient.send(JSON.stringify(msg));
            });

            response.objects.bind("remove", function (oldBoardItem) {
                that.webSocketClient.send(JSON.stringify({type: "deleteWidget", widgetId: oldBoardItem.getWidgetId()}));
            });

            response.objects.bind("change", function (boardItem) {
                var msg = {};

                if (boardItem.changed.pos) {
                    msg.type = "positionChange";
                    msg.widgetId = boardItem.getWidgetId();
                    msg.position = boardItem.changed.pos;

                    that.webSocketClient.send(JSON.stringify(msg));
                } else if (boardItem.changed.contents) {
                    var removedItem = _.difference(boardItem.previous("contents"), boardItem.changed.contents);
                    var newItem = _.difference(boardItem.changed.contents, boardItem.previous("contents"));
                    msg.widgetId = boardItem.getWidgetId();
                    

                    if (removedItem.length) {
                        msg.type = "removeBucketItem";
                        msg.content = removedItem[0];
                    } else {
                        msg.type = "addBucketItem";
                        msg.itemContents = newItem[0];
                    }

                    that.webSocketClient.send(JSON.stringify(msg));
                } else {
                    console.log("other: ");
                    console.dir(boardItem.changed);
                }
            });


            return response;
        }
    });

    return Board;
});
