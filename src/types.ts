import * as express from 'express'

export type RequestObj = Request | express.Request | Object
export type ResponseObj = Response | express.Response | Object

export interface ControllerBackboneClass {
  nodes: LayerNodeType[]
  controller: ControllerFunction | null
  endCallback: EndChainCallback | null
  catchCallback: CatchErrorCallback | null
  start?: any
  pushNode?: any
  unshiftNode?: any
  appendNodes?: any
  prependNodes?: any  

  do: { (param: HandlerFunction | ControllerFunction ): ControllerFunction }
  beforeAll: { (param: HandlerFunction | ControllerFunction ): ControllerFunction }
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
  (arg: any | ControllerFunction, d?: any, opts?: BranchInputOptions ): void
}

export interface BranchInputOptions {
  reroute?: Boolean
}

export interface ControllerInitiator {
  (): ControllerFunction
  setDefaultErrorHandler: Function
}

export interface InitiationFunction {
  (request: RequestObj, response: ResponseObj, data: any): void;
}