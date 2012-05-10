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

import java.io.{File => Path}
import scala.collection.JavaConversions._
import reflect.BeanProperty

class Position(@BeanProperty var left: Int = 0, @BeanProperty var top: Int = 0) {
    def this() = this(left = 0, top = 0)
}

class BoardObject(@BeanProperty var id: Int,
                  @BeanProperty var name: String,
                  @BeanProperty() var kind: String,
                  @BeanProperty var pos: Position = new Position(),
                  @BeanProperty var height: Int = 150,
                  @BeanProperty var width: Int = 150,
                  @BeanProperty var contents: java.util.List[String] = new java.util.ArrayList[String]()) {

    if (kind == "stickie") {
        kind = "sticky"
    }

    def this() = this(id = Integer.MIN_VALUE, name = null, kind = null, height = 150, width = 150)

    def this(_id: Int, other: BoardObject) = this(id = _id, name = other.name, kind = other.kind, pos = other.pos, height = other.height, width = other.width)

    def this(_id: Int) = this(id = _id, name = null, kind = null, height = 150, width = 150)

    def updateFrom(other: BoardObject) {
        if (other != null) {
            pos = other.pos
            name = other.name
            contents = other.contents
            height = other.height
            width = other.width
        }
    }

    override def equals(other: Any): Boolean = other match {
        case x: BoardObject =>
            this.id == x.id && this.name == x.name && this.kind == x.kind && pos.left == x.pos.left && pos.top == x.pos.top && height == x.height && width == x.width
        case _ => false
    }
}

class Board(@BeanProperty var name: String, stuff: BoardObject*) {
    @BeanProperty var objects: java.util.List[BoardObject] = new java.util.ArrayList[BoardObject](java.util.Arrays.asList(stuff: _*))
    @BeanProperty var id_sequence: Int = objects.map(_.id).fold(0)((m, x) => m.max(x))
    @BeanProperty var boardUpdatesWebSocket = ""

    def this() = this(null)

    def findObject(id: Int): BoardObject = {
        objects.filter(_.id == id).get(0)
    }

    def addObject(boardObject: BoardObject) = {
        objects.add(boardObject)
    }

    def removeObject(id: Int) = {
        objects = objects.filterNot(_.id == id)
    }

    def generateUniqueId(): Int = {
        id_sequence += 1
        id_sequence
    }
}

object EtherboardMain {
    def main(args: Array[String]) {
        JettyWrapper.launchServer(BoardDaoImpl())
    }
}

