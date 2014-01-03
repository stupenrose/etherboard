package com.cj.nan.etherboard

import java.net.URI


case class ExternalSource (externalId:String, name:String)
case class ExternalItemSuggestion (externalId:String, name:String, content:String)

trait Plugin  {
    def listSources():List[ExternalSource]
    def listItemSuggestions(externalSourceId:String):List[ExternalItemSuggestion]
}


