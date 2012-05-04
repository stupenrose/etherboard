/**
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

package com.cj.nan.etherboard

import scala.collection.JavaConversions._
import org.codehaus.jackson.map.ObjectMapper
import java.io.{File => Path, FileOutputStream, FileInputStream}

object BoardDaoImpl extends BoardDao {
    val dataPath = new Path("target/data")

    def apply(): BoardDao = {
        dataPath.mkdirs()
        this
    }

    def storagePathForBoard(id: String) = new Path(dataPath, id)

    def deduplicate(board: Board) {
        var previousIds: List[Int] = List[Int]();
        board.objects.foreach(
            boardObject => {
                if (previousIds.contains(boardObject.id)) {
                    boardObject.id = board.generateUniqueId()
                }
                previousIds ::= boardObject.id
            }
        )
    }

    def getBoard(id: String): Board = {
        val path = storagePathForBoard(id)

        return if (path.exists()) {
            val jackson = new ObjectMapper()
            val input = new FileInputStream(path)
            try {
                val board: Board = jackson.readValue(input, classOf[Board])
                board.objects.foreach(
                    b => {
                        if (b.kind == "stickie") {
                            b.kind = "sticky";
                        }
                        board.id_sequence = board.id_sequence.max(b.id);
                    }
                )
                deduplicate(board);
                return board;
            } finally {
                input.close
            }
        } else {
            return new Board(id,
                new BoardObject(id = 1, name = "OnDeck", kind = "column"),
                new BoardObject(id = 2, name = "InProgress", kind = "column"),
                new BoardObject(id = 3, name = "DevDone", kind = "column"),
                new BoardObject(id = 4, name = "QRing", kind = "column"),
                new BoardObject(id = 5, name = "ReadyForDemo", kind = "column"),
                new BoardObject(id = 6, name = "NeedsSoxing", kind = "column"),
                new BoardObject(id = 7, name = "Soxing", kind = "column"),
                new BoardObject(id = 8, name = "NeedsDeploy", kind = "column"),
                new BoardObject(id = 9, name = "NeedsClosing", kind = "column")
            )
        }
    }

    def saveBoard(board: Board) {
        val path = storagePathForBoard(board.getName())
        val jackson = new ObjectMapper()
        path.getParentFile().mkdirs()
        val output = new FileOutputStream(path);
        try {
            jackson.writeValue(output, board);
            println("Wrote board to " + path)
        } finally {
            output.close
        }

    }

    def listBoards(): Array[String] = {
        dataPath.list()
    }

}
