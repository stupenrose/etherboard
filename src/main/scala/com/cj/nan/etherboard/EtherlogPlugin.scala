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

@JsonIgnoreProperties(ignoreUnknown = true)
case class EtherlogEstimate (id:String, currency:String, value:Int, when: Long)

@JsonIgnoreProperties(ignoreUnknown = true)
case class EtherlogItem (id:String, name:String, kind:String, estimates:List[EtherlogEstimate], isComplete:Boolean)

@JsonIgnoreProperties(ignoreUnknown = true)
case class EtherlogExternalItems (id:String, name:String, memo:String, items: List[EtherlogItem])

@JsonIgnoreProperties(ignoreUnknown = true)
case class EtherlogOverview (id:String, name:String, whenArchived:Option[Long])

@JsonIgnoreProperties(ignoreUnknown = true)
case class EtherlogHistoryEntry(version: String, when:Long, memo:String)

@JsonIgnoreProperties(ignoreUnknown = true)
case class EtherlogPluginConfig (url: String)

class EtherlogPlugin()  extends Plugin {

    def readJson[T](path:File, clazz:Class[T]):T = {
        val mapper = new ObjectMapper()
        mapper.registerModule(DefaultScalaModule)
        mapper.readValue(path, clazz)
    }
    
    val jackson = new ObjectMapper()
    jackson.registerModule(DefaultScalaModule)
    
    val config:EtherlogPluginConfig = readJson(new File("etherlogplugin.json"), classOf[EtherlogPluginConfig])
    
    var backlogNamesCache = List[EtherlogOverview]()

    def backlogsUrl = config.url + "/api/backlogs/"
    def historyUrl(backlogId:Int) =  s"${config.url}/api/backlogs/${backlogId}/history?showLatestEvenIfWip=false"
    private def fetchBacklogList() = {
        
        val request = new GetMethod(backlogsUrl)
        val client = new HttpClient()
        val response = client.executeMethod(request)

        var body = ""

        if (response != 200) {
            throw new Exception(s"got ${response} when fetching backlogs list from etherlog")
        }

        body = request.getResponseBodyAsString()
        val mapper = new ObjectMapper()
        mapper.registerModule(DefaultScalaModule)
        mapper.readValue(body, classOf[Array[EtherlogOverview]]).toList

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
      val client = new HttpClient()
      val response = client.executeMethod(request)
      response match {
        case 200=>Some(jackson.readValue(request.getResponseBodyAsStream(), clazz))
        case _ => None
      }
    }
    
    private def getJson[T](url:String, clazz:TypeReference[T]):Option[T] = {
      val request = new GetMethod(url)
      val client = new HttpClient()
      val response = client.executeMethod(request)
      response match {
        case 200=>Some(jackson.readValue(request.getResponseBodyAsStream(), clazz))
        case _ => None
      }
    }
    // end yucky duplication

    def getHistory(id:Int) = {
      getJson(historyUrl(id), new TypeReference[java.util.List[EtherlogHistoryEntry]](){})
    }
    
    def getLatestPublishedVersion(id:Int):Option[EtherlogExternalItems] = {
      getHistory(id) match {
        case None=> {
          println("no history for " + id) 
          None
        }
        case Some(history)=>{
          val lastPublishedVersionId = history.head.version
          val url = s"${config.url}/api/backlogs/${id}/history/${lastPublishedVersionId}"
          getJson(url, classOf[EtherlogExternalItems])
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

    def parseEtherlogItem(etherlogItem:EtherlogItem, sourceId:String):ExternalItemSuggestion = {
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
