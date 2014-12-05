package com.cj.nan.etherboard

import org.apache.commons.httpclient.methods.GetMethod
import org.apache.commons.httpclient.HttpClient
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import java.io.File
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import org.apache.commons.httpclient.methods.EntityEnclosingMethod
import org.apache.commons.httpclient.HttpMethodBase
import com.fasterxml.jackson.annotation.JsonValue
import com.fasterxml.jackson.core.`type`.TypeReference
import scala.collection.JavaConversions._
import org.apache.commons.httpclient.methods.PostMethod
import org.apache.commons.httpclient.Cookie
import java.net.URL

@JsonIgnoreProperties(ignoreUnknown = true)
case class TeamstoryEstimate (id:String, currency:String, value:Int, when: Long)

@JsonIgnoreProperties(ignoreUnknown = true)
case class TeamstoryItem (id:String, name:String, kind:String, estimates:List[TeamstoryEstimate], isComplete:Boolean)

@JsonIgnoreProperties(ignoreUnknown = true)
case class TeamstoryExternalItems (id:String, name:String, memo:String, items: List[TeamstoryItem])

@JsonIgnoreProperties(ignoreUnknown = true)
case class TeamstoryOverview (id:String, name:String, whenArchived:Option[Long])

@JsonIgnoreProperties(ignoreUnknown = true)
case class TeamstoryHistoryEntry(version: String, when:Long, memo:String)

@JsonIgnoreProperties(ignoreUnknown = true)
case class TeamstoryPluginConfig (url: String, username:String, password:String)


@JsonIgnoreProperties(ignoreUnknown = true)
case class TeamstoryAuthRequest (email:String, password:String)

class TeamstoryPlugin  extends Plugin {
  
