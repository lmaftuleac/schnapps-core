import { controller } from './index';
import { HandlerFunction, RequestObj, ResponseObj, ControllerFunction } from './types';

const sessiondHandler: HandlerFunction = (req: RequestObj, res: ResponseObj, next, errCb, data) => {
  if (req.session) {
    return next(data)
  }

  req.session = {}
  req.setSession = (sessionData: { [key: string]: any }) => {
    req.session = { ...req.session, ...sessionData }
  }
  return next(data)
}

export const session: ControllerFunction = controller(sessiondHandler)