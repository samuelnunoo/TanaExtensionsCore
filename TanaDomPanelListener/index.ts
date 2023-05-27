import {
    TANA_DATA_PANEL_ATTRIBUTE,
    TANA_DATA_PANEL_CSS_SELECTOR,
    TANA_DOCKS_CONTAINER_CSS_SELECTOR
} from "./types";
import {
    DOCK_PANEL_CONTAINER_ATTRIBUTE_NAME,
    IDomPanelListener,
    MAIN_PANEL_CONTAINER_ATTRIBUTE_NAME,
    MAIN_PANEL_CONTAINER_ATTRIBUTE_VALUE,
    MAIN_PANEL_CSS_SELECTOR,
    PanelContainerType,
    PanelEvent,
    PanelEvenTypeEnum,
    RIGHT_DOCK_ATTRIBUTE_VALUE,
    TOP_DOCK_ATTRIBUTE_VALUE
} from "./types";

export default new class TanaDomPanelListener {
    private listeners: IDomPanelListener[] = []
    private dockObserver: MutationObserver = new MutationObserver(this.handleDockContainerChildListMutationEvent.bind(this))
    private panelContainerObservers: Map<HTMLElement,MutationObserver> = new Map()
    private panelObserver: Map<HTMLElement,MutationObserver> = new Map()
    private mainDockObserver = new MutationObserver(this.handleMainDockChildListMutationEvent.bind(this))
    public init() {
        const dockContainer = document.querySelector(TANA_DOCKS_CONTAINER_CSS_SELECTOR)
        const mainDock = dockContainer!.querySelector(MAIN_PANEL_CSS_SELECTOR)
        this.observeDocks(Array.from(dockContainer!.childNodes)as HTMLElement[])
        this.dockObserver.observe(dockContainer!,{
            childList: true
        })
        this.mainDockObserver.observe(mainDock!,{
            childList: true
        })
    }

    public invokeInitialPanelEvents() {
        const dockContainer = document.querySelector(TANA_DOCKS_CONTAINER_CSS_SELECTOR)
        const docks = Array.from(dockContainer!.childNodes)as HTMLElement[]
        docks.forEach(dock => {
            const panelContainer = dock.querySelector("div")
            const panels = Array.from(panelContainer!.childNodes) as HTMLElement[]
            panels.forEach(panel => {
                const dataPanelId = panel.getAttribute(TANA_DATA_PANEL_ATTRIBUTE)
                const panelEvent = this.createPanelEvent(panel,panelContainer,dataPanelId!,false)
                this.invokeListeners(panelEvent)
            })
        })
    }
    public registerListener(listener:IDomPanelListener) {
        this.listeners.push(listener)
    }
    public unregisterListener(listener:IDomPanelListener) {
        this.listeners = this.listeners.filter(l => l != listener)
    }
    private invokeListeners(panelEvent:PanelEvent) {
        console.log("PanelEvent", panelEvent)
        for (const listener of this.listeners) {
            listener.onPanelEvent(panelEvent)
        }
    }
    private observePanels(panels:HTMLElement[]) {
        panels.forEach(panel => {
            this.unobservePanels([panel])
            const mutationObserver = new MutationObserver(this.handlePanelIdChangeEvent.bind(this))
            mutationObserver.observe(panel,{
                attributeFilter: [TANA_DATA_PANEL_ATTRIBUTE]
            })
            this.panelObserver.set(panel,mutationObserver)
        })
    }
    private unobservePanels(panels:HTMLElement[]) {
        panels.forEach(panel => {
            if (this.panelObserver.has(panel)) {
                this.panelObserver.get(panel)!.disconnect()
                this.panelObserver.delete(panel)
            }
        })
    }
    private observeDocks(docks:HTMLElement[]) {
      /*
        -----------------------------------------------------------------------
        case Insertion of Dock (From Observer on DockContainer):
            - get docks.panelContainer and add —a listener on it
            - get panels from docks.panelContainer and add listener on it

        case Deletion of Dock:
            - get docks.panelContainer and remove the listener on it
            - get panels from docks.panelContainer and remove the listeners on it

        case Insertion of Panel (From Observer on Docks.PanelContainer):
            - add a mutationObserver to the panel and add it to the map

        case Deletion of Panel (From Observer on Docks.PanelContainer):
            - get the mutationObserver from the map and disconnect and delete it
        ------------------------------------------------------------------------
        init():
            - observeDocks
                - for each dock
                    - observeDockPanelContainer
                        - unobserveDockPanelContainer
                        - set: panelContainerObserver with panelContainer
                    - observePanels
                        for each panel
                        - unobserve panel
                        - set panelObserver with panel

        events:
            - dockObserver @handleDockChildListMutationEvent
              so this occurs when a dock is removed or added
              my one question is how does the ordering of the mutationRecords work
              they are ordered in the order they are received.
              So if you get a deletion then a creation next it happened in that order
              and that's how you shold process it.

              My next question is can the same elem,ent be deleted and created within the
              same mutationrecord?
              no

            - panelContainerObservers @handlePanelContainerChildListMutationEvent
            - panelObservers @handlePanelIdChangeEvent


         */
        docks.forEach(dock => {
            const panelContainer = dock.querySelector("div")
            if (!panelContainer) return
            const panels = Array.from(panelContainer.childNodes) as HTMLElement[]
            this.observeDockPanelContainers([panelContainer])
            this.observePanels(panels)
        })
    }
    private unobserveDocks(docks: HTMLElement[]) {
        docks.forEach(dock => {
            const panelContainer = dock.querySelector("div")
            const panels = Array.from(panelContainer!.childNodes) as HTMLElement[]
            this.unobserveDockPanelContainers([panelContainer!])
            this.unobservePanels(panels)
        })
    }
    private observeDockPanelContainers(panelContainers:HTMLElement[]) {
        panelContainers.forEach(panelContainer => {
            this.unobserveDockPanelContainers([panelContainer])
            const mutationObserver = new MutationObserver(this.handlePanelContainerChildListMutationEvent.bind(this))
            mutationObserver.observe(panelContainer,{
                childList:true
            })
            this.panelContainerObservers.set(panelContainer,mutationObserver)
        })

    }
    private unobserveDockPanelContainers(panelContainers:HTMLElement[]) {
        panelContainers.forEach(panelContainer => {
            if (this.panelContainerObservers.has(panelContainer)) {
                this.panelContainerObservers.get(panelContainer)!.disconnect()
                this.panelContainerObservers.delete(panelContainer)
            }
        })

    }

    /*
    I have no clue if this is needed so...
     */
    private handlePanelIdChangeEvent(mutationList:MutationRecord[],observer:MutationObserver) {
       for (const mutation of mutationList) {
            this.invokePanelIdChangeEvent(mutation)
       }
    }
    private handlePanelContainerChildListMutationEvent(mutationList:MutationRecord[], observer:MutationObserver) {
        for (const mutation of mutationList) {
            this.unobservePanels(Array.from(mutation.removedNodes) as HTMLElement[])
            this.observePanels(Array.from(mutation.addedNodes ) as HTMLElement[])
            this.invokePanelEvent(mutation)
        }
    }
    private handleDockContainerChildListMutationEvent(mutationList: MutationRecord[], observer: MutationObserver) {
        for (const mutation of mutationList) {
            this.unobserveDocks(Array.from(mutation.removedNodes) as HTMLElement[])
            this.observeDocks(Array.from(mutation.addedNodes) as HTMLElement[])
            this.invokeDockEvent(mutation)
        }
    }
    private handleMainDockChildListMutationEvent(mutationList: MutationRecord[], observer: MutationObserver) {
        for (const mutation of mutationList) {
            if (!this.mutationInvolvesPanelContainer(mutation)) continue
            const isRemove = mutation.removedNodes.length > 0
            const panelContainer = mutation.target as HTMLElement
            const panel = panelContainer.querySelector(TANA_DATA_PANEL_CSS_SELECTOR) as HTMLElement
            const dataPanelId = panel.getAttribute(TANA_DATA_PANEL_ATTRIBUTE)
            const panelEvent = this.createPanelEvent(panel,panelContainer,dataPanelId!,isRemove)
            this.invokeListeners(panelEvent)
        }
    }

    /*
    @todo  iterate on this
    Straight up no clue if this will ever be needed but keep for now
     */
    private invokePanelIdChangeEvent(mutation:MutationRecord) {
        const isRemove = mutation.removedNodes.length > 0
        console.log("invokePanelIdChangeEvent: ",mutation)
    }
    private mutationInvolvesPanelContainer(mutation:MutationRecord) {
        const isRemoval = mutation.removedNodes.length > 0
        const htmlElement = (isRemoval ? mutation.removedNodes[0] : mutation.addedNodes[0]) as HTMLElement
        return htmlElement.childNodes.length > 0 && htmlElement.tagName == "DIV"
            ? (htmlElement.childNodes[0] as HTMLElement).hasAttribute(TANA_DATA_PANEL_ATTRIBUTE)
            : false
    }
    private invokeDockEvent(mutation:MutationRecord) {
        const isRemoval = mutation.removedNodes.length > 0
        const panelContainer = (isRemoval ? mutation.removedNodes[0] : mutation.addedNodes[0]) as HTMLElement
        const panel = panelContainer.querySelector(TANA_DATA_PANEL_CSS_SELECTOR) as HTMLElement
        const dataPanelId = panel.getAttribute(TANA_DATA_PANEL_ATTRIBUTE)
        const panelEvent = this.createPanelEvent(panel,panelContainer,dataPanelId!,isRemoval)
        this.invokeListeners(panelEvent)

    }
    private invokePanelEvent(mutation:MutationRecord) {
        const isRemoval = mutation.removedNodes.length > 0
        const panel = (isRemoval ? mutation.removedNodes[0] : mutation.addedNodes[0]) as HTMLElement
        const panelContainer = mutation.target.parentElement
        const dataPanelId = panel.getAttribute(TANA_DATA_PANEL_ATTRIBUTE)
        const panelEvent = this.createPanelEvent(panel,panelContainer!,dataPanelId!,isRemoval)!
        this.invokeListeners(panelEvent)
    }
    private createPanelEvent(panel:HTMLElement,panelContainer:HTMLElement,panelId:string,isRemoval:boolean) {
        const panelContainerType = this.getPanelContainerType(panelContainer)
        const panelEventType = isRemoval ? PanelEvenTypeEnum.Deletion : PanelEvenTypeEnum.Insertion
        return {
            panelId,
            panel,
            panelContainerType,
            panelEventType
        } as PanelEvent
    }
    private getPanelContainerType(panelContainer:HTMLElement): PanelContainerType|null {
        if (panelContainer.hasAttribute(MAIN_PANEL_CONTAINER_ATTRIBUTE_NAME)) {
            if (panelContainer.getAttribute(MAIN_PANEL_CONTAINER_ATTRIBUTE_NAME) == MAIN_PANEL_CONTAINER_ATTRIBUTE_VALUE) {
                return PanelContainerType.MainPanelContainer
            }
        }
        if (panelContainer.hasAttribute(DOCK_PANEL_CONTAINER_ATTRIBUTE_NAME)) {
            if (panelContainer.getAttribute(DOCK_PANEL_CONTAINER_ATTRIBUTE_NAME) == TOP_DOCK_ATTRIBUTE_VALUE) {
                return PanelContainerType.TopPanelContainer
            }
            if (panelContainer.getAttribute(DOCK_PANEL_CONTAINER_ATTRIBUTE_NAME) == RIGHT_DOCK_ATTRIBUTE_VALUE) {
                return PanelContainerType.RightPanelContainer
            }
        }
        return null
    }

}