  override def createMessage(boardObject: BoardObject, externalSourceId: String, msgContent: String) = { 
    val sourceName = getSourceName(externalSourceId)
    def quotesAround(field: String): String = {
      val quote = """""""
      quote + field + quote
    }
    def quoteField(elementType: String, element: String): String = {
      quotesAround(elementType) + ":" + quotesAround(element)
    }

    val backlogId = boardObject.backlogId
    val storyUUID = boardObject.storyId
    val firstLine = msgContent
    val truncatedName = if (firstLine.length > 100) {
      firstLine.substring(0, 100) + "..."
    } else {
      firstLine
    }

      //todo: This should probably be a concern of the etherlog plugin.
      // at this point, are we certain that it is an etherlog item?
    val itemLink = s"${config.url}/backlog/${boardObject.getStoryId}#${boardObject.id}"

    val stickyContent = s"""<a href="${itemLink}"} style="background: #418F3A; color: white; display: block;"> $sourceName </a><div style="white-space:pre-line;"> $truncatedName </div>""".replaceAllLiterally( """"""", """\"""")

    val message = s"""{${quoteField("type", "stickyContentChanged")},${quoteField("widgetId", "widget" + boardObject.id.toString)},${quoteField("content", stickyContent)},${quoteField("extraNotes", "")}}"""

    message
  }
  
    def readJson[T](path:File, clazz:Class[T]):T = {
        val mapper = new ObjectMapper()
        mapper.registerModule(DefaultScalaModule)
        mapper.readValue(path, clazz)
    }
    
    val jackson = new ObjectMapper()
    jackson.registerModule(DefaultScalaModule)
    
    val config:TeamstoryPluginConfig = readJson(new File("teamstory-plugin.json"), classOf[TeamstoryPluginConfig])
    
    var backlogNamesCache = List[TeamstoryOverview]()

    def backlogsUrl = config.url + "/api/backlogs/"
    def historyUrl(backlogId:Int) =  s"${config.url}/api/backlogs/${backlogId}/history?showLatestEvenIfWip=false"
    
    var maybeAlreadyDefinedSessionId:Option[String] = None
    
    private def authenticatedHttpClient() = {
      
        val client = new HttpClient()
        val sessionId = maybeAlreadyDefinedSessionId match {
          case None =>{
            println("Starting a new TeamStory session")
            val httpRequest = new PostMethod(config.url + "/api/sessions")
            val authRequest = TeamstoryAuthRequest(email=config.username, password=config.password)
            
            httpRequest.setRequestBody(jackson.writeValueAsString(authRequest))
            
            val responseCode = client.executeMethod(httpRequest)
            val sessionURI = httpRequest.getResponseHeader("Location").getValue()
            val sessionId = sessionURI.replaceAllLiterally("/api/sessions/", "");
            maybeAlreadyDefinedSessionId = Some(sessionId)
            sessionId
          }
          case Some(sessionId) => sessionId
        }
        
        client.getState().addCookie(cookie(
                            domain=new URL(config.url).getHost(), 
                            name="session", 
                            value=sessionId, 
                            path="/",
                            expires = null,
                            secure = false))
        client
    }
    
    private def cookie(domain:String, name:String, value:String, 
                       path:String, expires:java.util.Date , secure:Boolean) = new Cookie(domain, name, value, path, expires, secure)
    
    private def fetchBacklogList() = {
        
        val request = new GetMethod(backlogsUrl)
        val client = authenticatedHttpClient()
        val response = client.executeMethod(request)

        var body = ""

        if (response != 200) {
            throw new Exception(s"got ${response} when fetching backlogs list from etherlog")
        }

        body = request.getResponseBodyAsString()
        val mapper = new ObjectMapper()
        mapper.registerModule(DefaultScalaModule)
        mapper.readValue(body, classOf[Array[TeamstoryOverview]]).toList

    }

    override def listSources():List[ExternalSource] = {
        val sources = fetchBacklogList()
        backlogNamesCache = sources;
        println(sources)
        return sources.filter(!_.whenArchived.isDefined).map{backlogInfo=>
            ExternalSource(externalId = backlogInfo.id, name= "etherlog: " + backlogInfo.name)
        }
    }
    
    private def readResponseJson[T](request: HttpMethodBase, clazz:Class[T]):T = {
      jackson.readValue(request.getResponseBodyAsStream(), clazz)
    }
    
    
    // yucky duplication!
    private def getJson[T](url:String, clazz:Class[T]):Option[T] = {
      val request = new GetMethod(url)
      val client = authenticatedHttpClient()
      val response = client.executeMethod(request)
      response match {
        case 200=>Some(jackson.readValue(request.getResponseBodyAsStream(), clazz))
        case _ => None
      }
    }
    
    private def getJson[T](url:String, clazz:TypeReference[T]):Option[T] = {
      val request = new GetMethod(url)
      val client = authenticatedHttpClient()
      val response = client.executeMethod(request)
      response match {
        case 200=>Some(jackson.readValue(request.getResponseBodyAsStream(), clazz))
        case _ => None
      }
    }
    // end yucky duplication

    def getHistory(id:Int) = {
      getJson(historyUrl(id), new TypeReference[java.util.List[TeamstoryHistoryEntry]](){})
    }
    
    def getLatestPublishedVersion(id:Int):Option[TeamstoryExternalItems] = {
      getHistory(id) match {
        case None=> {
          println("no history for " + id) 
          None
        }
        case Some(history)=>{
          val lastPublishedVersionId = history.head.version
          val url = s"${config.url}/api/backlogs/${id}/history/${lastPublishedVersionId}"
          getJson(url, classOf[TeamstoryExternalItems])
        }
      }
    }
    
    override def listItemSuggestions(externalSourceId:String):List[ExternalItemSuggestion] = {
      
      getLatestPublishedVersion(externalSourceId.toInt) match {
        case None => List()
        case Some(backlog)=> backlog.items
                            .filter(_.kind == "story")
                            .filter(_.isComplete == false)
                            .map(parseEtherlogItem(_, externalSourceId))
      }
    }

    def canHandle(pluginType:String): Boolean = {
        if ("etherlog".equalsIgnoreCase(pluginType)) {
            return true
        }
        false
    }

    override def getSourceName(externalSourceId:String):String = {
        if (backlogNamesCache.isEmpty){
            backlogNamesCache = fetchBacklogList()
        }
        backlogNamesCache.find(_.id == externalSourceId) match {
            case Some(item) => item.name
            case None => "name missing???"
        }
    }

    def parseEtherlogItem(etherlogItem:TeamstoryItem, sourceId:String):ExternalItemSuggestion = {
        val backlogName = getSourceName(sourceId)
        val firstLine = etherlogItem.name.lines.toList.headOption.getOrElse("")
        val truncatedName = if(firstLine.length>100){
            firstLine.substring(0, 100) + "..."
        }else {
            firstLine
        }
        val itemLink = s"${config.url}/backlog/${sourceId}#${etherlogItem.id}"
        val stickyContentHTML =
          s"""<a href="${itemLink}" style="
                      background: #418F3A;
                      color: white;
                      display: block;">${backlogName}</a>
          <div style="white-space:pre-line;">${truncatedName} </div>
        """
          .replace(System.getProperty("line.separator"), " ")
          .replaceAll("  *", " ")

      // Markdown does not support css classes or styles, so I put the html back, but one day...
        val stickyContentMarkDown = s"""[${backlogName}](${itemLink})\n${truncatedName}"""

        val stickyContent = stickyContentHTML
        val externalItem = new ExternalItemSuggestion(externalId = etherlogItem.id,
                                                      name = etherlogItem.name,
                                                      content = stickyContent )
        return externalItem
    }
}
