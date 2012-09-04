/*jslint newcap: false*/
/*global $ console confirm tmpl StickyEditor */

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

function Issue(issue, parent, boardId, webSocketClient) {
    var widgetId = "widget" + issue.id,
        html = tmpl("stickyTemplate", {id: widgetId}),
        widget;

    parent.append(html);
    widget = $("#" + widgetId).css(issue.pos);

    function doSave() {
        $.ajax("/board/" + boardId + "/objects/" + issue.id, {
            dataType: "json",
            data: JSON.stringify(issue),
            type: "PUT",
            success: function (createdObject) {
                var msg = {
                    type: "stickyContentChanged",
                    widgetId: widgetId,
                    content: createdObject.name,
                    extraNotes: createdObject.extraNotes
                };

                console.log("doSave: ");
                console.dir(createdObject);

                webSocketClient.send(JSON.stringify(msg));
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("ERROR:" + textStatus);
            }
        });
    }

    function update() {
        widget.find(".stickyContent").html(issue.name);
        widget.find(".extraNotes").html(issue.extraNotes);
    }

    update();
    widget.data("living", true);

    widget.draggable({
            containment: [0, 0, Infinity, Infinity],
            drag: function (event, ui) {
                var msg = {
                    type: "positionChange",
                    widgetId: widgetId,
                    position: widget.offset()
                };
                webSocketClient.send(JSON.stringify(msg));
            },
            stop: function (event, ui) {
                if (widget.data("living")) {
                    event.stopPropagation();
                    issue.pos = widget.offset();
                    widget.trigger("doSave");
                }
            }
        });

    widget.find(".stickyEditButton").click(function (e) {
        StickyEditor(issue, parent, function (newSticky) {
            widget.trigger("doSave");
            update();
        });
    });

    widget.find(".stickyFlipButton").click(function (e) {
        widget.toggleClass("flip");
    });

    widget.find(".stickyCloseButton").click(function (e) {
        if (confirm("DELETE is permanent! :(")) {
            widget.trigger("deleteSticky");
        }
    });

    widget.bind("doSave", doSave);

    widget.bind("deleteSticky", function () {
        $.ajax("/board/" + boardId + "/objects/" + issue.id, {
            dataType: "json",
            type: "DELETE",
            success: function (createdObject) {
                widget.remove();
                var msg = {
                    type: "deleteWidget",
                    widgetId: widgetId
                };
                webSocketClient.send(JSON.stringify(msg));
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("ERROR:" + textStatus);
            }
        });
    });

    widget.bind("setContents", function (event, issueInfo) {
        issue.name = issueInfo.content;
        issue.extraNotes = issueInfo.extraNotes;
        update();
    });
}
