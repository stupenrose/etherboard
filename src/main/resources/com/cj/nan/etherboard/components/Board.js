/*jslint newcap: false*/
/*global $ console Column Avatar Bucket Issue StickyEditor alert*/

/*
 * Copyright (C) 2011, 2012 Commission Junction
 *
 * This file is part of etherboard.
 *
 * etherboard is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2, or (at your option)
 * any later version.
 *
 * etherboard is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with etherboard; see the file COPYING.  If not, write to the
 * Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA
 * 02110-1301 USA.
 *
 * Linking this library statically or dynamically with other modules is
 * making a combined work based on this library.  Thus, the terms and
 * conditions of the GNU General Public License cover the whole
 * combination.
 *
 * As a special exception, the copyright holders of this library give you
 * permission to link this library with independent modules to produce an
 * executable, regardless of the license terms of these independent
 * modules, and to copy and distribute the resulting executable under
 * terms of your choice, provided that you also meet, for each linked
 * independent module, the terms and conditions of the license of that
 * module.  An independent module is a module which is not derived from
 * or based on this library.  If you modify this library, you may extend
 * this exception to your version of the library, but you are not
 * obligated to do so.  If you do not wish to do so, delete this
 * exception statement from your version.
 */
/*global WebSocketClient */
function Board(parent, boardId) {
    var webSocketClient,
        handleError = function (jqXHR, textStatus, errorThrown) {
        console.log("ERROR:" + textStatus);
    };



    $.ajax('/components/Board.html', {
        success: function (html) {
            var view = {},
                createSticky = function (theSticky) {
                    $.ajax('/board/' + boardId + '/objects', {
                        dataType: 'json',
                        data: JSON.stringify(theSticky),
                        type: 'POST',
                        success: function (createdObject) {
                            Issue(createdObject, parent, boardId, webSocketClient);

                            var newStickyMessage = {
                                type: "newSticky",
                                object: createdObject
                            };
                            webSocketClient.send(JSON.stringify(newStickyMessage));

                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            alert("ERROR:" + textStatus);
                        }
                    });

                };

            parent.append(html);

            view.title = parent.find("#title");
            view.body = parent.find('#board').empty();

            view.newStickyButton = parent.find("#newStickyButton").button().click(function () {
                var newSticky = {name: "", kind: "sticky"};

                StickyEditor(newSticky, $('body'), createSticky);
            });

            view.newImageButton = parent.find("#newImageButton").button().click(function () {
                var dialog = $('<div style="display:none;"><form><div>URL: <input type="text"/></div><div><input type="submit" value="OK" /></div></form></div>').appendTo(parent).dialog().show(),
                    urlField = dialog.find("input[type=text]");

                dialog.find("form").submit(function (e) {
                    var theImageObject = {kind: "image", name: urlField.val()};

                    e.preventDefault();
                    dialog.dialog("destroy").remove();

                    $.ajax('/board/' + boardId + '/objects', {
                        dataType: 'json',
                        data: JSON.stringify(theImageObject),
                        type: 'POST',
                        success: function (createdObject) {
                            Avatar(createdObject, view.body, boardId, webSocketClient);

                            var newImageMessage = {
                                type: "newImage",
                                object: createdObject
                            };
                            webSocketClient.send(JSON.stringify(newImageMessage));
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            alert("ERROR:" + textStatus);
                        }
                    });
                });
            });

            view.newBucketButton = parent.find("#newBucketButton").button().click(function () {
                var newBucket = {name: "", kind: "bucket", contents: []},
                    createBucket = function (theBucket) {
                        $.ajax('/board/' + boardId + '/objects', {
                            dataType: 'json',
                            data: JSON.stringify(theBucket),
                            type: 'POST',
                            success: function (createdObject) {
                                Bucket(createdObject, parent, boardId, createSticky, webSocketClient);

                                var newBucketMessage = {
                                    type: "newBucket",
                                    object: createdObject
                                };
                                webSocketClient.send(JSON.stringify(newBucketMessage));

                            },
                            error: function (jqXHR, textStatus, errorThrown) {
                                alert("ERROR:" + textStatus);
                            }
                        });
                    };

                StickyEditor(newBucket, $('body'), createBucket);
            });

            $.ajax('/board/' + boardId + '/objects', {
                dataType: 'json',
                success: function (data) {
                    var columnCount = 1;

                    webSocketClient = WebSocketClient(data.boardUpdatesWebSocket);

                    webSocketClient.onMessage(function(event) {
                        var msg, newPosition, widgetId;
                        msg = JSON.parse(event.data);
                        console.log(msg.type);
                        if(msg.type === 'positionChange') {
                            console.log("processing position change msg");
                            newPosition = msg.position;
                            widgetId = msg.widgetId;
                            $("#"+widgetId).offset(newPosition);
                        }
                        else if(msg.type === 'newSticky') {
                            console.log("processing newSticky msg");
                            Issue(msg.object, parent, boardId, webSocketClient);
                        }
                        else if(msg.type === 'newBucket') {
                            console.log("processing newBucket msg");
                            Bucket(msg.object, parent, boardId, createSticky, webSocketClient);
                        }
                        else if(msg.type === 'addBucketItem') {
                            widgetId = msg.widgetId;
                            console.log('processing addBucketItem msg');
                            $("#"+widgetId).trigger('addBucketItem', [msg.itemContents]);
                        }
                        else if(msg.type === 'newImage') {
                            console.log("processing newAvatar msg");
                            Avatar(msg.object, view.body, boardId, webSocketClient);
                        }
                        else if(msg.type === "deleteWidget") {
                            widgetId = msg.widgetId;
                            $("#"+widgetId).remove();
                        }
                        else if(msg.type === 'stickyContentChanged') {
                            widgetId = msg.widgetId;
                            $("#"+widgetId).find('.stickyContent').html(msg.content);
                        }
                        else {
                            console.log("unknown message type");
                        }


                    });

                    view.title.append(decodeURIComponent(data.name));

                    $(data.objects).each(function (n, item) {
                        if (item.kind === "column") {
                            Column(item.name, view.body);
                            columnCount++;
                        } else if (item.kind === "sticky") {
                            Issue(item, view.body, boardId, webSocketClient);
                        } else if (item.kind === "image") {
                            Avatar(item, view.body, boardId, webSocketClient);
                        }  else if (item.kind === "bucket") {
                            Bucket(item, view.body, boardId, createSticky, webSocketClient);
                        }
                    });

                    $("body").width(columnCount * 200);
                },
                error: handleError
            });
        },
        error: handleError
    });
}
