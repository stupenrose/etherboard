package com.cj.nan.etherboard

import java.net.URI


case class ExternalSource (externalId:String, name:String)
case class ExternalItemSuggestion (externalId:String, name:String, content:String)

trait Plugin  {
    def listSources():List[ExternalSource]
    def listItemSuggestions(externalSourceId:String):List[ExternalItemSuggestion]
    def canHandle(sourceType:String):Boolean
    def getSourceName(externalSourceId:String):String
    def createMessage(boardObject:BoardObject, externalSourceId: String, msgContent: String):String
    
    
}


