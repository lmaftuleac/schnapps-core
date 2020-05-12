import { ControllerBackbone } from './controller-backbone'
import {
  ControllerInitiator,
  ControllerFunction,
} from './types'

export const controller: ControllerInitiator = (...handlers): ControllerFunction => {
  const instance = new ControllerBackbone()
  const controllerFn: ControllerFunction = instance.controller
  controllerFn.promise = instance.promise.bind(instance)
  controllerFn.toMiddleware = instance.toMiddleware.bind(instance)
  controllerFn.beforeAll = instance.beforeAll.bind(instance)
  controllerFn.do = instance.do.bind(instance)
  controllerFn.catch = instance.catch.bind(instance)
  controllerFn.end = instance.end.bind(instance)
  controllerFn.backbone = instance

  if (handlers && handlers.length) {
    handlers.forEach(handler => controllerFn.do(handler))
  }

  return controllerFn
}

controller.setDefaultErrorHandler = ControllerBackbone.setDefaultErrorHandler
