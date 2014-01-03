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

    override def listSources():List[ExternalSource] = {
        val request = new GetMethod(config.url)
        val client = new HttpClient()
        val response = client.executeMethod(request)

        var body = ""
        if (response == 200) {
            body = request.getResponseBodyAsString()
            val mapper = new ObjectMapper()
            mapper.registerModule(DefaultScalaModule)
            val sources:List[EtherlogOverview] = mapper.readValue(body, classOf[Array[EtherlogOverview]]).toList

            println(sources.head)

            return sources.map{backlogInfo=>
                ExternalSource(externalId = backlogInfo.id, name= "etherlog: " + backlogInfo.name)
            }
        }

        null
    }

    override def listItemSuggestions(externalSourceId:String):List[ExternalItem] = {
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
                            .map(parseEtherlogItem(_))
        }

        null
    }

    def parseEtherlogItem(etherlogItem:EtherlogItem):ExternalItem = {
        val externalItem = new ExternalItem(externalId = etherlogItem.id, name = "<pre>" + etherlogItem.name + "</pre>")
        return externalItem
    }
}
