package com.cj.nan.etherboard

import org.apache.commons.httpclient.methods.GetMethod
import org.apache.commons.httpclient.HttpClient
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import java.io.File
import com.fasterxml.jackson.annotation.JsonIgnoreProperties


@JsonIgnoreProperties(ignoreUnknown = true)
case class EtherlogEstimate (id:String, currency:String, value:Int, when: Long)
@JsonIgnoreProperties(ignoreUnknown = true)
case class EtherlogItem (id:String, name:String, kind:String, estimates:List[EtherlogEstimate], isComplete:Boolean)
@JsonIgnoreProperties(ignoreUnknown = true)
case class EtherlogExternalItems (id:String, name:String, memo:String, items: List[EtherlogItem])

//@JsonIgnoreProperties(ignoreUnknown = true)
//case class EtherlogInfo (name:String)
//
//@JsonIgnoreProperties(ignoreUnknown = true)
//case class EtherlogsListing (id:String, currency:String, value:Int, when: Long)


case class EtherlogOverview (id:String, name:String)

case class EtherlogPluginConfig (url:String)

class EtherlogPlugin()  extends Plugin {

    def readJson[T](path:File, clazz:Class[T]):T = {
        val mapper = new ObjectMapper()
        mapper.registerModule(DefaultScalaModule)
        mapper.readValue(path, clazz)
    }

    val config:EtherlogPluginConfig = readJson(new File("etherlogplugin.json"), classOf[EtherlogPluginConfig])

    var backlogNamesCache = List[EtherlogOverview]()


    private def fetchBacklogList() = {
        val request = new GetMethod(config.url)
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

        return sources.map{backlogInfo=>
            ExternalSource(externalId = backlogInfo.id, name= "etherlog: " + backlogInfo.name)
        }

//        val request = new GetMethod(config.url)
//        val client = new HttpClient()
//        val response = client.executeMethod(request)
//
//        var body = ""
//        if (response == 200) {
//            body = request.getResponseBodyAsString()
//            val mapper = new ObjectMapper()
//            mapper.registerModule(DefaultScalaModule)
//            val sources:List[EtherlogOverview] = mapper.readValue(body, classOf[Array[EtherlogOverview]]).toList
//
//
//        }
//
//        null
    }

    override def listItemSuggestions(externalSourceId:String):List[ExternalItemSuggestion] = {
        println("Somebody asked me to list items for this source: " + externalSourceId)
        val request = new GetMethod(config.url + externalSourceId)
        val client = new HttpClient()
        val response = client.executeMethod(request)
        var body = ""
        if (response == 200) {
            val mapper = new ObjectMapper()
            mapper.registerModule(DefaultScalaModule)
            body = request.getResponseBodyAsString()
            val etherlogItemWrapper = mapper.readValue(body, classOf[EtherlogExternalItems])

            return etherlogItemWrapper
                            .items
                            .filter(_.kind == "story")
                            .filter(_.isComplete == false)
                            .map(parseEtherlogItem(_, externalSourceId))
        }

        null
    }

    def getBacklogName(id:String):String = {
        if (backlogNamesCache.isEmpty){
            backlogNamesCache = fetchBacklogList()
        }
        backlogNamesCache.find(_.id == id) match {
            case Some(item) => item.name
            case None => "name missing???"
        }
    }

    def parseEtherlogItem(etherlogItem:EtherlogItem, sourceId:String):ExternalItemSuggestion = {
        /*
        val stickyContent = 
        """<a href="http://cjtools101.wl.cj.com:43180/backlog/"""" + sourceId + """ style="
            background: #418F3A;
                color: white;
                    display: block;
                    ">Etherlog</a><div style=white-space:pre-line;">""" + etherlogItem.name + "</div>"
        */
        /*
        val externalItem = new ExternalItem(externalId = etherlogItem.id, name = "<pre>" + etherlogItem.name + "</pre>")
         */

        val backlogName = getBacklogName(sourceId)

        val truncatedName = if(etherlogItem.name.length>100){
            etherlogItem.name.substring(0, 100) + "..."
        }else {
            etherlogItem.name
        }
        val stickyContent = s"""
          <a href="http://cjtools101.wl.cj.com:43180/backlog/$sourceId" style="
                      background: #418F3A;
                      color: white;
                      display: block;">${backlogName}</a>
          <div style="white-space:pre-line;">${truncatedName} </div>
        """
        val externalItem = new ExternalItemSuggestion(externalId = etherlogItem.id,
                                                      name = etherlogItem.name,
                                                      content = stickyContent )
        return externalItem
    }
}
