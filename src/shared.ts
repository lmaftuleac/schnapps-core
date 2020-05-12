import { controller } from './index';
import { HandlerFunction, RequestObj, ResponseObj, ControllerFunction } from './types';

const sharedHandler: HandlerFunction = (req: RequestObj, res: ResponseObj, next, errCb, data) => {
  if (req.shared) {
    return next(data)
  }

  req.shared = {}
  req.setShared = (sharedData: { [key: string]: any }) => {
    req.shared = { ...req.shared, ...sharedData }
  }
  return next(data)
}

export const shared: ControllerFunction = controller(sharedHandler)