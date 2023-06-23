import TanaNodePortalState from "../../../../StaticModules/TanaNodePortalRenderer/TanaNodePortalState";
import { DropEventContent } from "../../../TanaDragEventPublisher/types/OnDropEvent";




export default interface ExpandedDropEventContent extends DropEventContent {
    portalStateHandler: TanaNodePortalState 
    contentDomNode: HTMLElement
    nodePath:string 
}