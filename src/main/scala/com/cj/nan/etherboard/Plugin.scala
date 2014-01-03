package com.cj.nan.etherboard

import java.net.URI


case class ExternalSource (externalId:String, name:String)
case class ExternalItem (externalId:String, name:String)

trait Plugin  {
    def listSources():List[ExternalSource]
    def listItemSuggestions(externalSourceId:String):List[ExternalItem]
}


