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
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.annotation.JsonTypeInfo.As
import org.apache.http.impl.client.DefaultHttpClient
import org.apache.http.client.methods.HttpGet
import java.io.ByteArrayOutputStream
import org.jboss.netty.logging.Log4JLoggerFactory
import org.apache.commons.logging.LogFactory
import org.apache.log4j.Logger
import org.apache.log4j.Level
import scala.xml.XML

class Position(@BeanProperty var left: Int = 0, @BeanProperty var top: Int = 0) {
    def this() = this(left = 0, top = 0)
}

class Sticky(@BeanProperty var name: String, @BeanProperty var extraNotes: String) {
    def this() = this(name = null, extraNotes = null)
    def this(_name: String) = this(name = _name, extraNotes = null)
}

class BoardObject(@BeanProperty var id: Int,
                  @BeanProperty var name: String,
                  @BeanProperty var extraNotes: String,
                  @BeanProperty() var kind: String,
                  @BeanProperty var pos: Position = new Position(),
                  @BeanProperty var height: Int = 150,
                  @BeanProperty var width: Int = 150,
                  @BeanProperty var contents: java.util.List[Sticky] = new java.util.ArrayList[Sticky]()) {

    if (kind == "stickie") {
        kind = "sticky"
    }

    def this() = this(id = Integer.MIN_VALUE, name = null, extraNotes = null, kind = null, height = 150, width = 150)

    def this(_id: Int, other: BoardObject) = this(id = _id, name = other.name, extraNotes = other.extraNotes, kind = other.kind, pos = other.pos, height = other.height, width = other.width)

    def this(_id: Int) = this(id = _id, name = null, extraNotes = null, kind = null, height = 150, width = 150)

    def updateFrom(other: BoardObject) {
        if (other != null) {
            pos = other.pos
            name = other.name
            extraNotes = other.extraNotes
            contents = other.contents
            height = other.height
            width = other.width
        }
    }

    override def equals(other: Any): Boolean = other match {
        case x: BoardObject =>
            this.id == x.id && this.name == x.name && this.extraNotes == x.extraNotes && this.kind == x.kind && pos.left == x.pos.left && pos.top == x.pos.top && height == x.height && width == x.width
        case _ => false
    }
}

@JsonTypeInfo(use=JsonTypeInfo.Id.NAME, include=As.PROPERTY, property="type", defaultImpl = classOf[Board])
@JsonSubTypes(Array(
        new JsonSubTypes.Type(value = classOf[Board], name="simple"),
        new JsonSubTypes.Type(value = classOf[PivotalTrackerBoard], name="pivotalTracker")
    ))
class Board(@BeanProperty var name: String, stuff: BoardObject*) {
    @BeanProperty var objects: java.util.List[BoardObject] = new java.util.ArrayList[BoardObject](java.util.Arrays.asList(stuff: _*))
    @BeanProperty var id_sequence: Int = objects.map(_.id).fold(0)((m, x) => m.max(x))
    @BeanProperty var boardUpdatesWebSocket = ""

    def this() = this(null)
    
    def onLoad() = {}	//no extra steps necessary on load

    def findObject(id: Int): Option[BoardObject] = {
    	objects.find(_.id == id)
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

class PivotalTrackerBoard(@BeanProperty name: String,  @BeanProperty var toolSyncId: String, @BeanProperty var toolSyncKey: String, stuff: BoardObject*) extends Board(name, stuff:_*) {
	def this() = this(null, null, null)
    
    override def onLoad() = syncData
     
    def syncData() = {
      val httpClient = new DefaultHttpClient()
      val req = new HttpGet(s"http://www.pivotaltracker.com/services/v3/projects/${toolSyncId}/stories?filter=state%3Aunstarted,started,finished,delivered,accepted,rejected%20includedone%3Afalse")
      req.setHeader("X-TrackerToken", toolSyncKey)
      
      val response = httpClient.execute(req)
      val baos = new ByteArrayOutputStream()
      response.getEntity().writeTo(baos)
      
      val stories = pivotalTrackerStoriesFromXml(baos.toString())
      
      stories.foreach(story => {
    	findObject(story.id) match {
          case Some(existingStory) =>
            existingStory.name = story.name
            existingStory.extraNotes = story.description
          case None =>
            addObject(new BoardObject(story.id, story.name, story.description, "sticky"))
      	}
      })
    }
    
    def pivotalTrackerStoriesFromXml(xmlString:String):Seq[PivotalTrackerStory] = {
    	XML.loadString(xmlString) \ "story" map(s => {
			val id = s\"id"
			val url = s\"url"
			val name = s\"name"
			val desc = s\"description"
			
			new PivotalTrackerStory(Integer.parseInt(id.text), url.text, name.text, desc.text)
	    })
	}
}

case class PivotalTrackerStory(id:Int, url:String, name:String, description:String)

object EtherboardMain {
    def main(args: Array[String]) {
    	Logger.getLogger("org.apache").setLevel(Level.ERROR)
        JettyWrapper.launchServer(BoardDaoImpl())
    }
}

