import { controller } from './index';
import { HandlerFunction, RequestObj, ResponseObj, ControllerFunction } from './types';

const sharedHandler: HandlerFunction = (req: RequestObj, res: ResponseObj, next, errCb, data) => {
  if (req.shared) {
    return next(data)
  }
  const setShared = (sharedData: { [key: string]: any }) => {
    req.shared = { ...req.shared, ...sharedData }
  }
  const sharedStore = {
    shared: {},
    setShared
  }

  Object.assign(req, sharedStore)
  
  return next(data)
}

export const shared: ControllerFunction = controller(sharedHandler)