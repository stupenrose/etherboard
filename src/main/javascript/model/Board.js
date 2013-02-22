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
            response.objects = new BoardItems(response.objects, {boardName: this.get("name")});

            response.objects.bind("add", function (newBoardItem) {
                that.trigger("add", newBoardItem);
            });

            response.objects.bind("change", function (newBoardItem) {
                // TODO: send websocket events here
            });

            WebSocketClient(response.boardUpdatesWebSocket, {
                onMessage: function (e) {
                    var msg = JSON.parse(e.data),
                        updateType = msg.type,
                        boardItemId = msg.widgetId ? msg.widgetId.replace(/^(widget|bucket)/, "") : undefined,
                        oldBoardItem = boardItemId ? that.get("objects").get(boardItemId) : undefined,
                        newBoardItem = boardItemId ? undefined : new BoardItem(msg.object, {boardName: that.get("name")});

                    switch (updateType) {
                    case "positionChange":
                        oldBoardItem.moveTo(msg.position);
                        break;

                    case "newSticky":
                    case "newBucket":
                    case "newImage":
                        newBoardItem.save();
                        that.get("objects").add(newBoardItem);
                        break;

                    case "addBucketItem":
                        oldBoardItem.pushContent(msg.itemContents);
                        break;

                    case "removeBucketItem":
                        oldBoardItem.removeContentMatching(msg.content);
                        break;

                    case "deleteWidget":
                        oldBoardItem.trigger("destroy", oldBoardItem, oldBoardItem.collection);
                        break;

                    case "stickyContentChanged":
                    case "bucketContentChanged":
                        msg.name = msg.content;
                        oldBoardItem.set(msg);
                        break;

                    default:
                        console.log("??? unknown message type: |" + updateType + "| ???");
                        break;
                    }
                }
            });

            return response;
        }
    });

    return Board;
});
