import { Maybe } from "purify-ts";
import TanaDragEventPublisher from ".";
import TanaDomNodeProvider from "../../StaticModules/TanaDomNodeProvider";
import { InitEvent } from "../EventBus/types/Event";
import TanaPublisher from "../EventBus/types/TanaPublisher";
import OnDomRenderCompleteEvent from "../TanaModuleLoader/types/OnDomRenderCompleteEvent";
import OnDragEvent from "./types/OnDragEvent";
import EventBus from "../EventBus";

const MOVE_COUNT_THRESHOLD = 15 

export default class DragEventPublisher extends TanaPublisher<TanaDragEventPublisher> {
    doc: Document

    constructor(mediator:TanaDragEventPublisher,eventBus:EventBus,doc:Document) {
        super(mediator,eventBus)
        this.doc = doc 
    }

    getInitRequirements(): InitEvent[] {
       return [
        OnDomRenderCompleteEvent
       ]
    }

    onDependenciesInitComplete() {
        this.initEvents()
    }

    private initEvents() {
        this.initMouseDownEvent()
        this.initMouseUpEvent()
        this.initMouseMoveEvent()
        this.initMouseOverEvent()
    }

    private invokeDropEvent(tanaNodeId:string,event:MouseEvent,targetElement:HTMLElement) {
        const dropEvent = OnDragEvent.createInstance({tanaNodeId,event,targetElement})
        this.dispatchRuntimeEvent(dropEvent)
    }

    private initMouseDownEvent() {
        this.doc.addEventListener("mousedown",(event) => {
            this.mediator.getDragStateHandler().resetMoveCount()
            this.mediator.getDragStateHandler().clearTanaNodeId()
            this.mediator.getDragStateHandler().resetHoverElement()
            Maybe.fromNullable(TanaDomNodeProvider.getContentNodeFromDescendant(event.target as HTMLElement) as HTMLElement)
                .map(contentNode => {
                    const tanaNodeId = TanaDomNodeProvider.getIdFromElement(contentNode)
                    if (!tanaNodeId) return 
                    this.mediator.getDragStateHandler().setTanaNodeId(tanaNodeId)
                    console.log("mousedown")
                })
        })
    }

    private initMouseMoveEvent() {
        this.doc.addEventListener("mousemove", () => {
            this.mediator.getDragStateHandler().incrementMoveCount()
        })
    }

    private isDragHand(event:MouseEvent) {
        return event.target && (event.target as HTMLElement).classList.contains("dragHand")
    }

    private initMouseOverEvent() {
        this.doc.addEventListener("mouseover",(event) => {
            if (this.isDragHand(event)) return 
            this.mediator.getDragStateHandler().setHoverElement(event.target as HTMLElement)
        })
    }

    private initMouseUpEvent() {
        this.doc.addEventListener("mouseup",(event) => {
            const moveCount = this.mediator.getDragStateHandler().getMoveCount()
            const tanaNodeId = this.mediator.getDragStateHandler().getTanaNodeId()
            const hoverElement = this.mediator.getDragStateHandler().getHoverElement()

            if (moveCount < MOVE_COUNT_THRESHOLD) return 
            if (!tanaNodeId) return 
            if (!hoverElement) return 

            console.log("invoke drop event",tanaNodeId,event,hoverElement)
            this.invokeDropEvent(tanaNodeId,event,hoverElement)
        })
    }

}