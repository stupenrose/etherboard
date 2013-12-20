/*jslint newcap: false*/
/*global $ console */

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

function StickyEditor(theSticky, parent, saveHandler) {
    var toggleTitle,
        view = $("#stickyEditor").html(),
        dialog = $($("#stickyEditor").html()),
        toggleWidget = dialog.find('.flip'),
        saveButton = dialog.find('.save'),
        backlogs = {},
        backlogStories = {},
        editStory = true;

    function toggleTitle() {
        var newTitle = "",
            storySelector = dialog.find('#etherLogStorySelect'),
            storyTitleDiv = storySelector.find(':selected'),
            selectedStoryIndex = storySelector.find(':selected').val();

        editStory = !editStory;
        if (selectedStoryIndex !== "0") {
            newTitle = storySelector.find(':selected').text();
        }
        if (editStory) {
            storyTitleDiv.text(newTitle + " Story Contents");
        } else {
            storyTitleDiv.text(newTitle + " Story Notes");
        }
    };

    function onLogSelect() {
        var etherlogSelector = dialog.find('#etherLogSelect'),
            storySelector = dialog.find('#etherLogStorySelect'),
            selectorDiv = dialog.find("#linkToEtherLog"),
            selectedBacklogId = etherlogSelector.find(':selected').val(),
            url = "/backlogs/" + parseInt(selectedBacklogId),
            selectedStoryIndex = theSticky.storyId || 0;

        theSticky.backlogId = selectedBacklogId;

        backlogStories = {};
        if (parseInt(selectedBacklogId) > 0) {
            theSticky.backlogName = backlogs[selectedBacklogId].title;
            storySelector.find("option:gt(0)").remove();
            $.ajax(url, {
                dataType: 'json',
                success: function (data) {
                    data.items.forEach(function (backlogStory) {
                        backlogStories[backlogStory.id] = backlogStory;
                        storySelector.append($("<option>").attr('value', backlogStory.id).text(backlogStory.title));
                    });
                    selectorDiv.show();
                    if (selectedStoryIndex !== "0") {
                        storySelector.val(selectedStoryIndex).change();
                    }
                }
            });
        } else {
            theSticky.backlogName = "";
            storySelector.val("0").change();
        }
    }

    function onStorySelect() {
        var storySelector = dialog.find('#etherLogStorySelect'),
            selectedStoryIndex = storySelector.find(':selected').val(),
            titleDiv = $('.ui-dialog').find('.ui-dialog-title'),
            storyContent = dialog.find('.content'),
            storyTitle = "",
            story;

        if (parseInt(selectedStoryIndex, 10) > 0) {
            storyTitle = storySelector.find(':selected').text();
            story = backlogStories[selectedStoryIndex];
            titleDiv.text(storyTitle + " Story Contents");
            storyContent.val(story.name);
            theSticky.content = story.name;
            theSticky.title = storyTitle;
            theSticky.storyId = selectedStoryIndex;
        } else {
            titleDiv.text("Story Contents");
            theSticky.title = "";
            theSticky.storyId = 0;
        }
    }

    function loadBackLogs() {
        var selectorDiv = dialog.find("#linkToEtherLog"),
            etherlogSelector = dialog.find('#etherLogSelect'),
            storySelector = dialog.find('#etherLogStorySelect'),
            selectedBacklogId = theSticky.backlogId || 0,
            selectedStoryIndex = theSticky.storyId || 0;

        etherlogSelector.change(function() {
            onLogSelect();
        });
        storySelector.change(function() {
            onStorySelect();
        });

        if (theSticky.kind === "sticky") {
            selectedBacklogId;
            selectedStoryIndex;
            $.ajax('/backlogs', {
                dataType: 'json',
                success: function (data) {
                    data.forEach(function (backlog) {
                        backlogs[backlog.id] = backlog;
                        etherlogSelector.append($("<option>").attr('value',backlog.id).text(backlog.name));
                    });
                    etherlogSelector.val(selectedBacklogId);
                    etherlogSelector.change();
                    selectorDiv.show();
                }
            });
        } else {
            selectorDiv.hide();
        }
    }

    function save() {
        var etherlogSelector = dialog.find('#etherLogSelect'),
            storySelector = dialog.find('#etherLogStorySelect'),
            selectedBacklogId = etherlogSelector.find(':selected').val();

        if (selectedBacklogId === 0) {
            theSticky.backlogId = "0";
            theSticky.backlogName = "";
            theSticky.storyId = "";
        }
        theSticky.title = storySelector.find(':selected').text();
        theSticky.name = dialog.find('.content').val();
        theSticky.extraNotes = dialog.find('.notesText').val();

        saveHandler(theSticky);
        dialog.dialog("destroy").remove();
    }

    function initialize() {
        var extraNotesInput = dialog.find('.notesText'),
            storyContent = dialog.find('.content');

        loadBackLogs();

        parent.append(dialog);

        toggleWidget.button().click(function (e) {
            storyContent.toggle();
            extraNotesInput.toggle();
            toggleTitle();
        });

        saveButton.button().click(function (e) {
            save();
        });

        storyContent.val(theSticky.name);
        extraNotesInput.val(theSticky.extraNotes);
        dialog.dialog(
            {
                width: "auto",
                title: theSticky.title || "TITLE",
                beforeClose: function(event, ui) {
                    dialog.dialog("destroy").remove();
            }
        });
    }

    initialize();
}
