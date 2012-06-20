/*jslint newcap: false*/
/*global $ console Issue StickyEditor confirm*/

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

function Bucket(bucket, parent, boardId, createIssueCallback, webSocketClient) {
    var bucketId= 'bucket' + bucket.id,
        widget = $('<div id= ' + bucketId + ' class="bucket">' +
                       '<div class="stickyHeader" style="opacity: 0; background:#ff0000;">' +
                           '<img class="stickyEditButton" src="pencil.png" />' +
                           '<img class="stickyCloseButton" src="close_icon.gif" />' +
                           '<div style="clear:both"></div>' +
                       '</div>' +
                       '<div class="stickyContent"></div>' +
                       '<ol class="bucketList"></ol>' +
                   '</div>').css(bucket.pos).appendTo(parent),
        bar = widget.find('.stickyHeader');

    function doSave() {
        $.ajax('/board/' + boardId + '/objects/' + bucket.id, {
            dataType: 'json',
            data: JSON.stringify(bucket),
            type: 'PUT',
            success: function (createdObject) {
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("ERROR:" + textStatus);
            }
        });
    }

    function bucketSave() {
        bucket.contents = [];
        widget.find(".bucketList > li > span").each(function () {
            bucket.contents.push($(this).html());
        });
        doSave();
    }

    function update() {
        var bucketList = widget.find('.bucketList').empty().sortable({
                stop: function () {
                    bucketSave();
                }
            }),
            i, item;
        widget.find('.stickyContent').html(bucket.name);
        widget.height(bucket.height || 150);
        widget.width(bucket.width || 150);

        for(i = 0; i < bucket.contents.length; i++) {
            item = $("<li></li>").append(
			$("<span></span>").html(bucket.contents[i])
		   );
            item.append("<a href='#' class='remove'>--&gt;</a>");
            bucketList.append(item);
        }
        bucketList.find(".remove").click(function (e) {
            var stickyContent = $(this).parent().find("span").html();
            createIssueCallback({name: stickyContent, kind: "sticky"});
            $(this).parent().remove();

            webSocketClient.send(JSON.stringify({
                type: "removeBucketItem",
                widgetId: bucketId,
                content: stickyContent
            }));

            bucketSave();
        });
    }

    widget.bind('addBucketItem', function (event, bucketItem) {
        bucket.contents.push(bucketItem);
        update();
    });
    widget.bind('removeBucketItem', function(event, bucketItem) {
        var indexToRemove = $.inArray(bucketItem, bucket.contents);
        if(indexToRemove !== -1) {
            bucket.contents.splice(indexToRemove,1);
        }
        update();
    });

    update();

    widget
        .hover(
        function () {
            bar.stop(true, true).delay(300).fadeTo(300, 0.3);
        },
        function () {
            bar.stop(true, false).fadeTo(100, 0);
        })
        .draggable({
            containment: [0,0,Infinity,Infinity],
            drag: function (event, ui) {
                var msg = {
                    type: "positionChange",
                    widgetId: bucketId,
                    position: widget.offset()
                };
                webSocketClient.send( JSON.stringify(msg));
            },
            stop: function (event, ui) {
                event.stopPropagation();
                bucket.pos = widget.offset();
                doSave();
            }
        })
        .droppable({
            drop: function (event, ui) {
                var sticky = $(ui.draggable);
                event.stopPropagation();

                if(sticky.hasClass("sticky")) {
                    sticky.data("living", false);
                    sticky.trigger("deleteSticky");
                    bucket.contents.push(sticky.find(".stickyContent").html());

                    webSocketClient.send(JSON.stringify({
                        type: 'addBucketItem',
                        widgetId: bucketId,
                        itemContents: sticky.find(".stickyContent").html()
                    }));

                    doSave();
                    update();
                }
            }
        })
        .resizable({
            minHeight: 150,
            minWidth: 150,
            stop: function (event, ui) {
                bucket.width = widget.width();
                bucket.height = widget.height();

                doSave();
                update();
            }
        });

    widget.find('.stickyEditButton').click(function (event) {
        StickyEditor(bucket, parent, function (newSticky) {
            doSave();
            update();
            var titleChangeMessage = {
                type: "stickyContentChanged",
                widgetId: bucketId,
                content: bucket.name
            };
            webSocketClient.send(JSON.stringify(titleChangeMessage));
        });
    });

    widget.find('.stickyCloseButton').click(function () {
        if(confirm(" )': DELETE is permanent! :'( ")) {
            $.ajax('/board/' + boardId + '/objects/' + bucket.id, {
                dataType: 'json',
                type: 'DELETE',
                success: function (createdObject) {
                    widget.remove();
                    var msg = {
                        type: "deleteWidget",
                        widgetId: bucketId
                    };
                    webSocketClient.send( JSON.stringify(msg));
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log("ERROR:" + textStatus);
                }
            });
        }
    });
}
