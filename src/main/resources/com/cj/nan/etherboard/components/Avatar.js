
/*jslint newcap: false*/
/*global $ alert window console confirm */

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

function Avatar(avatar, parent, boardId, webSocketClient){
    var widgetId = 'widget' + avatar.id,
    widget = $(
        '<div id="' + widgetId + '" class="avatar">' +
            '<div class="avatarHeader" style="opacity: 0;">' +
                '<img class="avatarDeleteButton" src="close_icon.gif" />' +
                '<div style="clear:both"></div>' +
            '</div>' +
            '<img src="' + avatar.name + '">' +
        '</div>').css(avatar.pos).appendTo(parent),
        bar = widget.find(".avatarHeader");
    widget.hover(
        function () {
            bar.stop(true, true).delay(3000).fadeTo(300, 1);
        },
        function () {
            bar.stop(true, false).fadeTo(100, 0);
        })
        .draggable({
            containment: [0, 0, Infinity, Infinity],
            drag: function (event, ui) {
                var msg = {
                    type: "positionChange",
                    widgetId: widgetId,
                    position: $(this).offset()
                };
                webSocketClient.send(JSON.stringify(msg));
            },
            stop: function (event) {
                event.stopPropagation();
                avatar.pos = $(this).offset();
                $.ajax('/board/' + boardId + '/objects/' + avatar.id, {
                    dataType: 'json',
                    data: JSON.stringify(avatar),
                    type: 'PUT',
                    success: function (createdObject) {
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        alert("ERROR:" + textStatus);
                    }
                });
            }
        });

    widget.bind("deleteSticky", function () {
        $.ajax('/board/' + boardId + '/objects/' + avatar.id, {
            dataType: 'json',
            type: 'DELETE',
            success: function (createdObject) {
                widget.remove();
                var msg = {
                    type: "deleteWidget",
                    widgetId: widgetId
                };
                webSocketClient.send( JSON.stringify(msg));
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("ERROR:" + textStatus);
            }
        });
    });

    widget.find('.avatarDeleteButton').click(function () {
        if(confirm("DELETE is permanent! :(")) {
            widget.trigger("deleteSticky");
        }
    });

    widget.on("touchstart touchmove touchend touchcancel", function (ev) {
        var event = ev.originalEvent,
            touches = event.changedTouches,
            first = touches[0],
            simulatedEvent = document.createEvent("MouseEvent"),
            types = {touchstart: "mousedown", touchmove: "mousemove", touchend: "mouseup"},
            type = types[event.type];

        if (type) {
            simulatedEvent.initMouseEvent(type, true, true, window, 1,
                first.screenX, first.screenY,
                first.clientX, first.clientY, false,
                false, false, false, 0, null);
            first.target.dispatchEvent(simulatedEvent);
            event.preventDefault();
        }
    });
}
