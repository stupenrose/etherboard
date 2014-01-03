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
    var view = $("#stickyEditor").html(),
        dialog = $($("#stickyEditor").html()),
        backlogs = {},
        backlogStories = {},
        modifiedSticky = {};


    function showSourceControls() {
        dialog.find(".source_controls").show();
    }

    function hideSourceControls() {
        dialog.find(".source_controls").hide();
    }

    function showAddSource() {
        dialog.find(".add_source").show();
    }

    function hideAddSource() {
        dialog.find(".add_source").hide();
    }

    function onLogSelect() {
        var etherlogSelector = dialog.find('#etherLogSelect'),
            storySelector = dialog.find('#etherLogStorySelect'),
            selectorDiv = dialog.find("#sourceSelection"),
            selectedBacklogId = etherlogSelector.find(':selected').val(),
            url = "/api/external/sources/" + selectedBacklogId + "/items/suggestions",
            selectedStoryIndex = modifiedSticky.storyId || "0",
            storyLines,
            description;

        modifiedSticky.backlogId = selectedBacklogId;

        backlogStories = {};
        if (selectedBacklogId !== "0") {
            modifiedSticky.backlogName = backlogs[selectedBacklogId].name;
            storySelector.find("option:gt(0)").remove();
            $.ajax(url, {
                dataType: 'json',
                success: function (data) {
                    data.forEach(function (backlogStory) {
                        backlogStories[backlogStory.externalId] = backlogStory;
                        storyLines = backlogStory.name.split('\n');
                        if (storyLines.length > 0) {
                            description = storyLines[0];
                            if (description.length > 25) {
                                description = description.substring(0, 25);
                            }
                        }
                        storySelector.append($("<option>" + description + "</option>").attr('value', backlogStory.externalId));
                    });
                    selectorDiv.show();
                    if (selectedStoryIndex !== "0") {
                        storySelector.val(selectedStoryIndex).change();
                    }
                }
            });
        } else {
            modifiedSticky.backlogName = "";
            storySelector.val("0").change();
        }
    }

    function storyFromEtherlogDisableStoryInputFields() {
        var storyContent = dialog.find('.content'),
            storyExtraNotes = dialog.find('.extraNotes');

        storyContent.prop('disabled', true);
        storyExtraNotes.prop('diabled', true);

    }

    function nonEtherlogStoryEnableInputs() {
        var storyContent = dialog.find('.content'),
            storyExtraNotes = dialog.find('.extraNotes');

        storyContent.prop('disabled', false);
        storyExtraNotes.prop('diabled', false);
    }

    function onStorySelect() {
        var storySelector = dialog.find('#etherLogStorySelect'),
            selectedStoryIndex = storySelector.find(':selected').val(),
            storyContent = dialog.find('.content'),
            story;

        if (selectedStoryIndex === "0") {
            modifiedSticky.storyId = undefined;
            nonEtherlogStoryEnableInputs();
        } else {
            story = backlogStories[selectedStoryIndex];
            storyContent.val(story.content);
            modifiedSticky.name = story.content;
            modifiedSticky.storyId = selectedStoryIndex;
            storyFromEtherlogDisableStoryInputFields();

        }
    }

    function loadBackLogs() {
        var selectorDiv = dialog.find("#sourceSelection"),
            etherlogSelector = dialog.find('#etherLogSelect'),
            storySelector = dialog.find('#etherLogStorySelect'),
            selectedBacklogId = modifiedSticky.backlogId || "0",
            selectedStoryIndex = modifiedSticky.storyId || "0";

        etherlogSelector.change(function() {
            onLogSelect();
        });
        storySelector.change(function() {
            onStorySelect();
        });

        if (modifiedSticky.kind === "sticky") {
            $.ajax('/api/external/sources', {
                dataType: 'json',
                success: function (data) {
                    data.forEach(function (backlog) {
                        backlogs[backlog.externalId] = backlog;
                        etherlogSelector.append($("<option>").attr('value',backlog.externalId).text(backlog.name));
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

        if (selectedBacklogId === "0") {
            modifiedSticky.backlogId = "0";
            modifiedSticky.backlogName = "";
            modifiedSticky.storyId = "0";
        }
        modifiedSticky.name = dialog.find('.content').val();
        modifiedSticky.extraNotes = dialog.find('.notesText').val();
        saveHandler(modifiedSticky);
        dialog.dialog("destroy").remove();

    }

    function handleAddSource() {
        loadBackLogs();
        showSourceControls();
        hideAddSource();
    }

    function initialize() {
        var extraNotesInput = dialog.find('.notesText'),
            storyContent = dialog.find('.content'),
            toggleWidget = dialog.find('.flip'),
            saveButton = dialog.find('.save'),
            addSource = dialog.find("#addExternalSystem");

        modifiedSticky = $.extend(modifiedSticky, theSticky);

        if (modifiedSticky.backlogId === "0" || modifiedSticky.backlogId === undefined) {

            showAddSource();
            hideSourceControls();
        } else {
            loadBackLogs();
            hideAddSource();
            showSourceControls();
        }
        //loadBackLogs();

        parent.append(dialog);

        toggleWidget.button().click(function (e) {
            storyContent.toggle();
            extraNotesInput.toggle();
        });

        saveButton.button().click(function (e) {
            save();
        });

        addSource.click(function (e) {
            handleAddSource();
        });


        storyContent.val(modifiedSticky.name);
        extraNotesInput.val(modifiedSticky.extraNotes);
        dialog.dialog(
            {
                width: "auto",
                beforeClose: function(event, ui) {
                    dialog.dialog("destroy").remove();
                }
            }
        );
    }

    initialize();
}
