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

package com.cj.nan.etherboard.websockets

import org.jboss.netty.logging.{InternalLoggerFactory, InternalLogger}
import org.jboss.netty.handler.codec.http.HttpMethod._
import org.jboss.netty.handler.codec.http.HttpVersion._
import org.jboss.netty.handler.codec.http.HttpResponseStatus._
import org.jboss.netty.handler.codec.http.HttpHeaders._
import org.jboss.netty.handler.codec.http.websocketx._
import org.jboss.netty.buffer.ChannelBuffers
import org.jboss.netty.util.CharsetUtil
import org.jboss.netty.handler.codec.http._
import org.jboss.netty.channel._


class WebSocketServerHandler(val connectionHandler: (String, Channel) => Unit, val messageHandler: (String, Channel) => Unit) extends SimpleChannelUpstreamHandler {
    private final val logger: InternalLogger = InternalLoggerFactory.getInstance(classOf[WebSocketServerHandler])
    private final val WEBSOCKET_PATH: String = "/websocket"
    private var handshaker: WebSocketServerHandshaker = null

    override def messageReceived(ctx: ChannelHandlerContext, e: MessageEvent): Unit = {
        val msg: AnyRef = e.getMessage
        if (msg.isInstanceOf[HttpRequest]) {
            handleHttpRequest(ctx, msg.asInstanceOf[HttpRequest])
        }
        else if (msg.isInstanceOf[WebSocketFrame]) {
            handleWebSocketFrame(ctx, msg.asInstanceOf[WebSocketFrame])
        }
    }


    private def handleHttpRequest(ctx: ChannelHandlerContext, req: HttpRequest) {
        if (req.getMethod ne GET) {
            sendHttpResponse(ctx, req, new DefaultHttpResponse(HTTP_1_1, FORBIDDEN))
            return
        }

        if (req.getUri == "/favicon.ico") {
            val res: HttpResponse = new DefaultHttpResponse(HTTP_1_1, NOT_FOUND)
            sendHttpResponse(ctx, req, res)
            return
        }

        val wsFactory: WebSocketServerHandshakerFactory = new WebSocketServerHandshakerFactory(this.getWebSocketLocation(req), null, false)
        this.handshaker = wsFactory.newHandshaker(req)
        if (this.handshaker == null) {
            wsFactory.sendUnsupportedWebSocketVersionResponse(ctx.getChannel)
        }
        else {
            connectionHandler(req.getUri, ctx.getChannel)
            this.handshaker.handshake(ctx.getChannel, req).addListener(WebSocketServerHandshaker.HANDSHAKE_LISTENER)
        }
    }

    private def handleWebSocketFrame(ctx: ChannelHandlerContext, frame: WebSocketFrame): Unit = {
        if (frame.isInstanceOf[CloseWebSocketFrame]) {
            this.handshaker.close(ctx.getChannel, frame.asInstanceOf[CloseWebSocketFrame])
            return
        }
        else if (frame.isInstanceOf[PingWebSocketFrame]) {
            ctx.getChannel.write(new PongWebSocketFrame(frame.getBinaryData))
            return
        }
        else if (!(frame.isInstanceOf[TextWebSocketFrame])) {
            throw new UnsupportedOperationException(String.format("%s frame types not supported", frame.getClass.getName))
        }

        var request: String = (frame.asInstanceOf[TextWebSocketFrame]).getText
        messageHandler(request, ctx.getChannel)
    }

    private def sendHttpResponse(ctx: ChannelHandlerContext, req: HttpRequest, res: HttpResponse): Unit = {
        if (res.getStatus.getCode != 200) {
            res.setContent(ChannelBuffers.copiedBuffer(res.getStatus.toString, CharsetUtil.UTF_8))
            setContentLength(res, res.getContent.readableBytes)
        }
        val f: ChannelFuture = ctx.getChannel.write(res)
        if (!isKeepAlive(req) || res.getStatus.getCode != 200) {
            f.addListener(ChannelFutureListener.CLOSE)
        }
    }

    override def exceptionCaught(ctx: ChannelHandlerContext, e: ExceptionEvent): Unit = {
        e.getCause.printStackTrace
        e.getChannel.close
    }

    private def getWebSocketLocation(req: HttpRequest): String = {
        return "ws://" + req.getHeader(HttpHeaders.Names.HOST) + WEBSOCKET_PATH
    }
}