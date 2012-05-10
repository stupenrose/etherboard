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

import websockets.SimpleWebsocketServer
import org.jboss.netty.channel.Channel


import websockets.SimpleWebsocketServer
import org.jboss.netty.handler.codec.http.QueryStringDecoder
import actors.Actor
import org.jboss.netty.handler.codec.http.websocketx.TextWebSocketFrame

class BoardRealtimeUpdateServer(port:Int)  {
    val websocketServer = new SimpleWebsocketServer(port, connectionHandler, messageHandler)

    def run() {
        BoardUpdatesActor.start()
        websocketServer.run
    }

    def connectionHandler(uri:String, channel:Channel) {
        val decoder: QueryStringDecoder = new QueryStringDecoder(uri)
        println(uri)
        val boardName = decoder.getParameters.get("boardName").get(0)

        BoardUpdatesActor ! NewConnection(boardName, channel)
    }

    def messageHandler(message:String, channel:Channel) {
        BoardUpdatesActor ! NewMessage(message, channel)
    }
}

case class NewConnection(board:String, channel:Channel)

case class NewMessage(msg:String, channel:Channel)

object BoardUpdatesActor extends Actor {

    var connectionsByBoard = Map[String, List[Channel]]()

    def act() {
        loop {
            react {
                case NewConnection(board:String, channel:Channel) => {
                    val connections:List[Channel] = connectionsByBoard.get(board).getOrElse(List())
                    connectionsByBoard += (board -> (channel :: connections))
                }
                case NewMessage(message:String, channel:Channel) => {
                    val boardThisConnectionIsIn = connectionsByBoard.find(p => p._2.contains(channel))
                    if (boardThisConnectionIsIn != None) {
                        val connections = boardThisConnectionIsIn.get._2.filter(_.isOpen)
                        connectionsByBoard += (boardThisConnectionIsIn.get._1 -> connections)

                        (connections - channel).foreach(connection => {
                            connection.write(new TextWebSocketFrame(message))
                        })
                    }
                    else {
                        println("could not find what board this connection belongs to")
                    }
                }
                case _ => println("unkown message sent to BoardUpdateActor")
            }
        }
    }
}