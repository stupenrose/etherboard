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

import org.junit
import org.junit.runner.RunWith
import org.scalatest.junit.JUnitRunner
import org.scalatest.FunSuite
import org.scalatest.FlatSpec
import org.scalatest.{FunSuite, FlatSpec}
import java.util.List
import org.scalatest.matchers.ShouldMatchers

@RunWith(classOf[JUnitRunner])
class EtherboardTest extends FunSuite with ShouldMatchers {

    test("Position is initialized with position 0,0") {
        val myPosition = new Position()

        //then
        myPosition.left should equal(0)
        myPosition.top should equal(0)
    }

    test("updating BoardObject from another BoardObject") {
        val originalBoardObject: BoardObject = new BoardObject(1, "original name", "original extra note", "original kind", new Position())
        val newPosition: Position = new Position(34, 87)
        val newBoardObject: BoardObject = new BoardObject(2, "new name", "new extra note", "new kind", newPosition)

        originalBoardObject.updateFrom(newBoardObject)

        //then
        originalBoardObject.id should equal(1)
        originalBoardObject.name should equal("new name")
        originalBoardObject.kind should equal("original kind")
        originalBoardObject.pos should equal(newPosition)
    }

    test("Remove a board object") {
        var a: BoardObject = new BoardObject(3, "a is excellent", "yes it is", "sticky", new Position(0, 0))
        var b: BoardObject = new BoardObject(14, "b is bad", "fo sho", "stinky", new Position(0, 0))
        var bb: Board = new Board("bb", a, b);

        assert(bb.objects.contains(a))
        assert(bb.objects.contains(b))

        bb.removeObject(a.id)

        assert(!bb.objects.contains(a))
        assert(bb.objects.contains(b))
    }

    test("BoardObjects equal") {
        var boardObject: BoardObject = new BoardObject(4, "some name", "some note", "some kind", new Position(37, 928))
        var otherBoardObject: BoardObject = new BoardObject(4, "some name", "some note", "some kind", new Position(37, 928))

        assert(boardObject === otherBoardObject)
        otherBoardObject.pos = new Position(37, 927)
        assert((boardObject == otherBoardObject) === false)
    }
}
