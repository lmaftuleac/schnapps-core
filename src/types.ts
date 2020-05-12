
export interface LooseObject {
  [key: string]: any 
}

export interface RequestObj extends Request, LooseObject {}

export interface ResponseObj extends Response, LooseObject {}

export interface ControllerBackboneClass {
  nodes: LayerNodeType[]
  controller: ControllerFunction | null
  endCallback: EndChainCallback | null
  catchCallback: CatchErrorCallback | null
  start: { (req: RequestObj, res: ResponseObj, data: any): void }
  getFirstNode: { (): LayerNodeType | undefined }
  getLastNode: { (): LayerNodeType | undefined }
  pushNode: { (node: LayerNodeType): void }
  unshiftNode: { (node: LayerNodeType): void }
  appendNodes: { (nodes: LayerNodeType[]): void }
  prependNodes: { (nodes: LayerNodeType[]): void }

  do: {
    (handler: HandlerFunction): ControllerFunction 
    (controller: ControllerFunction): ControllerFunction 
  }
  beforeAll: {
    (handler: HandlerFunction): ControllerFunction 
    (controller: ControllerFunction): ControllerFunction 
  }
  catch: { (errorCallback: CatchErrorCallback ): ControllerFunction }
  end: { (errorCallback: EndChainCallback ): ControllerFunction }
  toMiddleware: { (): Function } 
  promise: { (request: RequestObj, response: ResponseObj, data: any): Promise<any> }
}

export interface ControllerFunction {
  (request: RequestObj, response: ResponseObj, data: any): void
  do?: { (handler: HandlerFunction | ControllerFunction ): ControllerFunction }
  beforeAll?: { (handler: HandlerFunction | ControllerFunction ): ControllerFunction }
  catch?: { (errorCallback: CatchErrorCallback ): ControllerFunction }
  end?: { (errorCallback: EndFunction ): ControllerFunction }
  toMiddleware?: { (): Function } 
  promise?: { (request: RequestObj, response: ResponseObj, data: any): Promise<any> }
  backbone?: ControllerBackboneClass
}

export interface LayerNodeType {
  handler: HandlerFunction
  nextNode: LayerNodeType | null
  link: { (node: LayerNodeType): void }
}

export interface HandlerFunction {
    (request: RequestObj, response: ResponseObj, next: NextFunction, errorCallback: ErrorCallback, data: any): void;
};

export interface EndFunction {
  (request: RequestObj, response: ResponseObj, errorCallback: ErrorCallback): void;
};

export interface ErrorCallback {
  (error: Error | Object | any): void
}

export interface CatchErrorCallback {
  (request:RequestObj, response:ResponseObj, error: Error | Object | any): void
}

export interface EndChainCallback {
  (request: RequestObj, response: ResponseObj, errorCallback: ErrorCallback, data: any): void;
}

export interface NextFunction {
  (data: any): void
  (controller: ControllerFunction, data?: any, opts?: BranchOptions ): void
}

export interface BranchOptions {
  reroute?: Boolean
}

export interface ControllerInitiator {
  (...args: Array<HandlerFunction | ControllerFunction>): ControllerFunction
  setDefaultErrorHandler: Function
}