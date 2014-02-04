/*jslint newcap: false*/
/*global $ console ColumnEditor */

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

function Column(column, where, boardId, webSocketClient){
    $('<div class="column"><span class="columnHeader" id="column' + column.id + '">' + column.name + '</span><img class="stickyEditButton" title="Edit" src="pencil.png" /></div>').appendTo(where);

	var resourceURL,
		columnHeader,
		columnParent,
		img;

	resourceURL = "/board/" + boardId + "/objects/" + column.id;
	columnHeader = $("#column" + column.id);
	columnParent = columnHeader.parent();
	img = columnParent.find('img');

  columnHeader.bind("setHeader", function(event, header) {
    columnHeader.text(header.headerText);
  });

	columnParent.hover(
		function(e) { img.css('display', 'inline'); },
		function(e) { img.css('display', 'none'); }
	);

	function doSave(columnData) {
		$.ajax(resourceURL, {
			dataType: "json",
			data: JSON.stringify(columnData),
			type: "PUT",
			success: function (createdObject) {
				var msg = {
					type: "columnChanged",
					widgetId: "column" + createdObject.id,
					headerText: createdObject.name
				};

				columnHeader.text(createdObject.name);
				img.css('display', 'none');

				webSocketClient.send(JSON.stringify(msg));
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.log("ERROR:" + textStatus);
			}
		});
	}


	img.click(
		function(e) {
			console.log("click");
			ColumnEditor(columnHeader, columnParent, doSave);
		}
	);

}
